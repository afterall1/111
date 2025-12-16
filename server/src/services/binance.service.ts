import axios, { AxiosInstance } from 'axios';

interface BinanceSymbol {
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
}

interface ExchangeInfoResponse {
    symbols: BinanceSymbol[];
}

export interface FilteredSymbol {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
}

export interface CandleData {
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Binance Kline response format: [openTime, open, high, low, close, volume, closeTime, ...]
type BinanceKline = [
    number,  // 0: Open time (ms)
    string,  // 1: Open price
    string,  // 2: High price
    string,  // 3: Low price
    string,  // 4: Close price
    string,  // 5: Volume
    number,  // 6: Close time
    string,  // 7: Quote asset volume
    number,  // 8: Number of trades
    string,  // 9: Taker buy base asset volume
    string,  // 10: Taker buy quote asset volume
    string   // 11: Ignore
];

/**
 * Binance API Wrapper Service
 * Handles all communication with Binance public API
 */
export class BinanceService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.binance.com',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Fetches exchange info and filters for active USDT trading pairs
     * Excludes leveraged tokens (UP/DOWN)
     */
    async getExchangeInfo(): Promise<FilteredSymbol[]> {
        try {
            const response = await this.client.get<ExchangeInfoResponse>('/api/v3/exchangeInfo');
            const { symbols } = response.data;

            // Filter criteria:
            // 1. Status must be 'TRADING'
            // 2. Quote asset must be 'USDT'
            // 3. Exclude leveraged tokens (UP/DOWN)
            const filtered = symbols
                .filter((s) => {
                    // Must be actively trading
                    if (s.status !== 'TRADING') return false;

                    // Only USDT pairs
                    if (s.quoteAsset !== 'USDT') return false;

                    // Exclude leveraged tokens (BTCUP, BTCDOWN, etc.)
                    const upperSymbol = s.symbol.toUpperCase();
                    if (upperSymbol.includes('UPUSDT') || upperSymbol.includes('DOWNUSDT')) {
                        return false;
                    }

                    // Also check for UP/DOWN pattern at the end of baseAsset
                    const upperBase = s.baseAsset.toUpperCase();
                    if (upperBase.endsWith('UP') || upperBase.endsWith('DOWN')) {
                        return false;
                    }

                    return true;
                })
                .map((s) => ({
                    symbol: s.symbol,
                    baseAsset: s.baseAsset,
                    quoteAsset: s.quoteAsset,
                }));

            console.log(`[BinanceService] Fetched ${symbols.length} total symbols, ${filtered.length} after filtering`);

            return filtered;
        } catch (error) {
            console.error('[BinanceService] Error fetching exchange info:', error);
            throw error;
        }
    }

    /**
     * Fetches candlestick (kline) data for a symbol
     * @param symbol Trading pair (e.g., BTCUSDT)
     * @param interval Kline interval (default: 5m)
     * @param limit Number of candles to fetch (default: 100, max: 1000)
     */
    async getCandles(symbol: string, interval: string = '5m', limit: number = 100): Promise<CandleData[]> {
        try {
            const response = await this.client.get<BinanceKline[]>('/api/v3/klines', {
                params: {
                    symbol,
                    interval,
                    limit,
                },
            });

            // Parse Binance kline data to our CandleData format
            const candles: CandleData[] = response.data.map((kline) => ({
                time: new Date(kline[0]),       // Open time (Unix ms) -> Date
                open: parseFloat(kline[1]),     // Open price
                high: parseFloat(kline[2]),     // High price
                low: parseFloat(kline[3]),      // Low price
                close: parseFloat(kline[4]),    // Close price
                volume: parseFloat(kline[5]),   // Volume
            }));

            return candles;
        } catch (error) {
            console.error(`[BinanceService] Error fetching candles for ${symbol}:`, error);
            throw error;
        }
    }
}

// Export singleton instance
export const binanceService = new BinanceService();

