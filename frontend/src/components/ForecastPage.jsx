import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart3, Clock, Calendar, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import GlassCard from './GlassCard';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card-static p-3">
                <p className="text-sm text-white font-medium">{payload[0].value.toFixed(2)} kWh</p>
                <p className="text-xs text-muted">{label}</p>
            </div>
        );
    }
    return null;
};

export default function ForecastPage() {
    const [hourlyData, setHourlyData] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const [hourlyRes, dailyRes] = await Promise.all([
                axios.get(`${apiUrl}/forecast/hourly`),
                axios.get(`${apiUrl}/forecast/daily`)
            ]);

            const hourly = hourlyRes.data.map(item => ({
                hour: `${item.Hour}:00`,
                mean: parseFloat(item.mean?.toFixed(2) || 0),
                lower: parseFloat(item.lower_bound?.toFixed(2) || 0),
                upper: parseFloat(item.upper_bound?.toFixed(2) || 0),
                count: item.count || 0,
            }));

            const daily = dailyRes.data.map(item => ({
                day: item.DayOfWeek?.substring(0, 3) || item.day,
                energy: parseFloat(item['Energy Consumed (kWh)']?.toFixed(2) || 0),
            }));

            setHourlyData(hourly);
            setDailyData(daily);
        } catch (err) {
            setError('Failed to load forecast data. Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Find peak hour
    const peakHour = hourlyData.length > 0
        ? hourlyData.reduce((max, item) => item.mean > max.mean ? item : max, hourlyData[0])
        : null;

    const totalSessions = hourlyData.reduce((sum, item) => sum + (item.count || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold gradient-text flex items-center gap-3">
                        <BarChart3 size={28} />
                        Demand Forecast
                    </h2>
                    <p className="text-muted mt-1">Historical demand patterns aggregated from {totalSessions.toLocaleString()} charging sessions</p>
                </div>
                <button onClick={fetchData} className="btn-secondary flex items-center gap-2 px-4 py-2" disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <GlassCard hover={false} className="p-6 mb-6">
                    <p className="text-center" style={{ color: '#ef4444' }}>{error}</p>
                </GlassCard>
            )}

            {loading && !error && (
                <div className="grid grid-2 gap-6">
                    <div className="loading-skeleton" style={{ height: 400 }} />
                    <div className="loading-skeleton" style={{ height: 400 }} />
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-3 gap-4 mb-8">
                        <motion.div className="glass-card-static p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-blue" />
                                <span className="text-xs text-muted uppercase tracking-wide">Peak Hour</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{peakHour?.hour || '—'}</span>
                            <p className="text-xs text-muted mt-1">Highest avg. demand</p>
                        </motion.div>
                        <motion.div className="glass-card-static p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 size={16} className="text-green" />
                                <span className="text-xs text-muted uppercase tracking-wide">Peak Demand</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{peakHour?.mean?.toFixed(1) || '—'} kWh</span>
                            <p className="text-xs text-muted mt-1">Average at peak</p>
                        </motion.div>
                        <motion.div className="glass-card-static p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={16} className="text-blue" />
                                <span className="text-xs text-muted uppercase tracking-wide">Total Sessions</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{totalSessions.toLocaleString()}</span>
                            <p className="text-xs text-muted mt-1">Historical records</p>
                        </motion.div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-2 gap-6">
                        <GlassCard hover={false} className="p-6">
                            <h3 className="text-xl font-bold mb-4 gradient-text flex items-center gap-2">
                                <Clock size={20} />
                                Hourly Demand Profile
                            </h3>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={hourlyData}>
                                    <defs>
                                        <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} interval={2} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="mean" stroke="#3b82f6" strokeWidth={2} fill="url(#colorHourly)" dot={{ fill: '#3b82f6', r: 3 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </GlassCard>

                        <GlassCard hover={false} className="p-6">
                            <h3 className="text-xl font-bold mb-4 gradient-text flex items-center gap-2">
                                <Calendar size={20} />
                                Daily Demand Profile
                            </h3>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="energy" fill="url(#colorDaily)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    </div>
                </>
            )}
        </motion.div>
    );
}
