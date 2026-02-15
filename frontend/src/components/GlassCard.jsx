import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, ...props }) {
    const baseClass = hover ? 'glass-card' : 'glass-card-static';

    return (
        <motion.div
            className={`${baseClass} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {children}
        </motion.div>
    );
}
