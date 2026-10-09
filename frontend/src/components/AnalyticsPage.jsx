import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import GlassCard from './GlassCard';

const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const selectFields = [
    ['vehicle_model', 'Vehicle model'], ['location', 'Station city'],
    ['charger_type', 'Charger type'], ['time_of_day', 'Time of day label'],
    ['day_of_week', 'Day of week label'],
];
const numberFields = [
    ['battery_capacity', 'Battery capacity (kWh)', 0.01],
    ['energy_consumed', 'Measured energy (kWh)', 0.01],
    ['charging_duration', 'Measured duration (hours)', 0.01],
    ['charging_rate', 'Charging rate (kW)', 0.01],
    ['soc_start', 'Starting charge (%)', 0, 100],
    ['soc_end', 'Ending charge (%)', 0, 100],
    ['distance_driven', 'Distance since last charge (km)', 0],
    ['temperature', 'Temperature (°C)'], ['vehicle_age', 'Vehicle age (years)', 0],
    ['start_hour', 'Start hour (0–23)', 0, 23, 1], ['month', 'Month (1–12)', 1, 12, 1],
];

function errorMessage(error) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map(item => `${item.loc.at(-1)}: ${item.msg}`).join('; ');
    return 'Could not reach analytics. Check the API connection and try again.';
}

