'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import TimeSelector from '@/components/TimeSelector';
import { MarketCard } from '@/components/MarketCard';
import { useMarketData } from '@/hooks/useMarketData';

const PERIODS = [15, 60, 240, 720, 1440];

export default function Home() {
  const [period, setPeriod] = useState(240);
  const [view, setView] = useState<'gainers' | 'losers'>('gainers');

  const { data, isLoading, isError, refetch } = useMarketData(period);

  const displayData = view === 'gainers' ? data?.gainers : data?.losers;

  return (
    <>
      <TimeSelector
        periods={PERIODS}
        selectedPeriod={period}
        onSelect={setPeriod}
      />

      <div className="max-w-xl mx-auto px-4 pb-32">
        {/* View Switcher (Tabs) */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setView('gainers')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none border-b-2 transition-all duration-300 ${view === 'gainers'
                ? 'border-up text-up bg-up/5'
                : 'border-transparent text-gray-600 hover:text-gray-400'
              }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono text-sm uppercase tracking-wider">Top Gainers</span>
          </button>
          <button
            onClick={() => setView('losers')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none border-b-2 transition-all duration-300 ${view === 'losers'
                ? 'border-down text-down bg-down/5'
                : 'border-transparent text-gray-600 hover:text-gray-400'
              }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span className="font-mono text-sm uppercase tracking-wider">Top Losers</span>
          </button>
        </div>

        {/* Stats & Meta */}
        {data && (
          <div className="flex items-center justify-between text-[10px] text-gray-600 mb-4 px-2 font-mono uppercase tracking-widest">
            <span>Scan: {data.total} Assets</span>
            <span>Sync: {new Date(data.calculatedAt).toLocaleTimeString()}</span>
          </div>
        )}

        {/* Loading Radar Effect */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-holo-teal border-t-transparent animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-holo-teal/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-holo-teal rounded-full shadow-[0_0_10px_#00F0FF]" />
              </div>
            </div>
            <p className="mt-4 font-mono text-xs text-holo-teal animate-pulse tracking-[0.2em]">
              SCANNING MARKETS...
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            </div>
            <p className="text-red-400 font-mono text-xs tracking-widest mb-4">CONNECTION LOST</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
            >
              RETRY LINK
            </button>
          </div>
        )}

        {/* Data Grid */}
        {!isLoading && !isError && displayData && (
          <div className="space-y-1">
            {displayData.map((item) => (
              <MarketCard
                key={item.symbol}
                symbol={item.symbol}
                price={item.currentPrice}
                changePercent={item.changePercent}
              />
            ))}

            {displayData.length === 0 && (
              <div className="text-center py-20 text-gray-700 font-mono text-xs">
                NO SIGNALS DETECTED
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
