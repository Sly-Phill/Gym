import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const styles = {
  success: { icon: CheckCircle2, color: '#c6ff00' },
  error: { icon: AlertTriangle, color: '#ff5d73' },
  info: { icon: Info, color: '#00e5ff' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message, { type = 'success', title } = {}) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t.slice(-2), { id, message, type, title }])
      setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] lg:items-end lg:pr-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, color } = styles[t.type]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 !rounded-2xl p-4"
                style={{ boxShadow: `0 12px 40px -12px ${color}88` }}
                role="status"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} />
                <div className="min-w-0 flex-1">
                  {t.title && <p className="font-display font-semibold">{t.title}</p>}
                  <p className="text-sm text-muted">{t.message}</p>
                </div>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