function SummaryChart({ title, data, valueKey, unit }) {
    return (
        <GlassCard hover={false} className="p-6">
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={value => [`${Number(value).toFixed(2)} ${unit}`, 'Average']} contentStyle={{ background: '#1e293b', color: '#fff' }} />
                    <Bar dataKey={valueKey} fill="#10b981" radius={[5, 5, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </GlassCard>
    );
}

export default function AnalyticsPage() {
    const [metadata, setMetadata] = useState(null);
    const [overview, setOverview] = useState(null);
    const [inputs, setInputs] = useState(null);
    const [filters, setFilters] = useState({ location: '', charger_type: '', user_type: '' });
    const [mode, setMode] = useState('cost');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [overviewError, setOverviewError] = useState('');
    const [predictionError, setPredictionError] = useState('');
    const [loading, setLoading] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        axios.get(`${apiUrl}/analytics/metadata`, { signal: controller.signal })
            .then(({ data }) => { setMetadata(data); setInputs(data.example); setError(''); })
            .catch(err => { if (!axios.isCancel(err)) setError(errorMessage(err)); });
        return () => controller.abort();
    }, [retry]);

    useEffect(() => {
        const controller = new AbortController();
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        setOverview(null);
        setOverviewError('');
        axios.get(`${apiUrl}/analytics/overview`, { params, signal: controller.signal })
            .then(({ data }) => setOverview(data))
            .catch(err => { if (!axios.isCancel(err)) setOverviewError(errorMessage(err)); });
        return () => controller.abort();
    }, [filters, retry]);

    function updateInput(key, value) {
        setInputs(previous => ({ ...previous, [key]: value }));
        setResult(null);
        setPredictionError('');
    }

    async function predict(event) {
        event.preventDefault();
        setLoading(true); setResult(null); setPredictionError('');
        const payload = { ...inputs };
        // Neither endpoint receives its prediction target as an input.
        delete payload[mode === 'cost' ? 'charging_cost' : 'user_type'];
        try {
            const response = await axios.post(`${apiUrl}/analytics/predict-${mode}`, payload);
            setResult(response.data);
        } catch (err) { setPredictionError(errorMessage(err)); }
        finally { setLoading(false); }
    }

    if (error) return <div role="alert"><p>{error}</p><button className="btn-secondary mt-4" onClick={() => setRetry(value => value + 1)}>Retry</button></div>;
    if (!metadata || !inputs) return <p role="status">Loading network analytics…</p>;

    return (
        <div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Network Analytics</h2>
            <p className="text-muted mb-6">Explore usage, session cost, and driver segments across {metadata.total_sessions.toLocaleString()} synthetic charging sessions.</p>
            <GlassCard hover={false} className="p-6 mb-6"><p>{metadata.notice}</p></GlassCard>
            <div className="grid grid-3 gap-4 mb-6">
                {['location', 'charger_type', 'user_type'].map(key => (
                    <label key={key}>{ { location: 'City', charger_type: 'Charger', user_type: 'Driver' }[key] }
                        <select value={filters[key]} onChange={event => setFilters(previous => ({ ...previous, [key]: event.target.value }))}>
                            <option value="">All</option>
                            {metadata.options[key].map(value => <option key={value}>{value}</option>)}
                        </select>
                    </label>
                ))}
            </div>
            {overviewError && <div role="alert" className="mb-6"><p>{overviewError}</p><button className="btn-secondary mt-4" onClick={() => setRetry(value => value + 1)}>Retry overview</button></div>}
            {!overview && !overviewError && <p role="status">Updating overview…</p>}
            {overview && <>
                <div className="grid grid-3 gap-4 mb-6">
                    {[['Matching sessions', overview.sessions], ['Average cost', overview.avg_cost_usd == null ? '—' : `$${overview.avg_cost_usd.toFixed(2)}`], ['Average energy', overview.avg_energy_kwh == null ? '—' : `${overview.avg_energy_kwh.toFixed(2)} kWh`]].map(([title, value]) => (
                        <GlassCard key={title} hover={false} className="p-6"><p className="text-muted">{title}</p><p className="text-2xl font-bold">{value}</p></GlassCard>
                    ))}
                </div>
                {overview.sessions === 0 ? <p className="mb-6">No sessions match these filters.</p> : <div className="grid grid-2 gap-6 mb-8">
                    <SummaryChart title="Session cost by city" data={overview.by_city} valueKey="avg_cost_usd" unit="USD" />
                    <SummaryChart title="Energy by time of day" data={overview.by_time_of_day} valueKey="avg_energy_kwh" unit="kWh" />
                    <SummaryChart title="Session cost by charger" data={overview.by_charger_type} valueKey="avg_cost_usd" unit="USD" />
                    <SummaryChart title="Energy by driver segment" data={overview.by_driver_type} valueKey="avg_energy_kwh" unit="kWh" />
                </div>}
            </>}
            <GlassCard hover={false} className="p-6">
                <h3 className="text-2xl font-bold mb-3">Completed-session model explorer</h3>
                <p className="text-muted mb-4">Prefilled with a real row from the synthetic dataset. Enter measured session values to compare the imported models. Cost prediction requires a known driver type; driver classification requires a known cost. Day and time labels are retained from the dataset and may differ from its timestamps.</p>
                <label>Model
                    <select disabled={loading} value={mode} onChange={event => { setMode(event.target.value); setResult(null); setPredictionError(''); }}>
                        <option value="cost">Predict session cost</option>
                        <option value="driver">Classify driver profile</option>
                    </select>
                </label>
                <form onSubmit={predict} className="mt-6">
                    <fieldset disabled={loading} style={{ border: 0, padding: 0, minWidth: 0 }}>
                        <div className="grid grid-3 gap-4">
                            {selectFields.map(([key, label]) => <label key={key}>{label}<select value={inputs[key]} onChange={event => updateInput(key, event.target.value)}>{metadata.options[key].map(value => <option key={value}>{value}</option>)}</select></label>)}
                            {numberFields.map(([key, label, min, max, step]) => <label key={key}>{label}<input required type="number" step={step || 'any'} min={min} max={max} value={inputs[key]} onChange={event => updateInput(key, event.target.value === '' ? '' : Number(event.target.value))} /></label>)}
                            {mode === 'cost' ? <label>Known driver type<select value={inputs.user_type} onChange={event => updateInput('user_type', event.target.value)}>{metadata.options.user_type.map(value => <option key={value}>{value}</option>)}</select></label> : <label>Measured session cost (USD)<input required type="number" min="0" step="any" value={inputs.charging_cost} onChange={event => updateInput('charging_cost', event.target.value === '' ? '' : Number(event.target.value))} /></label>}
                            <label>Charge levels corrected during cleaning?<select value={String(inputs.soc_was_swapped)} onChange={event => updateInput('soc_was_swapped', event.target.value === 'true')}><option value="false">No</option><option value="true">Yes</option></select></label>
                        </div>
                        <button className="btn-primary mt-6" type="submit">{loading ? 'Running model…' : mode === 'cost' ? 'Estimate cost' : 'Classify driver'}</button>
                    </fieldset>
                </form>
                {predictionError && <p role="alert" className="mt-4">{predictionError}</p>}
                {result && <div role="status" className="mt-6">
                    {mode === 'cost' ? <p className="text-2xl font-bold text-green">Estimated cost: ${result.estimated_cost_usd.toFixed(2)}</p> : <><p className="text-2xl font-bold text-green">{result.driver_profile}</p><ul>{result.probabilities.map(item => <li key={item.profile}>{item.profile}: {(item.probability * 100).toFixed(1)}%</li>)}</ul></>}
                    <p className="text-muted mt-3">{result.notice}</p>
                </div>}
            </GlassCard>
        </div>
    );
}
