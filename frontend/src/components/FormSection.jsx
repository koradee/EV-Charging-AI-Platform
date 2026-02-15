import { motion } from 'framer-motion';
import { Battery, Clock, Thermometer, Car, Zap, Calendar } from 'lucide-react';
import GlassCard from './GlassCard';

const CHARGER_TYPES = ['Level 1', 'Level 2', 'DC Fast Charger'];

const formFields = [
    { name: 'battery_capacity', label: 'Battery Capacity', unit: 'kWh', icon: Battery, min: 0, max: 200, step: 0.1 },
    { name: 'charging_duration', label: 'Charging Duration', unit: 'hours', icon: Clock, min: 0, max: 10, step: 0.1 },
    { name: 'charging_rate', label: 'Charging Rate', unit: 'kW', icon: Zap, min: 0, max: 100, step: 0.1 },
    { name: 'distance_driven', label: 'Distance Driven', unit: 'km', icon: Car, min: 0, max: 500, step: 1 },
    { name: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, min: -20, max: 50, step: 0.1 },
    { name: 'soc_start', label: 'Start State of Charge', unit: '%', icon: Battery, min: 0, max: 100, step: 1 },
    { name: 'soc_end', label: 'End State of Charge', unit: '%', icon: Battery, min: 0, max: 100, step: 1 },
    { name: 'vehicle_age', label: 'Vehicle Age', unit: 'years', icon: Calendar, min: 0, max: 15, step: 0.1 },
    { name: 'start_hour', label: 'Start Hour', unit: '(0-23)', icon: Clock, min: 0, max: 23, step: 1, type: 'number' },
];

export default function FormSection({ formData, onChange, onSubmit, loading }) {
    return (
        <GlassCard hover={false} className="p-8">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Charging Parameters</h2>

            <form onSubmit={onSubmit} className="grid gap-6">
                <div className="grid grid-2 gap-6">
                    {formFields.map((field, index) => (
                        <motion.div
                            key={field.name}
                            className="flex flex-col gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                            <label className="flex items-center gap-2">
                                <field.icon size={16} className="text-blue" />
                                <span>{field.label}</span>
                                <span className="text-xs text-muted">{field.unit}</span>
                            </label>
                            <input
                                type="number"
                                name={field.name}
                                value={formData[field.name]}
                                onChange={onChange}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                required
                                className="transition-all"
                            />
                        </motion.div>
                    ))}

                    <motion.div
                        className="flex flex-col gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: formFields.length * 0.03 }}
                    >
                        <label className="flex items-center gap-2">
                            <Zap size={16} className="text-blue" />
                            <span>Charger Type</span>
                        </label>
                        <select
                            name="charger_type"
                            value={formData.charger_type}
                            onChange={onChange}
                            required
                            className="transition-all"
                        >
                            {CHARGER_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </motion.div>
                </div>

                <motion.button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg mt-4"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-3">
                            <div className="spinner" />
                            Analyzing...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Zap size={20} />
                            Predict Energy Consumption
                        </span>
                    )}
                </motion.button>
            </form>
        </GlassCard>
    );
}
