import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DollarSign, Clock, TrendingDown, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import GlassCard from './GlassCard';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card-static p-3">
                <p className="text-sm text-white font-medium">${payload[0].value.toFixed(2)}</p>
                <p className="text-xs text-muted">Start at {label}:00</p>
            </div>
        );
    }
    return null;
};

export default function PricingPage() {
    const [formData, setFormData] = useState({
        energy_kwh: 40.0,
        duration_hours: 3.0,
        current_start_hour: 12,
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const response = await axios.post(`${apiUrl}/pricing/optimize`, formData);
            setResult(response.data);
        } catch (err) {
            setError('Failed to get pricing data. Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Chart data from all_slots
    const chartData = result?.optimal_scenario?.all_slots?.map(slot => ({
        hour: slot.start_hour,
        cost: parseFloat(slot.cost.toFixed(2)),
    })) || [];

    const optimalHour = result?.optimal_scenario?.recommended_start_hour;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
                <DollarSign size={28} />
                Dynamic Pricing Optimizer
            </h2>
            <p className="text-muted mb-6">Find the cheapest time to charge using Time-of-Use (TOU) tariff simulation</p>

            <div className="grid grid-2 gap-6">
                {/* Input Form */}
                <GlassCard hover={false} className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-white">Charging Session</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="flex items-center gap-2">
                                <Zap size={16} className="text-blue" />
                                Energy Needed (kWh)
                            </label>
                            <input type="number" name="energy_kwh" value={formData.energy_kwh} onChange={handleChange} min={1} max={200} step={0.1} required />
                        </div>
                        <div>
                            <label className="flex items-center gap-2">
                                <Clock size={16} className="text-blue" />
                                Duration (hours)
                            </label>
                            <input type="number" name="duration_hours" value={formData.duration_hours} onChange={handleChange} min={0.5} max={12} step={0.5} required />
                        </div>
                        <div>
                            <label className="flex items-center gap-2">
                                <Clock size={16} className="text-blue" />
                                Current Start Hour (0-23)
                            </label>
                            <input type="number" name="current_start_hour" value={formData.current_start_hour} onChange={handleChange} min={0} max={23} step={1} required />
                        </div>
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 mt-2"
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="spinner" /> Optimizing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <TrendingDown size={18} /> Find Cheapest Time
                                </span>
                            )}
                        </motion.button>
                    </form>

                    {/* Tariff Info */}
                    {result?.tariff_info && (
                        <motion.div className="mt-6 glass-card-static p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h4 className="text-sm font-semibold text-white mb-2">Tariff Structure</h4>
                            <div className="flex justify-between text-xs text-muted">
                                <span>Peak Rate (4-9 PM)</span>
                                <span className="text-white font-medium">${result.tariff_info.peak_rate}/kWh</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted mt-1">
                                <span>Off-Peak Rate</span>
                                <span className="text-green font-medium">${result.tariff_info.off_peak_rate}/kWh</span>
                            </div>
                        </motion.div>
                    )}
                </GlassCard>

                {/* Results */}
                <div className="flex flex-col gap-6">
                    {error && (
                        <GlassCard hover={false} className="p-6">
                            <p className="text-center" style={{ color: '#ef4444' }}>{error}</p>
                        </GlassCard>
                    )}

                    {result && (
                        <>
                            {/* Cost Summary */}
                            <div className="grid grid-3 gap-4">
                                <motion.div className="glass-card-static p-4 flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <span className="text-xs text-muted mb-1">Current Cost</span>
                                    <span className="text-2xl font-bold text-white">${result.current_estimated_cost}</span>
                                    <span className="text-xs text-muted">at {formData.current_start_hour}:00</span>
                                </motion.div>
                                <motion.div className="glass-card-static p-4 flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <span className="text-xs text-muted mb-1">Optimal Cost</span>
                                    <span className="text-2xl font-bold text-green">${result.optimal_scenario.min_cost}</span>
                                    <span className="text-xs text-muted">at {result.optimal_scenario.recommended_start_hour}:00</span>
                                </motion.div>
                                <motion.div className="glass-card-static p-4 flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <span className="text-xs text-muted mb-1">Savings</span>
                                    <span className="text-2xl font-bold gradient-text">${result.optimal_scenario.savings}</span>
                                    <span className="text-xs text-muted">vs worst time</span>
                                </motion.div>
                            </div>

                            {/* Chart */}
                            <GlassCard hover={false} className="p-6">
                                <h3 className="text-lg font-bold mb-4 text-white">Cost by Start Hour</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                        <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={entry.hour === optimalHour ? '#10b981' : entry.hour >= 16 && entry.hour < 21 ? '#ef4444' : '#3b82f6'}
                                                    fillOpacity={entry.hour === optimalHour ? 1 : 0.6}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                                    <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} /> Optimal</span>
                                    <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Peak Hours</span>
                                    <span className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} /> Off-Peak</span>
                                </div>
                            </GlassCard>
                        </>
                    )}

                    {!result && !error && (
                        <GlassCard hover={false} className="p-8 text-center">
                            <DollarSign className="w-12 h-12 text-blue mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-semibold text-white mb-2">Price Optimizer</h3>
                            <p className="text-muted text-sm">Enter your session details to find the cheapest charging window.</p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
