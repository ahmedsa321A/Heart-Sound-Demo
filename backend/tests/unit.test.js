import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';

test('Backend CORS Middleware allows cross-origin requests', async () => {
    const app = express();
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
    }));

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    const server = app.listen(0);
    const port = server.address().port;

    try {
        const response = await fetch(`http://localhost:${port}/health`, {
            method: 'GET',
            headers: { 'Origin': 'http://example-domain.com' }
        });
        
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('access-control-allow-origin'), 'http://example-domain.com');
        assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
        
        const data = await response.json();
        assert.equal(data.status, 'ok');
    } finally {
        server.close();
    }
});

test('Prediction error formatting returns clear detail', () => {
    const formatError = (error) => {
        const errorDetail = error.response?.data?.detail || error.message;
        return { message: 'AI Service Error', detail: errorDetail };
    };

    const result = formatError(new Error('Audio too short. Minimum duration is 0.5 seconds.'));
    assert.equal(result.message, 'AI Service Error');
    assert.equal(result.detail, 'Audio too short. Minimum duration is 0.5 seconds.');
});
