import { useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * The glowing highlight that glides to the active button in a row of pills.
 * Mark the active button with data-pill-active="true"; the container must be `relative`.
 * (Replaces framer-motion `layoutId`, which stalled page exit animations: blank page bug.)
 */
export default function SlidingPill({ containerRef, activeKey, className = '' }) {
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const el = container.querySelector('[data-pill-active="true"]')
      setBox(el ? { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight } : null)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [containerRef, activeKey])

  if (!box) return null
  return (
    <motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 top-0 bg-gradient-brand shadow-glow ${className}`}
      initial={false}
      animate={box}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    />
  )
}
