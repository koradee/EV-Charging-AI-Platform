import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from './GlassCard';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card-static p-3">
                <p className="text-sm text-white font-medium">{payload[0].value.toFixed(2)} kWh</p>
                <p className="text-xs text-muted">Prediction #{payload[0].payload.id}</p>
            </div>
        );
    }
    return null;
};

export default function PredictionChart({ data, type = 'area' }) {
    if (!data || data.length === 0) {
        return (
            <GlassCard hover={false} className="p-8">
                <p className="text-center text-muted">No prediction history yet. Make your first prediction!</p>
            </GlassCard>
        );
    }

    const ChartComponent = type === 'area' ? AreaChart : LineChart;
    const DataComponent = type === 'area' ? Area : Line;

    return (
        <GlassCard hover={false} className="p-6">
            <h3 className="text-xl font-bold mb-6 gradient-text">Prediction Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
                <ChartComponent data={data}>
                    <defs>
                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis
                        dataKey="id"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 12 } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <DataComponent
                        type="monotone"
                        dataKey="energy"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#colorEnergy)"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                    />
                </ChartComponent>
            </ResponsiveContainer>
        </GlassCard>
    );
}
