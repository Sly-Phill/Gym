import { useId } from 'react'
import { Link } from 'react-router-dom'

export function PulseMark({ className = 'h-9 w-9' }) {
  // Unique per instance: a gradient defined inside a hidden (display:none) logo would blank out the others.
  const gradId = `pf-logo-${useId().replace(/:/g, '')}`
  const grad = `url(#${gradId})`
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c6ff00" />
          <stop offset="1" stopColor="#00e5ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={grad} opacity="0.14" />
      <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke={grad} strokeOpacity="0.45" strokeWidth="2" />
      <path
        d="M8 34h12l5-12 8 24 6-18 4 6h13"
        fill="none"
        stroke={grad}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="120"
        className="animate-pulseline"
      />
    </svg>
  )
}

export default function Logo({ size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-2xl'
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="PulseFit home">
      <PulseMark className={size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'} />
      <span className={`font-display ${text} font-bold italic tracking-tighter`}>
        <span className="text-gradient animate-shimmer">PulseFit</span>
      </span>
    </Link>
  )
}
