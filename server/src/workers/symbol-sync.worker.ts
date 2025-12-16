import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redisConnection } from '../queue/connection';
import { binanceService, FilteredSymbol } from '../services/binance.service';

const prisma = new PrismaClient();

interface SymbolSyncJobData {
    type: 'full-sync' | 'incremental';
}

/**
 * Symbol Sync Worker
 * Synchronizes trading symbols from Binance to the database
 */
export const symbolSyncWorker = new Worker<SymbolSyncJobData>(
    'SyncQueue',
    async (job: Job<SymbolSyncJobData>) => {
        console.log(`[SymbolSyncWorker] Processing job ${job.id}: ${job.data.type}`);

        try {
            // 1. Fetch symbols from Binance
            const symbols: FilteredSymbol[] = await binanceService.getExchangeInfo();

            // 2. Upsert each symbol to database
            let syncedCount = 0;
            let errorCount = 0;

            for (const symbol of symbols) {
                try {
                    await prisma.symbol.upsert({
                        where: { symbol: symbol.symbol },
                        update: {
                            baseAsset: symbol.baseAsset,
                            quoteAsset: symbol.quoteAsset,
                            isActive: true,
                        },
                        create: {
                            symbol: symbol.symbol,
                            baseAsset: symbol.baseAsset,
                            quoteAsset: symbol.quoteAsset,
                            isActive: true,
                        },
                    });
                    syncedCount++;
                } catch (error) {
                    console.error(`[SymbolSyncWorker] Error upserting ${symbol.symbol}:`, error);
                    errorCount++;
                }
            }

            // 3. Log results
            console.log(`[SymbolSyncWorker] ✅ ${syncedCount} adet sembol senkronize edildi`);
            if (errorCount > 0) {
                console.warn(`[SymbolSyncWorker] ⚠️ ${errorCount} adet hata oluştu`);
            }

            return { synced: syncedCount, errors: errorCount };
        } catch (error) {
            console.error('[SymbolSyncWorker] Job failed:', error);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 1, // Only one sync job at a time
    }
);

// Event handlers
symbolSyncWorker.on('completed', (job) => {
    console.log(`[SymbolSyncWorker] Job ${job.id} completed successfully`);
});

symbolSyncWorker.on('failed', (job, err) => {
    console.error(`[SymbolSyncWorker] Job ${job?.id} failed:`, err.message);
});

console.log('[SymbolSyncWorker] Worker registered and listening');

export default symbolSyncWorker;
