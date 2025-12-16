import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Redis connection for BullMQ queues
 * Singleton connection to be shared across all queues and workers
 */
export const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
});

redisConnection.on('connect', () => {
    console.log('[Redis] Connected to Redis server');
});

redisConnection.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
});

export default redisConnection;
