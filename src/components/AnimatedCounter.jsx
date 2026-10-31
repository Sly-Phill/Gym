import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

const format = (v, decimals) =>
  v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export default function AnimatedCounter({ value, decimals = 0, duration = 1.8, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const numberRef = useRef(null)
  // No negative margin: numbers sitting at the very bottom of a phone screen never "entered" and stayed at 0.
  const inView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (!inView) return
    // Writes the text directly each frame instead of re-rendering React 60 times a second.
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (numberRef.current) numberRef.current.textContent = format(v, decimals)
      },
    })
    return () => controls.stop()
  }, [inView, value, duration, decimals])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      <span ref={numberRef}>{format(0, decimals)}</span>
      {suffix}
    </span>
  )
}
