import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redisConnection } from '../queue/connection';
import { binanceService, CandleData } from '../services/binance.service';

const prisma = new PrismaClient();

// Chunk size for parallel requests (avoid rate limiting)
const CHUNK_SIZE = 10;
// Delay between chunks in milliseconds
const CHUNK_DELAY_MS = 1000;
// Number of candles to fetch per symbol
const CANDLES_LIMIT = 100;

interface CandleImportJobData {
    type: 'full-import' | 'incremental';
    interval?: string; // Default: 5m
}

interface CandleWithSymbol extends CandleData {
    symbol: string;
}

/**
 * Helper function to split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Candle Import Worker
 * Fetches candlestick data from Binance and stores in TimescaleDB
 */
export const candleImportWorker = new Worker<CandleImportJobData>(
    'CandleImportQueue',
    async (job: Job<CandleImportJobData>) => {
        const interval = job.data.interval || '5m';
        console.log(`[CandleImportWorker] Starting ${job.data.type} import for interval: ${interval}`);

        try {
            // 1. Get all active symbols from database
            const symbols = await prisma.symbol.findMany({
                where: { isActive: true },
                select: { symbol: true },
            });

            console.log(`[CandleImportWorker] Found ${symbols.length} active symbols`);

            // 2. Split symbols into chunks
            const chunks = chunkArray(symbols, CHUNK_SIZE);
            console.log(`[CandleImportWorker] Split into ${chunks.length} chunks of ${CHUNK_SIZE}`);

            let totalImported = 0;
            let totalErrors = 0;

            // 3. Process each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkNumber = i + 1;

                console.log(`[CandleImportWorker] Processing chunk ${chunkNumber}/${chunks.length}...`);

                try {
                    // Fetch candles for all symbols in this chunk in parallel
                    const candlePromises = chunk.map(async (s) => {
                        try {
                            const candles = await binanceService.getCandles(s.symbol, interval, CANDLES_LIMIT);
                            // Add symbol to each candle
                            return candles.map((c) => ({ ...c, symbol: s.symbol }));
                        } catch (error) {
                            console.error(`[CandleImportWorker] Error fetching ${s.symbol}:`, error);
                            totalErrors++;
                            return []; // Return empty array on error
                        }
                    });

                    const candleResults = await Promise.all(candlePromises);

                    // Flatten all candles from this chunk
                    const allCandles: CandleWithSymbol[] = candleResults.flat();

                    if (allCandles.length > 0) {
                        // Bulk insert with skipDuplicates
                        const result = await prisma.candle.createMany({
                            data: allCandles.map((c) => ({
                                time: c.time,
                                symbol: c.symbol,
                                open: c.open,
                                high: c.high,
                                low: c.low,
                                close: c.close,
                                volume: c.volume,
                            })),
                            skipDuplicates: true,
                        });

                        totalImported += result.count;
                        console.log(`[CandleImportWorker] Chunk ${chunkNumber}/${chunks.length}: Imported ${result.count} candles`);
                    }

                    // Update job progress
                    await job.updateProgress(Math.round((chunkNumber / chunks.length) * 100));

                } catch (chunkError) {
                    console.error(`[CandleImportWorker] Chunk ${chunkNumber} failed:`, chunkError);
                    totalErrors++;
                }

                // Delay between chunks to avoid rate limiting
                if (i < chunks.length - 1) {
                    await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
                }
            }

            // 4. Log final results
            console.log(`[CandleImportWorker] ✅ Import complete!`);
            console.log(`[CandleImportWorker]    Total candles imported: ${totalImported}`);
            console.log(`[CandleImportWorker]    Total errors: ${totalErrors}`);

            return { imported: totalImported, errors: totalErrors };

        } catch (error) {
            console.error('[CandleImportWorker] Job failed:', error);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 1, // Only one import job at a time
    }
);

// Event handlers
candleImportWorker.on('completed', (job, result) => {
    console.log(`[CandleImportWorker] Job ${job.id} completed. Imported: ${result?.imported}, Errors: ${result?.errors}`);
});

candleImportWorker.on('failed', (job, err) => {
    console.error(`[CandleImportWorker] Job ${job?.id} failed:`, err.message);
});

candleImportWorker.on('progress', (job, progress) => {
    console.log(`[CandleImportWorker] Job ${job.id} progress: ${progress}%`);
});

console.log('[CandleImportWorker] Worker registered and listening');

export default candleImportWorker;
