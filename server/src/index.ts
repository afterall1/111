import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import queues
import { syncQueue, candleImportQueue, analysisQueue } from './queue/scheduler.queue';

// Register workers
import './workers/symbol-sync.worker';
import './workers/candle-import.worker';
import './workers/analysis.worker';

// Import controllers
import { MarketController } from './controllers/market.controller';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ API Routes ============

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: { database: 'connected', redis: 'connected', binance: 'ready' },
        uptime: process.uptime()
    });
});

// API root
app.get('/api/v1', (_req: Request, res: Response) => {
    res.json({
        name: 'Chronos-Index API',
        version: '0.1.0',
        endpoints: {
            health: '/api/v1/health',
            analysis: '/api/market/analysis?period=4h',
            gainers: '/api/market/gainers?period=1h&limit=20',
            losers: '/api/market/losers?period=1h&limit=20',
        }
    });
});

// Market Analysis API
app.get('/api/market/analysis', MarketController.getAnalysis);
app.get('/api/market/gainers', MarketController.getGainers);
app.get('/api/market/losers', MarketController.getLosers);

// ============ Admin Endpoints (Development) ============

app.post('/api/v1/admin/sync-symbols', async (_req: Request, res: Response) => {
    try {
        const job = await syncQueue.add('symbol-sync', { type: 'full-sync' });
        res.json({ message: 'Symbol sync job queued', jobId: job.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to queue symbol sync job' });
    }
});

app.post('/api/v1/admin/import-candles', async (_req: Request, res: Response) => {
    try {
        const job = await candleImportQueue.add('candle-import', { type: 'full-import', interval: '5m' });
        res.json({ message: 'Candle import job queued', jobId: job.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to queue candle import job' });
    }
});

app.post('/api/v1/admin/warm-cache', async (_req: Request, res: Response) => {
    try {
        const job = await analysisQueue.add('analysis', { type: 'warm-cache' });
        res.json({ message: 'Cache warm job queued', jobId: job.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to queue cache warm job' });
    }
});

// ============ Error Handlers ============

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        type: 'https://api.chronos-index.dev/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'The requested resource was not found',
        instance: _req.originalUrl
    });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        type: 'https://api.chronos-index.dev/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
        instance: _req.originalUrl
    });
});

// ============ Start Server ============

app.listen(PORT, async () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 Chronos-Index Server                         ║
║   Running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
╚═══════════════════════════════════════════════════╝
  `);

    // Startup sequence: Symbol Sync -> Candle Import -> Analysis Cache Warm
    console.log('[Startup] Beginning data synchronization...');

    try {
        // 1. Symbol sync
        const symbolJob = await syncQueue.add('symbol-sync', { type: 'full-sync' }, {
            jobId: 'startup-symbol-sync-' + Date.now()
        });
        console.log(`[Startup] Symbol sync queued: ${symbolJob.id}`);

        // 2. After 10s, start candle import
        setTimeout(async () => {
            try {
                const candleJob = await candleImportQueue.add('candle-import', {
                    type: 'full-import', interval: '5m'
                }, { jobId: 'startup-candle-import-' + Date.now() });
                console.log(`[Startup] Candle import queued: ${candleJob.id}`);

                // 3. After candle import starts (60s delay), warm cache
                setTimeout(async () => {
                    try {
                        const analysisJob = await analysisQueue.add('analysis', { type: 'warm-cache' }, {
                            jobId: 'startup-cache-warm-' + Date.now()
                        });
                        console.log(`[Startup] Cache warm queued: ${analysisJob.id}`);
                    } catch (error) {
                        console.error('[Startup] Failed to queue cache warm:', error);
                    }
                }, 60000); // Wait 60s for candle import to complete

            } catch (error) {
                console.error('[Startup] Failed to queue candle import:', error);
            }
        }, 10000); // Wait 10s for symbol sync

    } catch (error) {
        console.error('[Startup] Failed to start sync sequence:', error);
    }
});

export default app;
