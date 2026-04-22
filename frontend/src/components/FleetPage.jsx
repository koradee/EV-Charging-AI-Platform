import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Truck, Plus, Trash2, Play, Clock, Zap } from 'lucide-react';
import GlassCard from './GlassCard';

const defaultVehicle = { id: '', arrival_hour: 8, departure_hour: 17, energy_needed_kwh: 30 };

export default function FleetPage() {
    const [vehicles, setVehicles] = useState([
        { id: 'EV-001', arrival_hour: 8, departure_hour: 17, energy_needed_kwh: 40 },
        { id: 'EV-002', arrival_hour: 9, departure_hour: 14, energy_needed_kwh: 25 },
        { id: 'EV-003', arrival_hour: 7, departure_hour: 20, energy_needed_kwh: 60 },
    ]);
    const [maxCapacity, setMaxCapacity] = useState(100);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addVehicle = () => {
        const nextId = `EV-${String(vehicles.length + 1).padStart(3, '0')}`;
        setVehicles([...vehicles, { ...defaultVehicle, id: nextId }]);
    };

    const removeVehicle = (index) => {
        setVehicles(vehicles.filter((_, i) => i !== index));
    };

    const updateVehicle = (index, field, value) => {
        const updated = [...vehicles];
        updated[index] = { ...updated[index], [field]: field === 'id' ? value : parseFloat(value) || 0 };
        setVehicles(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const response = await axios.post(`${apiUrl}/fleet/optimize`, {
                vehicles,
                max_grid_capacity: maxCapacity,
            });
            setResult(response.data);
        } catch (err) {
            setError('Failed to optimize fleet. Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Build 24h timeline visualization from schedule
    const getTimelineBar = (start, duration, status) => {
        if (start < 0) return null;
        const left = (start / 24) * 100;
        const width = (duration / 24) * 100;
        return { left: `${left}%`, width: `${width}%`, status };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <h2 className="text-3xl font-bold gradient-text flex items-center gap-3 mb-2">
                <Truck size={28} />
                Fleet Optimizer
            </h2>
            <p className="text-muted mb-6">Schedule charging for multiple vehicles using Earliest Departure First (EDF) strategy</p>

            <div className="grid grid-2 gap-6">
                {/* Fleet Input */}
                <GlassCard hover={false} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Fleet Vehicles</h3>
                        <button onClick={addVehicle} className="btn-secondary text-sm px-3 py-2 flex items-center gap-1">
                            <Plus size={14} /> Add Vehicle
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-3" style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {vehicles.map((v, i) => (
                                <motion.div
                                    key={i}
                                    className="glass-card-static p-3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <input
                                            type="text"
                                            value={v.id}
                                            onChange={(e) => updateVehicle(i, 'id', e.target.value)}
                                            className="text-sm font-semibold"
                                            style={{ width: 100, padding: '4px 8px' }}
                                        />
                                        <button type="button" onClick={() => removeVehicle(i)} className="btn-secondary px-2 py-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-3 gap-2">
                                        <div>
                                            <label className="text-xs text-muted">Arrival</label>
                                            <input type="number" value={v.arrival_hour} onChange={(e) => updateVehicle(i, 'arrival_hour', e.target.value)} min={0} max={23} step={1} style={{ padding: '4px 6px', fontSize: '0.8rem' }} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted">Departure</label>
                                            <input type="number" value={v.departure_hour} onChange={(e) => updateVehicle(i, 'departure_hour', e.target.value)} min={0} max={23} step={1} style={{ padding: '4px 6px', fontSize: '0.8rem' }} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted">kWh Needed</label>
                                            <input type="number" value={v.energy_needed_kwh} onChange={(e) => updateVehicle(i, 'energy_needed_kwh', e.target.value)} min={1} max={150} step={1} style={{ padding: '4px 6px', fontSize: '0.8rem' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <label className="flex items-center gap-2 text-sm">
                                <Zap size={14} className="text-blue" />
                                Max Grid Capacity (kW)
                            </label>
                            <input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(parseFloat(e.target.value) || 100)} min={10} max={1000} step={10} />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading || vehicles.length === 0}
                            className="btn-primary w-full py-3 mt-4"
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2"><div className="spinner" /> Optimizing...</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2"><Play size={18} /> Optimize Schedule</span>
                            )}
                        </motion.button>
                    </form>
                </GlassCard>

                {/* Results */}
                <div className="flex flex-col gap-6">
                    {error && (
                        <GlassCard hover={false} className="p-6">
                            <p className="text-center" style={{ color: '#ef4444' }}>{error}</p>
                        </GlassCard>
                    )}

                    {result && (
                        <GlassCard hover={false} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Charging Schedule</h3>
                                <span className="badge badge-green">{result.strategy}</span>
                            </div>

                            {/* Timeline Header */}
                            <div className="mb-2 flex justify-between text-xs text-muted" style={{ paddingLeft: 80 }}>
                                {[0, 4, 8, 12, 16, 20, 23].map(h => (
                                    <span key={h}>{h}:00</span>
                                ))}
                            </div>

                            {/* Schedule Rows */}
                            <div className="flex flex-col gap-3">
                                {result.schedule.map((item, i) => {
                                    const bar = getTimelineBar(item.assigned_start_hour, item.duration, item.status);
                                    return (
                                        <motion.div
                                            key={item.vehicle_id}
                                            className="glass-card-static p-3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-bold text-white" style={{ minWidth: 70 }}>{item.vehicle_id}</span>
                                                <span className={`badge ${item.status === 'Scheduled' ? 'badge-green' : 'badge-blue'}`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-xs text-muted ml-auto">
                                                    {item.assigned_start_hour >= 0 ? `${item.assigned_start_hour}:00 → ${item.assigned_start_hour + item.duration}:00` : 'N/A'}
                                                </span>
                                            </div>
                                            {/* Mini timeline */}
                                            <div style={{ position: 'relative', height: 8, background: 'rgba(148,163,184,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                                                {bar && (
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: bar.width }}
                                                        transition={{ duration: 0.6, delay: i * 0.1 }}
                                                        style={{
                                                            position: 'absolute',
                                                            left: bar.left,
                                                            height: '100%',
                                                            background: bar.status === 'Scheduled'
                                                                ? 'linear-gradient(90deg, #10b981, #3b82f6)'
                                                                : '#ef4444',
                                                            borderRadius: 4,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    )}

                    {!result && !error && (
                        <GlassCard hover={false} className="p-8 text-center">
                            <Truck className="w-12 h-12 text-blue mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-semibold text-white mb-2">Fleet Scheduler</h3>
                            <p className="text-muted text-sm">Add vehicles with arrival/departure windows and let the optimizer find the best schedule.</p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
