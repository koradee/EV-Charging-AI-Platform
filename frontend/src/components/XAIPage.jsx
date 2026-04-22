import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Brain, Zap, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import GlassCard from './GlassCard';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-card-static p-3">
                <p className="text-sm text-white font-medium">{data.feature}</p>
                <p className="text-xs text-muted">Impact: <span style={{ color: data.impact > 0 ? '#10b981' : '#3b82f6' }}>{data.impact > 0 ? '+' : ''}{data.impact.toFixed(3)} kWh</span></p>
                <p className="text-xs text-muted">Input: {data.value}</p>
            </div>
        );
    }
    return null;
};

export default function XAIPage({ formData, le }) {
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleExplain = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

            // Map charger_type to encoded value (simple mapping)
            const chargerMap = { 'DC Fast Charger': 0, 'Level 1': 1, 'Level 2': 2 };
            const encoded = chargerMap[formData.charger_type] ?? 2;

            const response = await axios.post(`${apiUrl}/xai/explain`, {
                battery_capacity: formData.battery_capacity,
                charging_duration: formData.charging_duration,
                charging_rate: formData.charging_rate,
                distance_driven: formData.distance_driven,
                temperature: formData.temperature,
                soc_start: formData.soc_start,
                soc_end: formData.soc_end,
                vehicle_age: formData.vehicle_age,
                start_hour: formData.start_hour,
                charger_type_encoded: encoded,
            });
            setExplanation(response.data);
        } catch (err) {
            setError('Failed to get explanation. Ensure backend is running and SHAP is installed.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data: SHAP waterfall
    const chartData = explanation?.explanation?.map(item => ({
        feature: item.feature.replace(/ \(.*\)/, '').replace('Distance Driven since last charge', 'Distance'),
        fullFeature: item.feature,
        impact: parseFloat(item.impact.toFixed(4)),
        value: item.value,
        absImpact: Math.abs(item.impact),
    })) || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
                <Brain size={28} />
                Explainable AI (XAI)
            </h2>
            <p className="text-muted mb-6">Understand <em>why</em> the model makes its predictions using SHAP feature importance</p>

            <div className="grid grid-2 gap-6">
                {/* Input Summary + Trigger */}
                <GlassCard hover={false} className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Current Input Parameters</h3>
                    <p className="text-sm text-muted mb-4">These values from the Predict tab will be analyzed:</p>

                    <div className="flex flex-col gap-2 mb-6">
                        {[
                            { label: 'Battery Capacity', value: `${formData.battery_capacity} kWh` },
                            { label: 'Charging Duration', value: `${formData.charging_duration} hrs` },
                            { label: 'Charging Rate', value: `${formData.charging_rate} kW` },
                            { label: 'Distance Driven', value: `${formData.distance_driven} km` },
                            { label: 'Temperature', value: `${formData.temperature} °C` },
                            { label: 'SoC Start → End', value: `${formData.soc_start}% → ${formData.soc_end}%` },
                            { label: 'Vehicle Age', value: `${formData.vehicle_age} yrs` },
                            { label: 'Start Hour', value: `${formData.start_hour}:00` },
                            { label: 'Charger Type', value: formData.charger_type },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between text-sm glass-card-static p-2 px-3">
                                <span className="text-muted">{item.label}</span>
                                <span className="text-white font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <motion.button
                        onClick={handleExplain}
                        disabled={loading}
                        className="btn-primary w-full py-3"
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2"><div className="spinner" /> Analyzing...</span>
                        ) : (
                            <span className="flex items-center justify-center gap-2"><Search size={18} /> Explain Prediction</span>
                        )}
                    </motion.button>

                    {explanation && (
                        <div className="mt-4 glass-card-static p-3">
                            <p className="text-xs text-muted">Method: <span className="text-white font-medium">{explanation.method}</span></p>
                        </div>
                    )}
                </GlassCard>

                {/* SHAP Visualization */}
                <div>
                    {error && (
                        <GlassCard hover={false} className="p-6 mb-4">
                            <p className="text-center" style={{ color: '#ef4444' }}>{error}</p>
                        </GlassCard>
                    )}

                    {explanation && chartData.length > 0 && (
                        <GlassCard hover={false} className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">SHAP Feature Impact</h3>
                            <p className="text-xs text-muted mb-4">
                                <span style={{ color: '#10b981' }}>Green</span> = pushes prediction higher,
                                <span style={{ color: '#3b82f6' }}> Blue</span> = pushes prediction lower
                            </p>
                            <ResponsiveContainer width="100%" height={380}>
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis type="category" dataKey="feature" stroke="#94a3b8" fontSize={10} width={120} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine x={0} stroke="rgba(148, 163, 184, 0.3)" />
                                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.impact > 0 ? '#10b981' : '#3b82f6'} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Top 3 Insights */}
                            <div className="mt-4 glass-card-static p-4">
                                <h4 className="text-sm font-semibold text-white mb-2">🔍 Top Insights</h4>
                                <div className="flex flex-col gap-1">
                                    {chartData.slice(0, 3).map((item, i) => (
                                        <p key={i} className="text-xs text-muted">
                                            <strong className="text-white">{item.fullFeature}</strong> (value: {item.value}) has the
                                            {i === 0 ? ' strongest' : ` #${i + 1}`} impact:
                                            <span style={{ color: item.impact > 0 ? '#10b981' : '#3b82f6' }}>
                                                {' '}{item.impact > 0 ? '+' : ''}{item.impact.toFixed(3)} kWh
                                            </span>
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {!explanation && !error && (
                        <GlassCard hover={false} className="p-8 text-center">
                            <Brain className="w-12 h-12 text-blue mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-semibold text-white mb-2">SHAP Explainer</h3>
                            <p className="text-muted text-sm">Click "Explain Prediction" to see which features drive the model's output and by how much.</p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
