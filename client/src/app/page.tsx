'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import TimeSelector from '@/components/TimeSelector';
import { MarketCard, MarketCardSkeleton } from '@/components/MarketCard';
import { useMarketData } from '@/hooks/useMarketData';

const PERIODS = [15, 60, 240, 720, 1440];

export default function Home() {
  const [period, setPeriod] = useState(240);
  const [view, setView] = useState<'gainers' | 'losers'>('gainers');

  const { data, isLoading, isError, refetch } = useMarketData(period);

  const displayData = view === 'gainers' ? data?.gainers : data?.losers;

  return (
    <>
      {/* Sticky Time Selector */}
      <TimeSelector
        periods={PERIODS}
        selectedPeriod={period}
        onSelect={setPeriod}
      />

      {/* Content Area */}
      <div className="max-w-2xl mx-auto px-4 pb-20">

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('gainers')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${view === 'gainers'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-gray-500 hover:text-gray-300 bg-white/[0.02] border border-white/5'
              }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top Gainers
          </button>
          <button
            onClick={() => setView('losers')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${view === 'losers'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'text-gray-500 hover:text-gray-300 bg-white/[0.02] border border-white/5'
              }`}
          >
            <TrendingDown className="w-4 h-4" />
            Top Losers
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>{data.total} symbols</span>
            <span>{data.periodLabel}</span>
          </div>
        )}

        {/* Market Cards */}
        <div>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))
          ) : isError ? (
            <div className="text-center py-16">
              <p className="text-rose-400 mb-2">Failed to load data</p>
              <button onClick={() => refetch()} className="text-cyan-400 hover:underline text-sm">
                Try again
              </button>
            </div>
          ) : displayData && displayData.length > 0 ? (
            displayData.map((item) => (
              <MarketCard
                key={item.symbol}
                symbol={item.symbol}
                price={item.currentPrice}
                changePercent={item.changePercent}
              />
            ))
          ) : (
            <div className="text-center py-16 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </>
  );
}
