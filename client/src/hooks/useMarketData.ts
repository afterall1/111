'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMarketAnalysis, MarketAnalysis } from '@/lib/api';

export function useMarketData(periodMinutes: number) {
    return useQuery<MarketAnalysis>({
        queryKey: ['market', periodMinutes],
        queryFn: () => fetchMarketAnalysis(periodMinutes),
        refetchInterval: 60000, // Refetch every 60 seconds
        staleTime: 30000, // Consider data stale after 30 seconds
    });
}

export default useMarketData;
