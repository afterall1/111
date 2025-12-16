import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface SymbolChange {
    symbol: string;
    currentPrice: number;
    referencePrice: number;
    changePercent: number;
    volume: number;
}

export interface AnalysisResult {
    period: number;
    periodLabel: string;
    calculatedAt: string;
    gainers: SymbolChange[];
    losers: SymbolChange[];
    total: number;
}

/**
 * Analysis Service
 * Calculates price changes and manages Redis caching
 */
export class AnalysisService {
    private static CACHE_TTL = 300; // 5 minutes

    /**
     * Convert period string to minutes
     */
    static periodToMinutes(period: string): number {
        const multipliers: Record<string, number> = {
            'm': 1,
            'h': 60,
            'd': 1440,
        };
        const match = period.match(/^(\d+)([mhd])$/);
        if (!match) {
            return parseInt(period) || 60; // Default to 60 minutes
        }
        return parseInt(match[1]) * multipliers[match[2]];
    }

    /**
     * Get cached analysis or calculate fresh
     */
    static async getAnalysis(periodMinutes: number): Promise<AnalysisResult | null> {
        const cacheKey = `market:rank:${periodMinutes}`;

        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[AnalysisService] Cache HIT for period ${periodMinutes}m`);
            return JSON.parse(cached);
        }

        console.log(`[AnalysisService] Cache MISS for period ${periodMinutes}m, calculating...`);

        // Calculate fresh data
        const result = await this.calculateChanges(periodMinutes);

        if (result) {
            // Cache the result
            await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        }

        return result;
    }

    /**
     * Calculate price changes for a given time period
     */
    static async calculateChanges(periodMinutes: number): Promise<AnalysisResult | null> {
        try {
            const targetTime = new Date(Date.now() - periodMinutes * 60 * 1000);

            // Raw SQL query to get current and reference prices efficiently
            const changes = await prisma.$queryRaw<SymbolChange[]>`
        WITH current_prices AS (
          SELECT DISTINCT ON (symbol)
            symbol,
            close as current_price,
            volume
          FROM "Candle"
          ORDER BY symbol, time DESC
        ),
        reference_prices AS (
          SELECT DISTINCT ON (symbol)
            symbol,
            close as reference_price
          FROM "Candle"
          WHERE time <= ${targetTime}
          ORDER BY symbol, time DESC
        )
        SELECT 
          c.symbol,
          c.current_price::float8 as "currentPrice",
          COALESCE(r.reference_price, c.current_price)::float8 as "referencePrice",
          CASE 
            WHEN r.reference_price IS NULL OR r.reference_price = 0 THEN 0
            ELSE ((c.current_price - r.reference_price) / r.reference_price * 100)::float8
          END as "changePercent",
          c.volume::float8 as volume
        FROM current_prices c
        LEFT JOIN reference_prices r ON c.symbol = r.symbol
        WHERE c.current_price > 0
        ORDER BY "changePercent" DESC
      `;

            if (!changes || changes.length === 0) {
                console.log('[AnalysisService] No data found for analysis');
                return null;
            }

            // Split into gainers and losers
            const gainers = changes.filter(c => c.changePercent > 0);
            const losers = changes.filter(c => c.changePercent < 0).reverse(); // Worst first

            const result: AnalysisResult = {
                period: periodMinutes,
                periodLabel: this.formatPeriodLabel(periodMinutes),
                calculatedAt: new Date().toISOString(),
                gainers: gainers.slice(0, 50), // Top 50 gainers
                losers: losers.slice(0, 50),   // Top 50 losers
                total: changes.length,
            };

            console.log(`[AnalysisService] Calculated changes for ${periodMinutes}m: ${gainers.length} gainers, ${losers.length} losers`);

            return result;

        } catch (error) {
            console.error('[AnalysisService] Error calculating changes:', error);
            return null;
        }
    }

    /**
     * Pre-warm cache for common timeframes
     */
    static async warmCache(): Promise<void> {
        const periods = [15, 60, 240, 720, 1440]; // 15m, 1h, 4h, 12h, 24h

        console.log('[AnalysisService] Warming cache for all periods...');

        for (const period of periods) {
            try {
                const result = await this.calculateChanges(period);
                if (result) {
                    const cacheKey = `market:rank:${period}`;
                    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
                    console.log(`[AnalysisService] Cached period ${period}m`);
                }
            } catch (error) {
                console.error(`[AnalysisService] Error warming cache for ${period}m:`, error);
            }
        }

        console.log('[AnalysisService] Cache warming complete');
    }

    /**
     * Format period label for display
     */
    private static formatPeriodLabel(minutes: number): string {
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${minutes / 60}h`;
        return `${minutes / 1440}d`;
    }
}

export const analysisService = AnalysisService;
