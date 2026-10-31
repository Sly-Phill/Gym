import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, delay = 0, glow, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4 } : undefined}
      className={`glass relative overflow-hidden p-5 transition-shadow duration-300 ${hover ? 'hover:shadow-glow' : ''} ${className}`}
      {...rest}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: glow }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  )
}
