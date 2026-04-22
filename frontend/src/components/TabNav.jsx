import { motion } from 'framer-motion';
import { Zap, BarChart3, DollarSign, Truck, Brain } from 'lucide-react';

const tabs = [
    { id: 'predict', label: 'Predict', icon: Zap },
    { id: 'forecast', label: 'Forecast', icon: BarChart3 },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'xai', label: 'Explainability', icon: Brain },
];

export default function TabNav({ activeTab, onTabChange }) {
    return (
        <motion.nav
            className="tab-nav glass-card-static"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="tab-nav-inner">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className={`tab-btn ${isActive ? 'tab-btn-active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                            {isActive && (
                                <motion.div
                                    className="tab-indicator"
                                    layoutId="tab-indicator"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </motion.nav>
    );
}
