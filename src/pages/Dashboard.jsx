import { lazy, Suspense, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Flame, Timer, Dumbbell, ChevronRight, Zap, Calendar, CheckCircle2, ListPlus, Trophy } from 'lucide-react'
import Page from '../components/Page'
import GlassCard from '../components/GlassCard'
import ProgressRing from '../components/ProgressRing'
import AnimatedCounter from '../components/AnimatedCounter'
import QuoteCard from '../components/QuoteCard'
import ErrorState from '../components/ErrorState'
import Skeleton, { SkeletonCard } from '../components/Skeleton'
import { useApi } from '../lib/useApi'
import { localDate } from '../lib/api'
import { buildRings } from '../lib/rings'

// The charts library is the heaviest download, so the chart loads just after the rest of the page.
const WeeklyChart = lazy(() => import('../components/WeeklyChart'))

const intensityLevel = { Low: 0.34, Moderate: 0.67, High: 1 }

// Renders one ring per goal at the right size, instead of a hidden desktop copy plus a phone copy.
function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Rough session length: ~40s of work per set plus the prescribed rest. */
export function estimateMinutes(exercises) {
  const seconds = exercises.reduce((s, e) => s + e.sets.length * (40 + e.restSeconds), 0)
  return Math.max(1, Math.round(seconds / 60))
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <SkeletonCard className="lg:col-span-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-2 pt-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 !rounded-3xl" />
          <Skeleton className="h-14 w-20" />
        </div>
        <Skeleton className="h-8" />
      </SkeletonCard>
      <SkeletonCard className="lg:col-span-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-52" />
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12" />
      </SkeletonCard>
    </div>
  )
}

