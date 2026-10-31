import { motion } from 'framer-motion'
import { DatabaseZap, WifiOff, AlertTriangle, RotateCcw } from 'lucide-react'

const variants = {
  database_unreachable: { icon: DatabaseZap, title: "Can't reach the database" },
  database_not_setup: { icon: DatabaseZap, title: 'Database not set up yet' },
  config: { icon: DatabaseZap, title: 'Database not configured' },
  network: { icon: WifiOff, title: 'Server is offline' },
}

export default function ErrorState({ error, onRetry, className = '' }) {
  const { icon: Icon, title } = variants[error?.code] || { icon: AlertTriangle, title: 'Something went wrong' }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass flex flex-col items-center gap-3 px-6 py-12 text-center ${className}`}
      role="alert"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/15">
        <Icon className="h-8 w-8 text-rose-400" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-2">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      )}
    </motion.div>
  )
}
