import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Dumbbell, Flame, Timer, Plus, Check, SearchX, Loader2, Play } from 'lucide-react'
import Page, { PageHeader } from '../components/Page'
import EmptyState from '../components/EmptyState'
import SlidingPill from '../components/SlidingPill'
import ErrorState from '../components/ErrorState'
import Skeleton, { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { useInk } from '../context/ThemeContext'
import { useApi } from '../lib/useApi'
import { api, localDate } from '../lib/api'

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

const difficultyStyle = {
  Beginner: { color: '#00e5ff', bars: 1 },
  Intermediate: { color: '#c6ff00', bars: 2 },
  Advanced: { color: '#ff5d73', bars: 3 },
}

const groupColor = {
  Chest: '#ff5d73',
  Back: '#00e5ff',
  Legs: '#c6ff00',
  Arms: '#ffd23f',
  Core: '#a78bfa',
  Cardio: '#ff7a1a',
}

export default function Library() {
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(() => new Set())
  const filtersRef = useRef(null)
  const ink = useInk()
  const toast = useToast()
  const date = localDate()
  const catalog = useApi('/exercises')
  const today = useApi(`/workouts?date=${date}`)

  const workout = today.data?.workout
  const locked = workout?.status === 'completed'
  // exerciseId -> workoutExerciseId for everything already in today's workout
  const added = useMemo(
    () => new Map((workout?.exercises ?? []).map((e) => [e.exerciseId, e.workoutExerciseId])),
    [workout],
  )

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (catalog.data?.exercises ?? []).filter(
      (e) =>
        (group === 'All' || e.muscleGroup === group) &&
        (!q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    )
  }, [catalog.data, group, query])

  const markPending = (id, on) =>
    setPending((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })

  const toggleAdd = async (e) => {
    if (pending.has(e.id)) return
    if (locked) {
      toast("You've already finished today's workout. Come back tomorrow for more!", { type: 'info' })
      return
    }
    const workoutExerciseId = added.get(e.id)
    const previous = today.data
    markPending(e.id, true)

    // Optimistic update so the button flips instantly
    today.setData((d) => {
      const w = d?.workout ?? { exercises: [], status: 'planned' }
      const exercises = workoutExerciseId
        ? w.exercises.filter((x) => x.exerciseId !== e.id)
        : [...w.exercises, { exerciseId: e.id, workoutExerciseId: -e.id, name: e.name, sets: [] }]
      return { workout: { ...w, exercises } }
    })

    try {
      const res = workoutExerciseId
        ? await api(`/workouts?workoutExerciseId=${workoutExerciseId}&date=${date}`, { method: 'DELETE' })
        : await api('/workouts', { method: 'POST', body: { action: 'add', exerciseId: e.id, date } })
      today.setData({ workout: res.workout })
      if (workoutExerciseId) toast(`${e.name} removed from today's workout.`, { type: 'info' })
      else toast(`${e.name} added to today's workout.`, { title: 'Nice pick! 💪' })
    } catch (err) {
      today.setData(previous)
      toast(err.message, { type: 'error', title: "Couldn't update your workout" })
    } finally {
      markPending(e.id, false)
    }
  }

  const count = workout?.exercises.length ?? 0

  return (
    <Page>
      <PageHeader
        eyebrow="Workout library"
        title="Find your next move"
        subtitle={
          catalog.data
            ? `${catalog.data.exercises.length} coach-built exercises across every muscle group.`
            : 'Coach-built exercises across every muscle group.'
        }
        action={
          count > 0 && (
            <Link to="/workout" className={`self-start sm:self-auto ${locked ? 'btn-ghost' : 'btn-primary'}`}>
              <Play className="h-4 w-4 fill-current" />
              {locked ? 'Done for today' : `Start workout · ${count}`}
            </Link>
          )
        }
      />

      <div className="sticky top-[3.75rem] z-20 -mx-4 mb-6 space-y-3 bg-base/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:rounded-2xl lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <label className="glass flex items-center gap-3 !rounded-2xl px-4 py-3">
          <Search className="h-5 w-5 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises…"
            aria-label="Search exercises"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
        <div ref={filtersRef} className="no-scrollbar relative -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by muscle group">
          <SlidingPill containerRef={filtersRef} activeKey={group} className="rounded-full" />
          {muscleGroups.map((g) => {
            const active = g === group
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                data-pill-active={active}
                aria-pressed={active}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? 'text-[#07090d]' : 'border border-line/10 text-muted hover:text-ink'
                }`}
              >
                <span className="relative">{g}</span>
              </button>
            )
          })}
        </div>
      </div>

      {catalog.error ? (
        <ErrorState error={catalog.error} onRetry={catalog.reload} />
      ) : !catalog.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i}>
              <div className="flex justify-between">
                <Skeleton className="h-12 w-12 !rounded-2xl" />
                <Skeleton className="h-6 w-24 !rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No exercises found"
          message={query ? `We couldn't find anything matching "${query}". Try another name or clear the filter.` : 'No exercises in this group yet.'}
          action={
            <button className="btn-ghost mt-2" onClick={() => { setQuery(''); setGroup('All') }}>
              Clear filters
            </button>
          }
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Default ("sync") mode: "popLayout" left the page stuck mid-exit after filtering,
              so navigating away from the Library showed a blank page. */}
          <AnimatePresence initial={false}>
            {list.map((e, i) => {
              const d = difficultyStyle[e.difficulty]
              const isAdded = added.has(e.id)
              const busy = pending.has(e.id)
              const color = groupColor[e.muscleGroup]
              return (
                <motion.article
                  layout
                  key={e.id}
                  data-muscle-group={e.muscleGroup}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                  whileHover={{ y: -5 }}
                  className={`glass group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-glow ${isAdded ? 'ring-2 ring-accent/50' : ''}`}
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: color }} />
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${color}1f`, color }}>
                        {e.muscleGroup === 'Cardio' ? <Flame className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
                      </div>
                      <span className="chip" style={{ background: `${d.color}1a`, color: ink(d.color) }}>
                        <span className="flex items-end gap-0.5">
                          {[1, 2, 3].map((b) => (
                            <span key={b} className="w-1 rounded-sm" style={{ height: 4 + b * 3, background: b <= d.bars ? d.color : 'currentColor', opacity: b <= d.bars ? 1 : 0.25 }} />
                          ))}
                        </span>
                        {e.difficulty}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-tight">{e.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ink(color) }}>
                      {e.muscleGroup}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{e.description}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <Stat label="Sets" value={e.sets} />
                      <Stat label="Reps" value={e.reps} />
                      <Stat label="Rest" value={`${e.restSeconds}s`} />
                    </div>
                    <div className="mt-auto pt-4">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleAdd(e)}
                        disabled={busy}
                        aria-pressed={isAdded}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          isAdded
                            ? 'bg-lime text-[#07090d] hover:opacity-90'
                            : 'border border-line/10 hover:border-accent/50 hover:text-accent'
                        } ${locked && !isAdded ? 'opacity-50' : ''}`}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {isAdded ? "In today's workout" : "Add to today's workout"}
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
      {today.error && !catalog.error && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <Timer className="h-4 w-4" /> Couldn&rsquo;t load today&rsquo;s workout: {today.error.message}
        </p>
      )}
    </Page>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-line/5 px-2 py-2">
      <p className="font-display text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}
