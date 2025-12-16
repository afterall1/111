import { motion } from "framer-motion";

interface TimeSelectorProps {
    periods: number[];
    selectedPeriod: number;
    onSelect: (p: number) => void;
}

export default function TimeSelector({ periods, selectedPeriod, onSelect }: TimeSelectorProps) {
    const formatLabel = (m: number) => {
        if (m === 15) return '15M';
        if (m === 60) return '1H';
        if (m === 240) return '4H';
        if (m === 720) return '12H';
        if (m === 1440) return '24H';
        return `${m}m`;
    };

    return (
        <div className="sticky top-0 z-50 backdrop-blur-sm bg-black/20 border-b border-white/5 pt-4 pb-0 mb-6">
            <div className="flex items-center justify-center gap-8 max-w-md mx-auto">
                {periods.map((period) => {
                    const isSelected = selectedPeriod === period;
                    return (
                        <button
                            key={period}
                            onClick={() => onSelect(period)}
                            className={`
                relative pb-4 text-sm font-bold tracking-widest transition-colors duration-300
                ${isSelected ? 'text-holo-teal' : 'text-gray-600 hover:text-gray-400'}
              `}
                        >
                            {formatLabel(period)}

                            {isSelected && (
                                <motion.div
                                    layoutId="cyber-underline"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-holo-teal shadow-[0_0_10px_#00F0FF]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
