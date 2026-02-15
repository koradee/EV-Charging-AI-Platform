import { motion } from 'framer-motion';
import { History, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import GlassCard from './GlassCard';

export default function HistoryPanel({ history, onClear }) {
    if (!history || history.length === 0) {
        return null;
    }

    const exportToCSV = () => {
        const headers = ['Date', 'Energy (kWh)', 'Battery Capacity', 'Charger Type', 'Temperature'];
        const rows = history.map(item => [
            format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss'),
            item.energy.toFixed(2),
            item.params.battery_capacity,
            item.params.charger_type,
            item.params.temperature
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ev-predictions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <GlassCard hover={false} className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold gradient-text flex items-center gap-2">
                    <History size={20} />
                    Prediction History
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button
                        onClick={onClear}
                        className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
                    >
                        <X size={16} />
                        Clear
                    </button>
                </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.slice().reverse().map((item, index) => (
                    <motion.div
                        key={item.id}
                        className="glass-card-static p-4 flex items-center justify-between"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-lg font-bold text-white">{item.energy.toFixed(2)} kWh</span>
                                <span className="badge badge-blue">{item.params.charger_type}</span>
                            </div>
                            <div className="text-xs text-muted">
                                {format(new Date(item.timestamp), 'MMM dd, yyyy - HH:mm')} •
                                {' '}{item.params.battery_capacity} kWh Battery •
                                {' '}{item.params.temperature}°C
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted">Distance</div>
                            <div className="text-base font-semibold text-white">{item.params.distance_driven} km</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </GlassCard>
    );
}
