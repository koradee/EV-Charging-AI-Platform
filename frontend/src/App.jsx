import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { Zap, Activity, TrendingUp, Database } from 'lucide-react';

import FormSection from './components/FormSection';
import ResultsPanel from './components/ResultsPanel';
import HistoryPanel from './components/HistoryPanel';
import PredictionChart from './components/PredictionChart';
import StatsCard from './components/StatsCard';

function App() {
  const [formData, setFormData] = useState({
    battery_capacity: 75.0,
    charging_duration: 2.5,
    charging_rate: 25.0,
    distance_driven: 150.0,
    temperature: 20.0,
    soc_start: 30.0,
    soc_end: 80.0,
    vehicle_age: 3.0,
    start_hour: 12,
    charger_type: 'Level 2'
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('ev-predictions');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('ev-predictions', JSON.stringify(history));
    }
  }, [history]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'charger_type' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading('Analyzing charging pattern...');

    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', formData);
      const predictedValue = response.data.predicted_energy_consumed_kwh;

      setPrediction(predictedValue);

      // Add to history
      const newEntry = {
        id: history.length + 1,
        energy: predictedValue,
        params: formData,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [...prev, newEntry]);

      toast.success('Prediction completed!', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Failed to get prediction. Ensure backend is running at http://127.0.0.1:8000', {
        id: loadingToast,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ev-predictions');
    toast.success('History cleared');
  };

  // Calculate stats
  const totalPredictions = history.length;
  const avgConsumption = history.length > 0
    ? history.reduce((sum, item) => sum + item.energy, 0) / history.length
    : 0;

  const chartData = history.map(item => ({
    id: item.id,
    energy: item.energy
  }));

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1e293b',
            },
          },
        }}
      />

      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-12 h-12 text-blue" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text">
              EV Charging Forecaster
            </h1>
          </div>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Predict energy consumption with machine learning. Optimize your charging strategy, save costs, and reduce environmental impact.
          </p>
        </motion.div>

        {/* Stats Overview */}
        {totalPredictions > 0 && (
          <div className="grid grid-3 gap-6 mb-8">
            <StatsCard
              title="Total Predictions"
              value={totalPredictions}
              icon={Database}
              delay={0}
            />
            <StatsCard
              title="Average Consumption"
              value={avgConsumption.toFixed(1)}
              unit="kWh"
              icon={Activity}
              delay={0.1}
            />
            <StatsCard
              title="Latest Result"
              value={history.length > 0 ? history[history.length - 1].energy.toFixed(1) : '0'}
              unit="kWh"
              icon={TrendingUp}
              delay={0.2}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Form */}
          <div>
            <FormSection
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>

          {/* Right Column - Results */}
          <div className="flex flex-col gap-8">
            {prediction && (
              <ResultsPanel prediction={prediction} formData={formData} />
            )}

            {!prediction && totalPredictions === 0 && (
              <motion.div
                className="glass-card-static p-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Zap className="w-16 h-16 text-blue mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to Predict
                </h3>
                <p className="text-muted">
                  Fill in the charging parameters and click predict to see your energy consumption forecast.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <div className="mb-8">
            <PredictionChart data={chartData} type="area" />
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <HistoryPanel history={history} onClear={handleClearHistory} />
        )}

        {/* Footer */}
        <motion.footer
          className="text-center mt-12 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-muted">
            Powered by Machine Learning • RandomForest Regression Model
          </p>
        </motion.footer>
      </div>
    </>
  );
}

export default App;
