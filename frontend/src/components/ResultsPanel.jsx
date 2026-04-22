import { motion } from 'framer-motion';
import { Zap, DollarSign, Leaf, Clock, TrendingUp } from 'lucide-react';
import GlassCard from './GlassCard';

// Circular progress gauge
function CircularGauge({ value, max, color = '#3b82f6' }) {
    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeWidth="8"
                    fill="none"
                />
                <motion.circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke={color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{value.toFixed(1)}</span>
                <span className="text-xs text-muted">kWh</span>
            </div>
        </div>
    );
}

export default function ResultsPanel({ prediction, formData }) {
    if (!prediction) return null;

    // Calculations
    const costPerKwh = 0.13; // Average US electricity cost
    const estimatedCost = prediction * costPerKwh;

    // CO2 savings vs gasoline (0.411 kg CO2/kWh grid vs ~0.21 kg CO2/km for gas car - EPA avg)
    const co2Saved = (formData.distance_driven * 0.21) - (prediction * 0.411);

    // Charging time estimation
    const estimatedTime = prediction / formData.charging_rate;

    const insights = [
        {
            icon: DollarSign,
            label: 'Estimated Cost',
            value: `$${estimatedCost.toFixed(2)}`,
            color: 'text-blue',
            bgColor: 'from-blue-500/20 to-blue-500/5'
        },
        {
            icon: Leaf,
            label: 'CO₂ Saved',
            value: `${co2Saved.toFixed(1)} kg`,
            color: 'text-green',
            bgColor: 'from-emerald-500/20 to-emerald-500/5'
        },
        {
            icon: Clock,
            label: 'Charging Time',
            value: `${estimatedTime.toFixed(1)} hrs`,
            color: 'text-blue',
            bgColor: 'from-blue-500/20 to-blue-500/5'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <GlassCard hover={false} className="p-8">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Prediction Results</h2>

                {/* Main result */}
                <div className="flex flex-col items-center mb-8">
                    <CircularGauge value={prediction} max={150} />
                    <p className="text-sm text-muted mt-4">Predicted Energy Consumption</p>
                    <p className="text-xs text-muted mt-1">Based on historical patterns and ML models</p>
                </div>

                <div className="divider" />

                {/* Insights grid */}
                <div className="grid grid-3 gap-4 mb-6">
                    {insights.map((insight, index) => (
                        <motion.div
                            key={insight.label}
                            className="glass-card-static p-4 flex flex-col items-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${insight.bgColor} flex items-center justify-center mb-3`}>
                                <insight.icon className={`w-6 h-6 ${insight.color}`} />
                            </div>
                            <span className="text-xs text-muted mb-1">{insight.label}</span>
                            <span className="text-lg font-bold text-white">{insight.value}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Recommendations */}
                <div className="glass-card-static p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-1">Smart Recommendation</h4>
                            <p className="text-xs text-muted">
                                {formData.start_hour >= 22 || formData.start_hour <= 6
                                    ? '✓ Great choice! Charging during off-peak hours saves money and reduces grid stress.'
                                    : '💡 Consider charging during off-peak hours (10 PM - 6 AM) for lower rates and eco-friendly usage.'}
                            </p>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
