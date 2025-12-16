import React from 'react';

interface MarketCardProps {
    symbol: string;
    price: number;
    changePercent: number;
}

export function MarketCard({ symbol, price, changePercent }: MarketCardProps) {
    const isPositive = changePercent >= 0;

    return (
        <div className="group relative flex items-center justify-between p-4 mb-3 rounded-2xl 
                    bg-[#121212]/60 backdrop-blur-md 
                    border border-white/5 hover:border-white/10 
                    transition-all duration-300 hover:bg-[#1A1A1A]/80">

            {/* Sol: Sembol Bilgisi */}
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <span className="text-white font-bold text-lg tracking-wide">{symbol}</span>
                    <span className="text-xs text-gray-500 font-medium">USDT</span>
                </div>
            </div>

            {/* Sağ: Fiyat ve Yüzde */}
            <div className="flex items-center gap-4">
                {/* Fiyat: JetBrains Mono fontu ile */}
                <span className="text-gray-300 font-mono text-[15px] tracking-tight">
                    ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>

                {/* Yüzde Badge'i */}
                <div className={`
          flex items-center justify-center min-w-[80px] py-1.5 px-3 rounded-lg 
          font-mono text-xs font-bold border backdrop-blur-sm
          ${isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.4)]'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)]'}
        `}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </div>
            </div>
        </div>
    );
}

export function MarketCardSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 mb-3 rounded-2xl bg-[#121212]/60 border border-white/5 animate-pulse">
            <div className="flex items-baseline gap-2">
                <div className="h-5 w-20 bg-white/10 rounded" />
                <div className="h-3 w-10 bg-white/5 rounded" />
            </div>
            <div className="flex items-center gap-4">
                <div className="h-5 w-24 bg-white/10 rounded" />
                <div className="h-8 w-20 bg-white/5 rounded-lg" />
            </div>
        </div>
    );
}

export default MarketCard;
