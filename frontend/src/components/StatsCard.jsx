import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, unit, trend, icon: Icon, delay = 0 }) {
    return (
        <motion.div
            className="glass-card-static p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-400" />
                        </div>
                    )}
                    <span className="text-sm text-muted uppercase tracking-wide">{title}</span>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green' : 'text-blue'}`}>
                        {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                {unit && <span className="text-sm text-muted">{unit}</span>}
            </div>
        </motion.div>
    );
}
