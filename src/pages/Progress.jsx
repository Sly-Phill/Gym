import { useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react'
import Page, { PageHeader } from '../components/Page'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { lifts, personalRecords, strengthHistory } from '../data/mock'
import { useChartColors, useInk } from '../context/ThemeContext'

const tiers = {
  gold: { color: '#ffd23f', icon: Trophy, label: 'Gold' },
  silver: { color: '#cbd5e1', icon: Medal, label: 'Silver' },
  bronze: { color: '#f59e6b', icon: Award, label: 'Bronze' },
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass !rounded-xl px-3 py-2 text-xs">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {lifts.find((l) => l.key === p.dataKey)?.label}: <span className="font-semibold text-ink">{p.value} kg</span>
        </p>
      ))}
    </div>
  )
}

export default function Progress() {
  const chart = useChartColors()
  const ink = useInk()
  const [visible, setVisible] = useState(() => new Set(lifts.map((l) => l.key)))
  const first = strengthHistory[0]
  const last = strengthHistory[strengthHistory.length - 1]
  const totalGain = lifts.reduce((s, l) => s + (last[l.key] - first[l.key]), 0)

  const toggle = (key) => {
    const next = new Set(visible)
    if (next.has(key) && next.size > 1) next.delete(key)
    else next.add(key)
    setVisible(next)
  }

  return (
    <Page>
      <PageHeader eyebrow="Progress" title="Stronger every month" subtitle="Your estimated 1-rep max over the last six months." />

      <div className="mb-4 grid grid-cols-3 gap-3 lg:mb-6 lg:gap-6">
        {lifts.map((l, i) => {
          const gain = last[l.key] - first[l.key]
          return (
            <GlassCard key={l.key} delay={i * 0.06} className="!p-4 sm:!p-5">
              <p className="text-xs text-muted sm:text-sm">{l.label}</p>
              <p className="mt-1 font-display text-2xl font-bold sm:text-4xl">
                <AnimatedCounter value={last[l.key]} />
                <span className="text-sm font-medium text-muted"> kg</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold" style={{ color: ink(l.color) }}>
                <TrendingUp className="h-3.5 w-3.5" /> +{gain} kg
              </p>
            </GlassCard>
          )
        })}
      </div>

      <GlassCard hover={false} delay={0.15}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Strength gains</p>
            <p className="mt-1 font-display text-3xl font-bold">
              +<AnimatedCounter value={totalGain} /> kg <span className="text-base font-medium text-muted">total since May</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lifts.map((l) => {
              const on = visible.has(l.key)
              return (
                <button
                  key={l.key}
                  onClick={() => toggle(l.key)}
                  className={`chip border transition ${on ? 'border-transparent' : 'border-line/10 text-muted opacity-60'}`}
                  style={on ? { background: `${l.color}1f`, color: ink(l.color) } : undefined}
                  aria-pressed={on}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-6 h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={strengthHistory} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <defs>
                {lifts.map((l) => (
                  <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={l.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={l.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chart.muted, fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.muted, fontSize: 11 }} unit=" kg" width={64} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.grid, strokeWidth: 2 }} />
              {lifts
                .filter((l) => visible.has(l.key))
                .map((l) => (
                  <Area
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    stroke={l.color}
                    strokeWidth={3}
                    fill={`url(#grad-${l.key})`}
                    dot={{ r: 3, fill: chart.dot, stroke: l.color, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: l.color, stroke: chart.dot, strokeWidth: 2 }}
                    animationDuration={1600}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <h2 className="mb-4 mt-10 flex items-center gap-2 text-2xl font-bold">
        <Trophy className="h-6 w-6 text-yellow-400" /> Personal records
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personalRecords.map((pr, i) => {
          const t = tiers[pr.tier]
          return (
            <motion.div
              key={pr.lift}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -5 }}
              className="glass group relative flex items-center gap-4 overflow-hidden p-5"
              style={{ boxShadow: undefined }}
            >
              <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: t.color }} />
              <motion.div
                whileHover={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.5 }}
                className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${t.color}40, ${t.color}10)`, boxShadow: `0 0 30px -8px ${t.color}` }}
              >
                <t.icon className="h-8 w-8" style={{ color: t.color }} />
              </motion.div>
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted">{pr.lift}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ink(t.color) }}>
                    {t.label}
                  </span>
                </div>
                <p className="font-display text-3xl font-bold">
                  {pr.value}
                  <span className="text-base font-medium text-muted"> {pr.unit}</span>
                </p>
                <p className="text-xs text-muted">
                  {pr.date} · <span className="font-semibold text-accent">{pr.delta}</span>
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Page>
  )
}
