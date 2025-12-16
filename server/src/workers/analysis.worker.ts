import { Worker, Job } from 'bullmq';
import { redisConnection } from '../queue/connection';
import { AnalysisService } from '../services/analysis.service';

interface AnalysisJobData {
    type: 'warm-cache' | 'calculate';
    period?: number;
}

/**
 * Analysis Worker
 * Periodically calculates market rankings and warms the Redis cache
 */
export const analysisWorker = new Worker<AnalysisJobData>(
    'AnalysisQueue',
    async (job: Job<AnalysisJobData>) => {
        console.log(`[AnalysisWorker] Processing job ${job.id}: ${job.data.type}`);

        try {
            if (job.data.type === 'warm-cache') {
                // Warm cache for all standard periods
                await AnalysisService.warmCache();
                return { success: true, type: 'warm-cache' };
            } else if (job.data.type === 'calculate' && job.data.period) {
                // Calculate for specific period
                const result = await AnalysisService.getAnalysis(job.data.period);
                return { success: !!result, period: job.data.period };
            }

            return { success: false, error: 'Unknown job type' };

        } catch (error) {
            console.error('[AnalysisWorker] Job failed:', error);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 1,
    }
);

// Event handlers
analysisWorker.on('completed', (job, result) => {
    console.log(`[AnalysisWorker] Job ${job.id} completed:`, result);
});

analysisWorker.on('failed', (job, err) => {
    console.error(`[AnalysisWorker] Job ${job?.id} failed:`, err.message);
});

console.log('[AnalysisWorker] Worker registered and listening');

export default analysisWorker;
