const { from } = require('pg-copy-streams');
const { Readable } = require('stream');
const pool = require('../config/database');
const s3Service = require('./s3Service');
const lasParser = require('./lasParser');


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

            console.log('Well metadata inserted:', wellResult.rows[0]);

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

            console.log('Curves inserted:', curveIds);

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


    async getAllWells() {
        const result = await pool.query(
            `SELECT id, well_name, field_name, filename, s3_key, start_depth, stop_depth, depth_unit, uploaded_at 
             FROM wells 
             ORDER BY uploaded_at DESC`
        );
        return result.rows;
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