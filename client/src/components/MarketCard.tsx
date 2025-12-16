import { motion } from 'framer-motion';

interface MarketCardProps {
    symbol: string;
    price: number;
    changePercent: number;
}

export function MarketCard({ symbol, price, changePercent }: MarketCardProps) {
    const isPositive = changePercent >= 0;
    const neonColor = isPositive ? '#00F0FF' : '#FF0055';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="relative flex items-center justify-between p-4 mb-2 overflow-hidden rounded-r-xl border-t border-b border-r border-white/10 bg-black/40 backdrop-blur-md"
            style={{ borderLeft: `4px solid ${neonColor}` }}
        >
            {/* Arkada hafif glow efekti */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-transparent to-white/5 pointer-events-none" />

            <div className="flex flex-col z-10">
                <h3 className="text-xl font-bold text-white tracking-widest">{symbol}</h3>
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">USDT PERPETUAL</span>
            </div>

            <div className="flex flex-col items-end z-10">
                <span className="font-mono text-lg text-gray-200" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                    ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: neonColor, textShadow: `0 0 10px ${neonColor}` }}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
            </div>
        </motion.div>
    );
}

export function MarketCardSkeleton() {
    return (
        <div className="relative flex items-center justify-between p-4 mb-2 overflow-hidden rounded-r-xl border-t border-b border-r border-white/5 bg-black/40 backdrop-blur-md animate-pulse border-l-4 border-l-gray-800">
            <div className="flex flex-col gap-2">
                <div className="h-6 w-20 bg-white/10 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="h-5 w-24 bg-white/10 rounded" />
                <div className="h-4 w-16 bg-white/5 rounded" />
            </div>
        </div>
    );
}

export default MarketCard;
