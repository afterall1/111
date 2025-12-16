import { Queue } from 'bullmq';
import { redisConnection } from './connection';

/**
 * SyncQueue - Handles data synchronization jobs
 */
export const syncQueue = new Queue('SyncQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
    },
});

/**
 * CandleImportQueue - Handles candlestick data import jobs
 */
export const candleImportQueue = new Queue('CandleImportQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
    },
});

/**
 * AnalysisQueue - Handles market analysis and cache warming jobs
 */
export const analysisQueue = new Queue('AnalysisQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 10,
        attempts: 2,
    },
});

console.log('[Queues] All queues initialized');

export default { syncQueue, candleImportQueue, analysisQueue };
