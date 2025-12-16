import axios from 'axios';

// API base URL - Backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Types
export interface SymbolChange {
    symbol: string;
    currentPrice: number;
    referencePrice: number;
    changePercent: number;
    volume: number;
}

export interface MarketAnalysis {
    period: number;
    periodLabel: string;
    calculatedAt: string;
    gainers: SymbolChange[];
    losers: SymbolChange[];
    total: number;
}

// API Functions
export async function fetchMarketAnalysis(periodMinutes: number): Promise<MarketAnalysis> {
    const response = await api.get<MarketAnalysis>('/market/analysis', {
        params: { period: periodMinutes },
    });
    return response.data;
}

export async function fetchGainers(periodMinutes: number, limit = 20): Promise<{ gainers: SymbolChange[] }> {
    const response = await api.get('/market/gainers', {
        params: { period: periodMinutes, limit },
    });
    return response.data;
}

export async function fetchLosers(periodMinutes: number, limit = 20): Promise<{ losers: SymbolChange[] }> {
    const response = await api.get('/market/losers', {
        params: { period: periodMinutes, limit },
    });
    return response.data;
}
