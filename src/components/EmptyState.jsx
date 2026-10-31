import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
    >
      <div className="grid h-16 w-16 animate-floaty place-items-center rounded-2xl border border-line/10 bg-line/5">
        <Icon className="h-7 w-7 text-accent" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-muted">{message}</p>
      {action}
    </motion.div>
  )
}
