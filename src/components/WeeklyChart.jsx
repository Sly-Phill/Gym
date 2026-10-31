import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartColors } from '../context/ThemeContext'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass !rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold">{label}</p>
      <p className="text-muted">{d.minutes ? `${d.minutes} active min` : 'Rest day'}</p>
    </div>
  )
}

/** Active minutes per day; the last bar (today) is highlighted. Loaded lazily by the Dashboard. */
export default function WeeklyChart({ data }) {
  const chart = useChartColors()
  const todayIdx = data.length - 1
  // Evenly spaced y-axis: 0, ⅓, ⅔ and the top, rounded to a multiple of 15 minutes (min 30).
  const yTop = Math.max(30, Math.ceil(Math.max(...data.map((d) => d.minutes)) / 15) * 15)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c6ff00" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: chart.muted, fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.muted, fontSize: 11 }} domain={[0, yTop]} ticks={[0, yTop / 3, (2 * yTop) / 3, yTop]} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="minutes" radius={[10, 10, 4, 4]} animationDuration={1400} animationEasing="ease-out" maxBarSize={44}>
          {data.map((d, i) => (
            <Cell key={d.date} fill={i === todayIdx || d.minutes ? 'url(#barGrad)' : chart.bar} fillOpacity={i === todayIdx ? 1 : 0.55} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
