import { Quote } from 'lucide-react'
import GlassCard from './GlassCard'
import { quoteOfTheDay } from '../data/mock'

export default function QuoteCard({ delay = 0, className = '' }) {
  const q = quoteOfTheDay()
  return (
    <GlassCard delay={delay} glow="radial-gradient(circle, #00e5ff, transparent 70%)" className={className}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        <Quote className="h-4 w-4 text-cyan" /> Quote of the day
      </div>
      <p className="mt-3 font-display text-lg font-medium leading-snug sm:text-xl">&ldquo;{q.text}&rdquo;</p>
      <p className="mt-2 text-sm text-muted">&mdash; {q.author}</p>
    </GlassCard>
  )
}
