const { from } = require('pg-copy-streams');
const { Readable } = require('stream');
const pool = require('../config/database');
const s3Service = require('./s3Service');
const lasParser = require('../utils/lasParser');

class WellService {
  
  async processLASFile(file, wellId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Upload to S3
      const s3Key = s3Service.generateKey(wellId, file.originalname);
      await s3Service.uploadFile(s3Key, file.buffer, 'text/plain');
      
      // 2. Parse LAS
      const fileContent = file.buffer.toString('utf-8');
      const parsedData = lasParser.parse(fileContent);
      
      const totalRows = parsedData.data.length;
      const totalCurves = parsedData.curves.length - 1;
      const totalMeasurements = totalRows * totalCurves;
      
      console.log(`Processing well with ${totalMeasurements} measurements...`);
      
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
          [wellId, curve.mnemonic, curve.mnemonic, curve.unit, curve.description]
        );
        curveIds[curve.mnemonic] = curveResult.rows[0].id;
      }
      
      // 5. Bulk insert measurements - SMART METHOD SELECTION
      const depthMnemonic = parsedData.curves[0].mnemonic;
      
      if (totalMeasurements > 50000) {
        console.log('→ Using COPY for bulk insert');
        await this._insertMeasurementsCopy(client, parsedData, curveIds, depthMnemonic);
      } else {
        console.log('→ Using batched INSERT');
        await this._insertMeasurementsBatched(client, parsedData, curveIds, depthMnemonic);
      }
      
      // 6. Update curve statistics
      await this._updateCurveStatistics(client, curveIds, depthMnemonic);
      
      await client.query('COMMIT');
      
      return {
        well: wellResult.rows[0],
        curves: parsedData.curves,
        measurementCount: totalMeasurements,
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing LAS file:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // COPY implementation (FAST)
  async _insertMeasurementsCopy(client, parsedData, curveIds, depthMnemonic) {
    const startTime = Date.now();
    const csvLines = [];
    
    for (const dataPoint of parsedData.data) {
      const depth = dataPoint[depthMnemonic];
      
      for (const curve of parsedData.curves) {
        if (curve.mnemonic === depthMnemonic) continue;
        
        const curveId = curveIds[curve.mnemonic];
        const value = dataPoint[curve.mnemonic];
        const valueStr = value !== null ? value : '\\N';
        
        csvLines.push(`${curveId},${depth},${valueStr}`);
      }
    }
    
    const copyQuery = `
      COPY measurements (curve_id, depth, value)
      FROM STDIN
      WITH (FORMAT csv, NULL '\\N')
    `;
    
    const stream = client.query(from(copyQuery));
    const dataStream = Readable.from(csvLines.join('\n') + '\n');
    
    await new Promise((resolve, reject) => {
      dataStream.pipe(stream)
        .on('finish', () => {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`✅ COPY completed: ${csvLines.length} rows in ${duration}s`);
          resolve();
        })
        .on('error', reject);
    });
  }
  
  // Batched INSERT fallback (for small files)
  async _insertMeasurementsBatched(client, parsedData, curveIds, depthMnemonic) {
    const BATCH_SIZE = 5000;
    const allMeasurements = [];
    
    for (const dataPoint of parsedData.data) {
      const depth = dataPoint[depthMnemonic];
      
      for (const curve of parsedData.curves) {
        if (curve.mnemonic === depthMnemonic) continue;
        
        allMeasurements.push({
          curveId: curveIds[curve.mnemonic],
          depth: depth,
          value: dataPoint[curve.mnemonic]
        });
      }
    }
    
    for (let i = 0; i < allMeasurements.length; i += BATCH_SIZE) {
      const batch = allMeasurements.slice(i, i + BATCH_SIZE);
      
      const values = [];
      const params = [];
      let paramIndex = 1;
      
      for (const m of batch) {
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        params.push(m.curveId, m.depth, m.value);
        paramIndex += 3;
      }
      
      await client.query(
        `INSERT INTO measurements (curve_id, depth, value) VALUES ${values.join(', ')}`,
        params
      );
      
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, allMeasurements.length)}/${allMeasurements.length}`);
    }
  }
  
  async _updateCurveStatistics(client, curveIds, depthMnemonic) {
    for (const [mnemonic, curveId] of Object.entries(curveIds)) {
      if (mnemonic === depthMnemonic) continue;
      
      await client.query(
        `UPDATE curves
         SET min_value = (SELECT MIN(value) FROM measurements WHERE curve_id = $1 AND value IS NOT NULL),
             max_value = (SELECT MAX(value) FROM measurements WHERE curve_id = $1 AND value IS NOT NULL),
             mean_value = (SELECT AVG(value) FROM measurements WHERE curve_id = $1 AND value IS NOT NULL)
         WHERE id = $1`,
        [curveId]
      );
    }
  }
}

module.exports = new WellService();