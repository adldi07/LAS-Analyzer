const request = require('supertest');
const app = require('../src/server');
const pool = require('../src/config/database');

describe('API Endpoints', () => {
    afterAll(async () => {
        await pool.end();
    });

    describe('POST /api/wells', () => {
        test('should reject non-LAS files', async () => {
            const response = await request(app)
                .post('/api/wells')
                .attach('file', Buffer.from('not a las file'), 'test.txt');

            expect(response.status).toBe(400);
        });

        test('should accept valid LAS file', async () => {
            const lasContent = `~Version Information
                                VERS. 2.0:
                                ~Well Information
                                STRT.F 1000:
                                STOP.F 2000:
                                ~Curve Information
                                DEPT.F:
                                GR.GAPI:
                                ~ASCII
                                1000 100
                                1001 101`;  

            const response = await request(app)
                .post('/api/wells')
                .attach('file', Buffer.from(lasContent), 'test.las');

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('wellId');
        }, 10000); // Increase timeout for DB operations
    });

    describe('GET /api/wells/:wellId', () => {
        test('should return 404 for non-existent well', async () => {
            const response = await request(app)
                .get('/api/wells/00000000-0000-0000-0000-000000000000');

            expect(response.status).toBe(404);
        });
    });
});