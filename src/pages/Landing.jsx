import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Dumbbell, Flame, Timer, Trophy, Calendar, Play, Zap, Heart, LogOut } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import AnimatedCounter from '../components/AnimatedCounter'
import ProgressRing from '../components/ProgressRing'
import QuoteCard from '../components/QuoteCard'
import Footer from '../components/Footer'
import Skeleton from '../components/Skeleton'
import { useLogout } from '../components/Navigation'
import { initialsOf, useAuth } from '../context/AuthContext'
import { useApi } from '../lib/useApi'

const statLabels = [
  { key: 'members', label: 'Active members' },
  { key: 'workoutsCompleted', label: 'Workouts completed' },
  { key: 'classesThisWeek', label: 'Classes this week' },
]

const features = [
  { icon: Dumbbell, title: 'Smart plans', text: 'Workouts that adapt to your strength, schedule and recovery.', color: '#c6ff00', to: '/library' },
  { icon: Timer, title: 'Live mode', text: 'Rest timers, set tracking and a confetti finish line.', color: '#00e5ff', to: '/workout' },
  { icon: Trophy, title: 'Track PRs', text: 'Watch your lifts climb and collect trophy badges.', color: '#ffd23f', to: '/progress' },
  { icon: Calendar, title: 'Book classes', text: 'Yoga, HIIT, Spin and Boxing. Grab a spot in one tap.', color: '#ff5d73', to: '/classes' },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Landing() {
  const { status, user } = useAuth()
  const handleLogout = useLogout()
  const stats = useApi('/stats')
  const authed = status === 'authed'

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Background */}
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-lime/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-cyan/20 blur-[120px]" />

      {/* Navbar */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <Link to="/library" className="py-2.5 transition hover:text-ink">Workouts</Link>
          <Link to="/classes" className="py-2.5 transition hover:text-ink">Classes</Link>
          <Link to="/progress" className="py-2.5 transition hover:text-ink">Progress</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authed ? (
            <>
              <Link to="/dashboard" className="btn-ghost !px-3 !py-2 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-brand text-[10px] font-bold text-[#07090d]">
                  {initialsOf(user.fullName)}
                </span>
                <span className="max-w-[7rem] truncate">{user.fullName.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 text-muted transition hover:border-rose-400/50 hover:text-rose-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !px-4 !py-2.5 text-sm">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary hidden !px-4 !py-2.5 text-sm sm:inline-flex">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main>
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:pt-20">
        <div>
          <motion.div {...fadeUp(0)} className="chip mb-6 border border-accent/30 bg-accent/10 text-accent">
            <Zap className="h-3.5 w-3.5" /> New: AI-paced rest timers
          </motion.div>
          <motion.h1
            {...fadeUp(0.08)}
            className="font-display text-[3.2rem] font-bold leading-[0.95] tracking-tighter sm:text-7xl lg:text-[5.5rem]"
          >
            Train smarter.
            <br />
            <span className="text-gradient animate-shimmer">Get stronger.</span>
          </motion.h1>
          <motion.p {...fadeUp(0.16)} className="mt-6 max-w-lg text-lg text-muted">
            <span className="font-semibold text-ink">PulseFit</span> plans your workouts, tracks every rep, books your
            classes and keeps your streak alive, all from your phone.
          </motion.p>
          <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={authed ? '/dashboard' : '/signup'} className="btn-primary group text-lg">
              <Play className="h-5 w-5 fill-current" /> Start Your Workout
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/dashboard" className="btn-ghost text-lg">
              View dashboard
            </Link>
          </motion.div>

          <motion.dl {...fadeUp(0.32)} className="mt-12 grid grid-cols-3 gap-4 border-t border-line/10 pt-8">
            {statLabels.map((s) => (
              <div key={s.key}>
                <dt className="text-xs text-muted sm:text-sm">{s.label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold sm:text-4xl">
                  {stats.data ? (
                    <AnimatedCounter value={stats.data[s.key]} />
                  ) : stats.loading ? (
                    <Skeleton className="mt-1 h-8 w-20 sm:h-10" />
                  ) : (
                    <span className="text-muted" title={stats.error?.message}>
                      –
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-brand opacity-30 blur-3xl" />
          <div className="glass relative !rounded-[2.5rem] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Today</p>
                <p className="font-display text-xl font-semibold">Push Power</p>
              </div>
              <span className="chip bg-orange-500/15 text-orange-400">
                <Flame className="h-3.5 w-3.5" /> 12 days
              </span>
            </div>
            <div className="my-6 grid place-items-center">
              <ProgressRing progress={0.78} size={190} stroke={14} delay={0.6} duration={2}>
                <div>
                  <p className="font-display text-5xl font-bold">
                    <AnimatedCounter value={78} suffix="%" />
                  </p>
                  <p className="text-xs text-muted">weekly goal</p>
                </div>
              </ProgressRing>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Flame, v: '420', l: 'kcal', c: 'text-orange-400' },
                { icon: Timer, v: '48', l: 'min', c: 'text-cyan' },
                { icon: Heart, v: '142', l: 'bpm', c: 'text-pink-400' },
              ].map(({ icon: I, v, l, c }) => (
                <div key={l} className="rounded-2xl bg-line/5 py-3">
                  <I className={`mx-auto h-4 w-4 ${c}`} />
                  <p className="mt-1 font-display font-bold">{v}</p>
                  <p className="text-[10px] text-muted">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="glass absolute -left-6 top-24 hidden items-center gap-2 !rounded-2xl px-3 py-2 sm:flex"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-xs font-semibold">New PR!</p>
              <p className="text-[10px] text-muted">Deadlift 150 kg</p>
            </div>
          </motion.div>
          <motion.div
            className="glass absolute -right-4 bottom-20 hidden items-center gap-2 !rounded-2xl px-3 py-2 sm:flex"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Calendar className="h-5 w-5 text-cyan" />
            <div>
              <p className="text-xs font-semibold">HIIT booked</p>
              <p className="text-[10px] text-muted">Tomorrow · 06:30</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <Link to={f.to} className="glass group block h-full p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{ background: `${f.color}1f`, color: f.color }}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-lg font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <QuoteCard className="mt-6" />
      </section>
      </main>

      <Footer />
    </div>
  )
}
