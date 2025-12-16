import { motion } from "framer-motion";

interface TimeSelectorProps {
    periods: number[];
    selectedPeriod: number;
    onSelect: (p: number) => void;
}

export default function TimeSelector({ periods, selectedPeriod, onSelect }: TimeSelectorProps) {
    // Dakikayı etikete çevir (örn: 60 -> 1H)
    const formatLabel = (m: number) => {
        if (m === 15) return '15M';
        if (m === 60) return '1H';
        if (m === 240) return '4H';
        if (m === 720) return '12H';
        if (m === 1440) return '24H';
        return `${m}m`;
    };

    return (
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#050505]/80 border-b border-white/5 py-3 px-4 mb-6">
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto overflow-x-auto no-scrollbar">
                {periods.map((period) => {
                    const isSelected = selectedPeriod === period;
                    return (
                        <button
                            key={period}
                            onClick={() => onSelect(period)}
                            className={`
                relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${isSelected ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
              `}
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[#1F1F1F] rounded-full -z-10 border border-white/10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            {formatLabel(period)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
