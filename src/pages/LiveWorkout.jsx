import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Pause, Play, Plus, SkipForward, Trophy, Flame, Timer, Dumbbell, X, ListPlus, Flag, Loader2, LayoutDashboard } from 'lucide-react'
import Page from '../components/Page'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Skeleton, { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { useApi } from '../lib/useApi'
import { api, localDate } from '../lib/api'

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const mmss = `${h ? String(m).padStart(2, '0') : m}:${String(s % 60).padStart(2, '0')}`
  return h ? `${h}:${mmss}` : mmss
}

function fireConfetti() {
  const colors = ['#c6ff00', '#00e5ff', '#ff4fd8', '#ffffff']
  const end = Date.now() + 2200
  confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors, zIndex: 200 })
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 200 })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 200 })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

const countSets = (w) => w.exercises.reduce((s, e) => s + e.sets.length, 0)
const countDone = (w) => w.exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0)

function withSet(workout, setId, completed) {
  return {
    ...workout,
    exercises: workout.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((s) => (s.id === setId ? { ...s, completed } : s)),
    })),
  }
}

export default function LiveWorkout() {
  const toast = useToast()
  const date = localDate()
  const { data, error, loading, reload, setData } = useApi(`/workouts?date=${date}`)
  const workout = data?.workout
  const [active, setActive] = useState(null)
  const [rest, setRest] = useState({ total: 0, remaining: 0, running: false })
  const [now, setNow] = useState(Date.now())
  const [showSummary, setShowSummary] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const endAt = useRef(null)
  const inflight = useRef(new Set())
  const startRequested = useRef(false)

  const completed = workout?.status === 'completed'
  const hasExercises = workout && workout.exercises.length > 0

  // Opening Live Workout Mode starts the session clock (once).
  useEffect(() => {
    if (!workout || workout.status !== 'planned' || !hasExercises || startRequested.current) return
    startRequested.current = true
    api('/workouts', { method: 'POST', body: { action: 'start', workoutId: workout.id, date } })
      .then((res) => setData((d) => (d?.workout ? { workout: { ...d.workout, status: res.workout.status, startedAt: res.workout.startedAt } } : d)))
      .catch((err) => toast(err.message, { type: 'error', title: "Couldn't start the clock" }))
  }, [workout, hasExercises, date, setData, toast])

  // Focus the first exercise that still has open sets.
  useEffect(() => {
    if (!workout || active !== null) return
    const idx = workout.exercises.findIndex((e) => e.sets.some((s) => !s.completed))
    setActive(idx === -1 ? 0 : idx)
  }, [workout, active])

  // Session clock
  useEffect(() => {
    if (!workout?.startedAt || completed) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [workout?.startedAt, completed])

  // Rest countdown
  useEffect(() => {
    if (!rest.running) return
    const id = setInterval(() => {
      const remaining = (endAt.current - Date.now()) / 1000
      if (remaining <= 0) {
        setRest((r) => ({ ...r, remaining: 0, running: false }))
        navigator.vibrate?.(200)
        toast('Rest over. Time for your next set!', { type: 'info', title: "Let's go" })
      } else {
        setRest((r) => ({ ...r, remaining }))
      }
    }, 100)
    return () => clearInterval(id)
  }, [rest.running, toast])

  const startRest = useCallback((seconds) => {
    endAt.current = Date.now() + seconds * 1000
    setRest({ total: seconds, remaining: seconds, running: true })
  }, [])

  const finish = useCallback(async () => {
    if (!workout || finishing) return
    setFinishing(true)
    setConfirmFinish(false)
    try {
      // Make sure every ticked set is saved before the workout gets locked.
      await Promise.allSettled([...inflight.current])
      const res = await api('/workouts', { method: 'POST', body: { action: 'finish', workoutId: workout.id, date } })
      setData(res)
      setRest({ total: 0, remaining: 0, running: false })
      setShowSummary(true)
      fireConfetti()
    } catch (err) {
      toast(err.message, { type: 'error', title: "Couldn't save your workout" })
    } finally {
      setFinishing(false)
    }
  }, [workout, finishing, date, setData, toast])

  const toggleSet = (ei, set) => {
    if (completed || finishing) return
    const next = !set.completed
    const updated = withSet(workout, set.id, next)
    setData({ workout: updated }) // optimistic

    const request = api('/sets', { method: 'PATCH', body: { setId: set.id, completed: next } })
      .then((res) => {
        if (res.startedAt) setData((d) => (d?.workout && !d.workout.startedAt ? { workout: { ...d.workout, startedAt: res.startedAt, status: 'in_progress' } } : d))
      })
      .catch((err) => {
        setData((d) => (d?.workout ? { workout: withSet(d.workout, set.id, !next) } : d))
        toast(err.message, { type: 'error', title: "Couldn't save that set" })
      })
      .finally(() => inflight.current.delete(request))
    inflight.current.add(request)

    if (!next) return
    if (countDone(updated) === countSets(updated)) {
      finish()
      return
    }
    const exercise = updated.exercises[ei]
    if (exercise.sets.every((s) => s.completed)) {
      const nextIdx = updated.exercises.findIndex((e) => e.sets.some((s) => !s.completed))
      if (nextIdx !== -1) setActive(nextIdx)
      toast(`${exercise.name} complete!`, { title: 'Exercise done 💪' })
    }
    startRest(exercise.restSeconds)
  }

  const pauseResume = () => {
    if (rest.running) {
      setRest((r) => ({ ...r, running: false }))
    } else if (rest.remaining > 0) {
      endAt.current = Date.now() + rest.remaining * 1000
      setRest((r) => ({ ...r, running: true }))
    } else if (workout?.exercises[active ?? 0]) {
      startRest(workout.exercises[active ?? 0].restSeconds)
    }
  }

  const addTime = () => {
    if (rest.remaining <= 0) return startRest(15)
    endAt.current += 15000
    setRest((r) => ({ ...r, total: r.total + 15, remaining: r.remaining + 15 }))
  }

  const skip = () => setRest({ total: 0, remaining: 0, running: false })

  const requestFinish = () => {
    if (confirmFinish) return finish()
    setConfirmFinish(true)
    setTimeout(() => setConfirmFinish(false), 3500)
  }

  // ---------- Loading / error / empty ----------
  if (!data) {
    return (
      <Page>
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="mb-6 h-10 w-56" />
        {error && !loading ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <SkeletonCard className="flex flex-col items-center !space-y-6 py-8">
              <Skeleton className="h-60 w-60 !rounded-full" />
              <Skeleton className="h-14 w-48 !rounded-full" />
            </SkeletonCard>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i}>
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((j) => <Skeleton key={j} className="h-12 w-16" />)}
                  </div>
                </SkeletonCard>
              ))}
            </div>
          </div>
        )}
      </Page>
    )
  }

  if (!hasExercises) {
    return (
      <Page>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Live workout</p>
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Ready when you are</h1>
        <EmptyState
          icon={ListPlus}
          title="No workout yet today"
          message="Pick one from the Library! Add a few exercises and they'll show up here with sets and rest timers."
          action={
            <Link to="/library" className="btn-primary mt-2">
              <Dumbbell className="h-5 w-5" /> Open the Library
            </Link>
          }
        />
      </Page>
    )
  }

  // ---------- Live workout ----------
  const totalSets = countSets(workout)
  const doneSets = countDone(workout)
  const pct = totalSets ? doneSets / totalSets : 0
  const startedMs = workout.startedAt ? new Date(workout.startedAt).getTime() : null
  const elapsedSec = completed
    ? (workout.durationMinutes ?? 0) * 60
    : startedMs
      ? Math.max(0, (now - startedMs) / 1000)
      : 0

  const size = 260
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ringPct = rest.total ? rest.remaining / rest.total : 0
  const resting = rest.remaining > 0

  return (
    <Page>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{completed ? 'Workout complete' : 'Live workout'}</p>
          <h1 className="truncate text-3xl font-bold sm:text-4xl">{workout.name}</h1>
        </div>
        <div className="glass flex shrink-0 items-center gap-2 !rounded-2xl px-4 py-2 font-display text-lg font-semibold tabular-nums">
          {completed ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          )}
          {completed ? `${workout.durationMinutes} min` : fmt(elapsedSec)}
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted">
            {doneSets} of {totalSets} sets
          </span>
          <span className="font-semibold text-accent">{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line/10">
          <motion.div className="h-full rounded-full bg-gradient-brand shadow-glow" animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Rest timer, or the summary once finished */}
        {completed ? (
          <div className="glass relative flex flex-col items-center overflow-hidden p-8 text-center lg:sticky lg:top-10 lg:self-start">
            <div className="pointer-events-none absolute left-1/2 top-10 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-brand shadow-glow">
              <Trophy className="h-12 w-12 text-[#07090d]" />
            </div>
            <h2 className="relative mt-5 text-2xl font-bold">Done for today!</h2>
            <p className="relative mt-1 text-sm text-muted">Saved to your history. Recovery is part of the plan.</p>
            <div className="relative mt-6 grid w-full grid-cols-3 gap-2">
              <Summary icon={Timer} value={`${workout.durationMinutes}m`} label="time" color="text-cyan" />
              <Summary icon={Check} value={doneSets} label="sets" color="text-accent" />
              <Summary icon={Dumbbell} value={workout.exercises.length} label="exercises" color="text-orange-400" />
            </div>
            <Link to="/dashboard" className="btn-primary relative mt-6 w-full">
              <LayoutDashboard className="h-5 w-5" /> Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="glass relative flex flex-col items-center overflow-hidden p-6 lg:sticky lg:top-10 lg:self-start">
            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${resting ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/25 blur-3xl" />
            </div>
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-muted">{resting ? 'Rest timer' : 'Ready for next set'}</p>
            <div className="relative mt-4" style={{ width: size, height: size, maxWidth: '100%' }}>
              <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line/10" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - ringPct)}
                  style={{ transition: 'stroke-dashoffset 0.15s linear', filter: 'drop-shadow(0 0 10px rgba(0,229,255,.6))' }}
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c6ff00" />
                    <stop offset="100%" stopColor="#00e5ff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p data-testid="rest-timer" className="font-display text-6xl font-bold tabular-nums sm:text-7xl">
                    {resting ? fmt(Math.ceil(rest.remaining)) : 'GO'}
                  </p>
                  <p className="mt-1 text-sm text-muted">{resting ? (rest.running ? 'Breathe. Recover.' : 'Paused') : 'Tick a set to start rest'}</p>
                </div>
              </div>
            </div>
            <div className="relative mt-6 flex items-center gap-3">
              <CircleBtn onClick={addTime} label="Add 15 seconds">
                <Plus className="h-5 w-5" />
              </CircleBtn>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={pauseResume}
                className="grid h-16 w-16 place-items-center rounded-full bg-gradient-brand text-[#07090d] shadow-glow"
                aria-label={rest.running ? 'Pause rest' : 'Start rest'}
              >
                {rest.running ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
              </motion.button>
              <CircleBtn onClick={skip} label="Skip rest">
                <SkipForward className="h-5 w-5" />
              </CircleBtn>
            </div>
            <p className="relative mt-3 text-xs text-muted">+15s · play/pause · skip</p>
          </div>
        )}

        {/* Exercise list */}
        <div className="space-y-3">
          {workout.exercises.map((e, ei) => {
            const exDone = e.sets.every((s) => s.completed)
            const isActive = ei === active && !exDone && !completed
            return (
              <motion.div
                key={e.workoutExerciseId}
                layout
                onClick={() => !completed && setActive(ei)}
                className={`glass p-5 transition-all ${completed ? '' : 'cursor-pointer'} ${isActive ? 'ring-2 ring-accent/70 shadow-glow' : ''} ${exDone ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${exDone ? 'bg-lime text-[#07090d]' : 'bg-line/5 text-accent'}`}>
                      {exDone ? <Check className="h-5 w-5" /> : e.muscleGroup === 'Cardio' ? <Flame className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`truncate font-semibold ${exDone ? 'line-through decoration-accent/60' : ''}`}>{e.name}</h3>
                      <p className="text-xs text-muted">
                        {e.sets.length} × {e.reps} · {e.muscleGroup} · rest {e.restSeconds}s
                      </p>
                    </div>
                  </div>
                  {isActive && <span className="chip shrink-0 bg-accent/15 text-accent">Now</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {e.sets.map((set) => (
                    <motion.button
                      key={set.id}
                      whileTap={completed ? undefined : { scale: 0.88 }}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        toggleSet(ei, set)
                      }}
                      disabled={completed}
                      className={`relative flex h-12 min-w-[3.5rem] items-center justify-center gap-1 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                        set.completed ? 'border-transparent bg-gradient-brand text-[#07090d]' : 'border-line/15 hover:border-accent/60'
                      } ${completed ? 'cursor-default' : ''}`}
                      aria-pressed={set.completed}
                      aria-label={`Set ${set.setNumber} of ${e.name}`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {set.completed ? (
                          <motion.span key="c" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                            <Check className="h-5 w-5" strokeWidth={3} />
                          </motion.span>
                        ) : (
                          <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            Set {set.setNumber}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )
          })}

          {!completed && (
            <button
              onClick={requestFinish}
              disabled={finishing || doneSets === 0}
              className={`w-full ${confirmFinish ? 'btn-primary' : 'btn-ghost text-sm text-muted'} disabled:opacity-40`}
            >
              {finishing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Flag className="h-4 w-4" /> {confirmFinish ? 'Tap again to finish & save' : doneSets === 0 ? 'Tick a set to begin' : 'Finish workout early'}
                </>
              )}
            </button>
          )}
          {!completed && (
            <Link to="/library" className="btn-ghost w-full text-sm text-muted">
              <ListPlus className="h-4 w-4" /> Add more exercises
            </Link>
          )}
        </div>
      </div>

      {/* Completion modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="glass relative w-full max-w-md p-8 text-center"
              onClick={(ev) => ev.stopPropagation()}
            >
              <button onClick={() => setShowSummary(false)} className="absolute right-4 top-4 text-muted hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-brand shadow-glow"
              >
                <Trophy className="h-12 w-12 text-[#07090d]" />
              </motion.div>
              <h2 className="mt-6 text-3xl font-bold">Workout complete!</h2>
              <p className="mt-2 text-muted">You crushed {workout.name}. It&rsquo;s saved and your streak just got hotter. 🔥</p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <Summary icon={Timer} value={`${workout.durationMinutes}m`} label="time" color="text-cyan" />
                <Summary icon={Check} value={doneSets} label="sets" color="text-accent" />
                <Summary icon={Dumbbell} value={workout.exercises.length} label="exercises" color="text-orange-400" />
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn-primary flex-1">See dashboard</Link>
                <button onClick={() => setShowSummary(false)} className="btn-ghost flex-1">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  )
}

function CircleBtn({ children, onClick, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className="grid h-12 w-12 place-items-center rounded-full border border-line/15 transition hover:border-accent/60 hover:text-accent"
    >
      {children}
    </motion.button>
  )
}

function Summary({ icon: Icon, value, label, color }) {
  return (
    <div className="rounded-2xl bg-line/5 py-3">
      <Icon className={`mx-auto h-5 w-5 ${color}`} />
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
