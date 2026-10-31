import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, MapPin, User, Users, Check, CalendarX, Loader2 } from 'lucide-react'
import Page, { PageHeader } from '../components/Page'
import EmptyState from '../components/EmptyState'
import SlidingPill from '../components/SlidingPill'
import { classTypes, schedule } from '../data/mock'
import { useToast } from '../context/ToastContext'
import { useInk } from '../context/ThemeContext'

const types = ['All', ...Object.keys(classTypes)]

export default function Classes() {
  const toast = useToast()
  const todayIdx = (new Date().getDay() + 6) % 7
  const [dayIdx, setDayIdx] = useState(todayIdx)
  const [type, setType] = useState('All')
  const [booked, setBooked] = useState(() => new Set())
  const [spots, setSpots] = useState(() =>
    Object.fromEntries(schedule.flatMap((d) => d.classes.map((c) => [c.id, c.spots]))),
  )
  const [pending, setPending] = useState(null)
  const daysRef = useRef(null)
  const ink = useInk()

  const day = schedule[dayIdx]
  const list = day.classes.filter((c) => type === 'All' || c.type === type)

  const book = (c) => {
    if (pending) return
    const isBooked = booked.has(c.id)
    if (!isBooked && spots[c.id] === 0) {
      toast(`${c.name} is full. We'll let you know if a spot opens up.`, { type: 'error', title: 'Class is full' })
      return
    }
    setPending(c.id)
    // Simulate a network round-trip so the button can show a loading state
    setTimeout(() => {
      const next = new Set(booked)
      if (isBooked) {
        next.delete(c.id)
        setSpots((s) => ({ ...s, [c.id]: s[c.id] + 1 }))
        toast(`Your spot in ${c.name} has been released.`, { type: 'info', title: 'Booking cancelled' })
      } else {
        next.add(c.id)
        setSpots((s) => ({ ...s, [c.id]: s[c.id] - 1 }))
        toast(`${day.day} at ${c.time} with ${c.coach}. See you there!`, { title: `You're in: ${c.name} 🎉` })
      }
      setBooked(next)
      setPending(null)
    }, 650)
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Class booking"
        title="Find your class"
        subtitle="Yoga, HIIT, Spin and Boxing, led by our best coaches."
        action={
          booked.size > 0 && (
            <span className="chip self-start bg-accent/15 text-accent sm:self-auto">
              <Check className="h-3.5 w-3.5" /> {booked.size} booked this week
            </span>
          )
        }
      />

      {/* Day picker */}
      <div
        ref={daysRef}
        className="no-scrollbar relative -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:px-0"
        role="group"
        aria-label="Pick a day"
      >
        <SlidingPill containerRef={daysRef} activeKey={dayIdx} className="rounded-2xl" />
        {schedule.map((d, i) => {
          const active = i === dayIdx
          return (
            <button
              key={d.day}
              onClick={() => setDayIdx(i)}
              data-pill-active={active}
              aria-pressed={active}
              className={`relative flex min-w-[4rem] shrink-0 flex-col items-center rounded-2xl px-3 py-3 transition-colors ${
                active ? 'text-[#07090d]' : 'glass !rounded-2xl text-muted hover:text-ink'
              }`}
            >
              <span className="relative text-xs font-semibold uppercase">{d.day}</span>
              <span className="relative font-display text-2xl font-bold">{d.date}</span>
              <span className={`relative mt-1 h-1.5 w-1.5 rounded-full ${d.classes.length ? (active ? 'bg-[#07090d]' : 'bg-accent') : 'bg-transparent'}`} />
              {i === todayIdx && <span className="relative text-[9px] font-bold uppercase tracking-wider">Today</span>}
            </button>
          )
        })}
      </div>

      {/* Type filter */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        {types.map((t) => {
          const active = t === type
          const color = classTypes[t]?.color
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`chip shrink-0 border !px-4 !py-2 !text-sm transition ${active ? 'border-transparent' : 'border-line/10 text-muted hover:text-ink'}`}
              style={active ? { background: color ? `${color}22` : 'rgb(var(--accent) / 0.15)', color: color ? ink(color) : 'rgb(var(--accent))' } : undefined}
            >
              {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
              {t}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${dayIdx}-${type}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          {list.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title={day.classes.length ? `No ${type} classes on ${day.day}` : 'Rest day, no classes'}
              message={day.classes.length ? 'Try another class type or pick a different day.' : 'The studio is resting on Sunday, and so should you. Come back Monday!'}
              action={
                type !== 'All' && (
                  <button className="btn-ghost mt-2" onClick={() => setType('All')}>
                    Show all classes
                  </button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((c, i) => {
                const color = classTypes[c.type].color
                const left = spots[c.id]
                const isBooked = booked.has(c.id)
                const full = left === 0 && !isBooked
                const fill = 1 - left / c.capacity
                return (
                  <motion.article
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    className={`glass relative overflow-hidden p-5 ${isBooked ? 'ring-2 ring-accent/60' : ''}`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: color, boxShadow: `0 0 20px ${color}` }} />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={classTypes[c.type].image}
                          alt=""
                          width="240"
                          height="240"
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 shrink-0 rounded-2xl border border-line/10 object-cover"
                          style={{ boxShadow: `0 0 24px -8px ${color}` }}
                        />
                        <div className="min-w-0">
                          <span className="chip" style={{ background: `${color}22`, color: ink(color) }}>
                            {c.type}
                          </span>
                          <h3 className="mt-2 text-xl font-bold">{c.name}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold">{c.time}</p>
                        <p className="text-xs text-muted">{c.duration} min</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pl-2 text-sm text-muted">
                      <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {c.coach}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {c.room}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {c.duration}m</span>
                    </div>
                    <div className="mt-4 pl-2">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted"><Users className="h-3.5 w-3.5" /> {c.capacity - left}/{c.capacity}</span>
                        <span className={`font-semibold ${left === 0 ? 'text-rose-400' : left <= 3 ? 'text-orange-400' : 'text-accent'}`}>
                          {left === 0 ? 'Full' : `${left} spot${left === 1 ? '' : 's'} left`}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line/10">
                        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }} transition={{ duration: 0.9 }} />
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => book(c)}
                      disabled={pending === c.id}
                      className={`mt-5 w-full ${isBooked ? 'btn-ghost !border-accent/50 text-accent' : full ? 'btn-ghost text-muted' : 'btn-primary'}`}
                    >
                      {pending === c.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isBooked ? (
                        <><Check className="h-4 w-4" /> Booked · tap to cancel</>
                      ) : full ? (
                        'Join waitlist'
                      ) : (
                        'Book spot'
                      )}
                    </motion.button>
                  </motion.article>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}
