import { Request, Response } from 'express';
import { AnalysisService } from '../services/analysis.service';

/**
 * Market Controller
 * Handles market analysis API endpoints
 */
export class MarketController {

    /**
     * GET /api/market/analysis
     * Returns price change rankings for a given period
     * 
     * Query params:
     * - period: Time period (e.g., "15m", "1h", "4h", "24h") or minutes (e.g., "240")
     */
    static async getAnalysis(req: Request, res: Response): Promise<void> {
        try {
            const periodParam = (req.query.period as string) || '60';
            const periodMinutes = AnalysisService.periodToMinutes(periodParam);

            if (periodMinutes <= 0 || periodMinutes > 10080) { // Max 7 days
                res.status(400).json({
                    error: 'Invalid period',
                    message: 'Period must be between 1 minute and 7 days',
                });
                return;
            }

            const result = await AnalysisService.getAnalysis(periodMinutes);

            if (!result) {
                res.status(404).json({
                    error: 'No data available',
                    message: 'No candle data found for the requested period',
                });
                return;
            }

            res.json(result);

        } catch (error) {
            console.error('[MarketController] Error in getAnalysis:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to calculate market analysis',
            });
        }
    }

    /**
     * GET /api/market/gainers
     * Returns top gainers for a given period
     */
    static async getGainers(req: Request, res: Response): Promise<void> {
        try {
            const periodParam = (req.query.period as string) || '60';
            const limit = parseInt(req.query.limit as string) || 20;
            const periodMinutes = AnalysisService.periodToMinutes(periodParam);

            const result = await AnalysisService.getAnalysis(periodMinutes);

            if (!result) {
                res.status(404).json({ error: 'No data available' });
                return;
            }

            res.json({
                period: result.periodLabel,
                calculatedAt: result.calculatedAt,
                gainers: result.gainers.slice(0, limit),
            });

        } catch (error) {
            console.error('[MarketController] Error in getGainers:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/market/losers
     * Returns top losers for a given period
     */
    static async getLosers(req: Request, res: Response): Promise<void> {
        try {
            const periodParam = (req.query.period as string) || '60';
            const limit = parseInt(req.query.limit as string) || 20;
            const periodMinutes = AnalysisService.periodToMinutes(periodParam);

            const result = await AnalysisService.getAnalysis(periodMinutes);

            if (!result) {
                res.status(404).json({ error: 'No data available' });
                return;
            }

            res.json({
                period: result.periodLabel,
                calculatedAt: result.calculatedAt,
                losers: result.losers.slice(0, limit),
            });

        } catch (error) {
            console.error('[MarketController] Error in getLosers:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default MarketController;