export default function Dashboard() {
  const wide = useMediaQuery('(min-width: 640px)') // Tailwind `sm`
  const { data, error, loading, reload } = useApi(`/dashboard?date=${localDate()}`)

  if (!data) {
    return (
      <Page>
        <div className="mb-6 lg:mb-8">
          <Skeleton className="mb-2 h-4 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
        {error && !loading ? <ErrorState error={error} onRetry={reload} /> : <DashboardSkeleton />}
      </Page>
    )
  }

  const { user, today, weeklyActivity, totalMinutes, prevMinutes, streak, week, nextClass } = data
  const todayIdx = weeklyActivity.length - 1
  const hasWorkout = today && today.exercises.length > 0
  const totalSets = hasWorkout ? today.exercises.reduce((s, e) => s + e.sets.length, 0) : 0
  const doneSets = hasWorkout ? today.exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0) : 0
  const change = prevMinutes ? Math.round(((totalMinutes - prevMinutes) / prevMinutes) * 100) : null

  const rings = buildRings(user, week)

  return (
    <Page>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8">
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {user.fullName.split(' ')[0]} <span className="inline-block origin-bottom-right animate-wave">👋</span>
        </h1>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Today's workout */}
        <GlassCard className="lg:col-span-2 !p-0" glow="radial-gradient(circle, #c6ff00, transparent 70%)">
          {hasWorkout ? (
            <div className="relative overflow-hidden p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className={`chip ${today.status === 'completed' ? 'bg-cyan/15 text-cyan' : 'bg-accent/15 text-accent'}`}>
                    {today.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    {today.status === 'completed' ? 'Completed today' : today.status === 'in_progress' ? 'In progress' : 'Today’s workout'}
                  </span>
                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{today.name}</h2>
                  <p className="text-muted">
                    {[...new Set(today.exercises.map((e) => e.muscleGroup))].join(' · ')}
                  </p>
                </div>
                {today.status === 'completed' ? (
                  <Link to="/workout" className="btn-ghost w-full sm:w-auto">
                    <Trophy className="h-5 w-5 text-yellow-400" /> View summary
                  </Link>
                ) : (
                  <Link to="/workout" className="btn-primary w-full sm:w-auto">
                    <Play className="h-5 w-5 fill-current" /> {today.status === 'in_progress' ? 'Resume' : 'Start'}
                    <span className="sr-only"> workout</span>
                  </Link>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="chip bg-line/5 text-ink">
                  <Timer className="h-3.5 w-3.5 text-cyan" />
                  {today.durationMinutes ? `${today.durationMinutes} min` : `~${estimateMinutes(today.exercises)} min`}
                </span>
                <span className="chip bg-line/5 text-ink"><Flame className="h-3.5 w-3.5 text-orange-400" /> {doneSets}/{totalSets} sets</span>
                <span className="chip bg-line/5 text-ink"><Dumbbell className="h-3.5 w-3.5 text-accent" /> {today.exercises.length} exercises</span>
              </div>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {today.exercises.map((e, i) => (
                  <motion.li
                    key={e.workoutExerciseId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-center gap-3 rounded-2xl bg-line/5 px-4 py-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 font-display text-sm font-bold text-accent">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.name}</p>
                      <p className="text-xs text-muted">
                        {e.sets.length} × {e.reps} · rest {e.restSeconds}s
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-6 sm:p-7">
              <span className="chip bg-accent/15 text-accent">
                <Zap className="h-3.5 w-3.5" /> Today&rsquo;s workout
              </span>
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <div className="grid h-16 w-16 animate-floaty place-items-center rounded-2xl border border-line/10 bg-line/5">
                  <ListPlus className="h-7 w-7 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">No workout yet today</h2>
                <p className="max-w-xs text-sm text-muted">Pick a few exercises from the Library and they&rsquo;ll show up here, ready to start.</p>
                <Link to="/library" className="btn-primary mt-2">
                  <Dumbbell className="h-5 w-5" /> Browse the Library
                </Link>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Streak */}
        <GlassCard delay={0.08} glow="radial-gradient(circle, #ff7a1a, transparent 70%)">
          <div className="flex h-full flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Current streak</p>
            <div className="mt-4 flex items-center gap-4">
              {/* CSS animation (runs off the main thread) rather than an endless JS animation */}
              <div
                className={`grid h-20 w-20 place-items-center rounded-3xl ${
                  streak.current
                    ? 'animate-flicker bg-gradient-to-br from-orange-400 to-rose-500 shadow-[0_0_40px_-6px_rgba(255,122,26,0.7)]'
                    : 'bg-line/10'
                }`}
              >
                <Flame className={`h-11 w-11 ${streak.current ? 'fill-yellow-200 text-white' : 'text-muted'}`} />
              </div>
              <div>
                <p className="font-display text-6xl font-bold leading-none">
                  <AnimatedCounter value={streak.current} duration={1.2} />
                </p>
                <p className="text-sm text-muted">{streak.current === 1 ? 'day' : 'days'} in a row</p>
              </div>
            </div>
            <div className="mt-6 flex justify-between gap-1">
              {weeklyActivity.map((d, i) => (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.06, type: 'spring' }}
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs ${
                      d.minutes ? 'bg-orange-500/20 text-orange-400' : 'bg-line/5 text-muted'
                    } ${i === todayIdx ? 'ring-2 ring-accent' : ''}`}
                  >
                    {d.minutes ? <Flame className="h-4 w-4" /> : '·'}
                  </motion.span>
                  <span className="text-[10px] text-muted">{d.day[0]}</span>
                </div>
              ))}
            </div>
            <p className="mt-auto pt-4 text-xs text-muted">
              {streak.current === 0 ? (
                'Finish a workout today to start a new streak.'
              ) : streak.current >= streak.best ? (
                <>This is your <span className="font-semibold text-ink">best streak ever</span>. Keep it going! 🔥</>
              ) : (
                <>
                  Best streak: <span className="font-semibold text-ink">{streak.best} days</span>. You&rsquo;re {streak.best - streak.current} away!
                </>
              )}
            </p>
          </div>
        </GlassCard>

        {/* Weekly chart */}
        <GlassCard delay={0.12} className="lg:col-span-2" hover={false}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Last 7 days</p>
              <p className="mt-1 font-display text-3xl font-bold">
                <AnimatedCounter value={totalMinutes} /> <span className="text-base font-medium text-muted">active min</span>
              </p>
            </div>
            {change !== null ? (
              <span className={`chip ${change >= 0 ? 'bg-accent/15 text-accent' : 'bg-line/5 text-muted'}`}>
                {change >= 0 ? '+' : ''}
                {change}% vs last week
              </span>
            ) : totalMinutes > 0 ? (
              <span className="chip bg-accent/15 text-accent">Great start 💪</span>
            ) : null}
          </div>
          <div className="mt-4 h-56">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <WeeklyChart data={weeklyActivity} />
            </Suspense>
          </div>
        </GlassCard>

        {/* Next class */}
        <GlassCard delay={0.16} glow="radial-gradient(circle, #a78bfa, transparent 70%)">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Next class</p>
          {nextClass ? (
            <>
              <h3 className="mt-3 text-2xl font-bold">{nextClass.title}</h3>
              <p className="text-sm text-muted">
                {new Date(nextClass.startTime).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} ·{' '}
                {nextClass.coachName} · {nextClass.durationMinutes} min
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(intensityLevel[nextClass.intensity] ?? 0.5) * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="h-full rounded-full bg-gradient-brand"
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {nextClass.intensity} intensity · {nextClass.capacity} spots
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No more classes this week. Time to recover! 🧘</p>
          )}
          <Link to="/classes" className="btn-ghost mt-5 w-full">
            <Calendar className="h-4 w-4" /> See schedule <ChevronRight className="h-4 w-4" />
          </Link>
        </GlassCard>

        {/* Rings */}
        <GlassCard delay={0.2} className="lg:col-span-3" hover={false}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">This week</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-6">
            {rings.map((r, i) => (
              <div key={r.label} className="flex flex-col items-center gap-3">
                <ProgressRing
                  progress={r.progress}
                  size={wide ? 140 : 96}
                  stroke={wide ? 12 : 9}
                  color={r.color}
                  delay={0.3 + i * 0.15}
                >
                  <RingLabel r={r} small={!wide} />
                </ProgressRing>
                <div className="text-center">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="text-xs text-muted">
                    {r.value}/{r.goal} {r.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <QuoteCard delay={0.24} className="lg:col-span-3" />
      </div>
    </Page>
  )
}

function RingLabel({ r, small }) {
  return (
    <p className={`font-display font-bold ${small ? 'text-xl' : 'text-3xl'}`}>
      <AnimatedCounter value={r.percent} suffix="%" />
    </p>
  )
}
