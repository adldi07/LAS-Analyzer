const pool = require('../config/database'); // will create it later
const lasParser = require('./lasParser');
const s3Service = require('./s3Service');

class WellService {
  /**
   * Process and store uploaded LAS file
   */
  async processLASFile(file, wellId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Upload to S3
      const s3Key = s3Service.generateKey(wellId, file.originalname);
      const s3Result = await s3Service.uploadFile(
        s3Key,
        file.buffer,
        'text/plain'
      );

      // 2. Parse LAS file
      const fileContent = file.buffer.toString('utf-8');
      const parsedData = lasParser.parse(fileContent);

      // 3. Insert well metadata
      const wellResult = await client.query(
        `INSERT INTO wells 
         (id, filename, s3_key, well_name, field_name, 
          start_depth, stop_depth, step, depth_unit, header_info)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          wellId,
          file.originalname,
          s3Key,
          parsedData.well.WELL?.value || 'Unknown',
          parsedData.well.FLD?.value || null,
          parsedData.well.STRT?.value || null,
          parsedData.well.STOP?.value || null,
          parsedData.well.STEP?.value || null,
          parsedData.well.STRT?.unit || 'm',
          JSON.stringify(parsedData.well),
        ]
      );

      // 4. Insert curves
      const curveIds = {};
      for (const curve of parsedData.curves) {
        const curveResult = await client.query(
          `INSERT INTO curves 
           (well_id, mnemonic, curve_name, unit, description)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            wellId,
            curve.mnemonic,
            curve.mnemonic, // Use mnemonic as name for now
            curve.unit,
            curve.description,
          ]
        );
        curveIds[curve.mnemonic] = curveResult.rows[0].id;
      }

      // 5. Bulk insert measurements
      const depthMnemonic = parsedData.curves[0].mnemonic; // Usually DEPTH or DEPT
      
      // Build values array for bulk insert
      const values = [];
      let valueIndex = 1;
      const insertValues = [];

      for (const dataPoint of parsedData.data) {
        const depth = dataPoint[depthMnemonic];
        
        for (const curve of parsedData.curves) {
          if (curve.mnemonic === depthMnemonic) continue; // Skip depth itself
          
          const value = dataPoint[curve.mnemonic];
          const curveId = curveIds[curve.mnemonic];
          
          insertValues.push(curveId, depth, value);
          values.push(`($${valueIndex}, $${valueIndex + 1}, $${valueIndex + 2})`);
          valueIndex += 3;
        }
      }

      // Execute bulk insert
      if (insertValues.length > 0) {
        await client.query(
          `INSERT INTO measurements (curve_id, depth, value)
           VALUES ${values.join(', ')}`,
          insertValues
        );
      }

      // 6. Update curve statistics
      for (const [mnemonic, curveId] of Object.entries(curveIds)) {
        if (mnemonic === depthMnemonic) continue;
        
        await client.query(
          `UPDATE curves
           SET min_value = (SELECT MIN(value) FROM measurements WHERE curve_id = $1),
               max_value = (SELECT MAX(value) FROM measurements WHERE curve_id = $1),
               mean_value = (SELECT AVG(value) FROM measurements WHERE curve_id = $1)
           WHERE id = $1`,
          [curveId]
        );
      }

      await client.query('COMMIT');

      return {
        well: wellResult.rows[0],
        curves: parsedData.curves,
        measurementCount: parsedData.data.length * (parsedData.curves.length - 1),
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing LAS file:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get well with curves
   */
  async getWell(wellId) {
    const wellResult = await pool.query(
      'SELECT * FROM wells WHERE id = $1',
      [wellId]
    );

    if (wellResult.rows.length === 0) {
      throw new Error('Well not found');
    }

    const curvesResult = await pool.query(
      `SELECT id, mnemonic, curve_name, unit, description, 
              min_value, max_value, mean_value
       FROM curves
       WHERE well_id = $1
       ORDER BY mnemonic`,
      [wellId]
    );

    return {
      ...wellResult.rows[0],
      curves: curvesResult.rows,
    };
  }

  /**
   * Get measurement data for visualization
   */
  async getMeasurements(wellId, curveMnemonics, depthStart, depthStop) {
    // Get curve IDs
    const curveResult = await pool.query(
      `SELECT id, mnemonic FROM curves
       WHERE well_id = $1 AND mnemonic = ANY($2)`,
      [wellId, curveMnemonics]
    );

    if (curveResult.rows.length === 0) {
      throw new Error('No curves found');
    }

    const curveMap = {};
    curveResult.rows.forEach(row => {
      curveMap[row.id] = row.mnemonic;
    });

    // Get measurements
    const measurementResult = await pool.query(
      `SELECT curve_id, depth, value
       FROM measurements
       WHERE curve_id = ANY($1)
         AND depth BETWEEN $2 AND $3
         AND value IS NOT NULL
       ORDER BY depth`,
      [Object.keys(curveMap), depthStart, depthStop]
    );

    // Transform to format: { depth: [], GR: [], RHOB: [] }
    const data = {
      depth: [],
    };

    curveMnemonics.forEach(mnemonic => {
      data[mnemonic] = [];
    });

    const depthSet = new Set();
    
    measurementResult.rows.forEach(row => {
      const mnemonic = curveMap[row.curve_id];
      
      if (!depthSet.has(row.depth)) {
        data.depth.push(parseFloat(row.depth));
        depthSet.add(row.depth);
      }
      
      data[mnemonic].push(parseFloat(row.value));
    });

    return data;
  }
}

module.exports = new WellService();