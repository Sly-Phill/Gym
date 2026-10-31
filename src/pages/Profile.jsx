import { motion } from 'framer-motion'
import { Flame, Dumbbell, Sunrise, Trophy, Calendar, Timer, Crown, Lock, Settings, Target, MapPin, Ruler, Weight } from 'lucide-react'
import Page from '../components/Page'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import ProgressRing from '../components/ProgressRing'
import ThemeToggle from '../components/ThemeToggle'
import { achievements, profileStats, user as demoUser } from '../data/mock'
import { useToast } from '../context/ToastContext'
import { initialsOf, useAuth } from '../context/AuthContext'

const icons = { Flame, Dumbbell, Sunrise, Trophy, Calendar, Timer }

export default function Profile() {
  const toast = useToast()
  const auth = useAuth()
  // Real account details when logged in; level, stats and badges are still demo data for now.
  const user =
    auth.status === 'authed'
      ? {
          ...demoUser,
          name: auth.user.fullName,
          initials: initialsOf(auth.user.fullName),
          handle: auth.user.email,
          memberSince: new Date(auth.user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
          goal: `${auth.user.weeklyGoalWorkouts} workouts · ${auth.user.weeklyGoalMinutes} min / week`,
        }
      : demoUser
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <Page>
      {/* Header card */}
      <GlassCard hover={false} className="!p-0">
        <div className="relative h-32 overflow-hidden sm:h-40">
          <div className="absolute inset-0 bg-gradient-brand opacity-80" />
          <div className="grid-bg absolute inset-0 opacity-60" />
          <div className="absolute -bottom-10 right-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
          <button
            onClick={() => toast('Settings are coming soon. Hang tight!', { type: 'info' })}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-black/20 text-white backdrop-blur transition hover:bg-black/30"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="relative"
              >
                <ProgressRing progress={user.xp / user.xpNext} size={112} stroke={6} color="#c6ff00" trackClass="stroke-base">
                  <div className="grid h-[92px] w-[92px] place-items-center rounded-full border-4 border-base bg-gradient-to-br from-[#1b2230] to-[#0b0f15] font-display text-3xl font-bold text-white">
                    {user.initials}
                  </div>
                </ProgressRing>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-lime px-2 py-0.5 font-display text-xs font-bold text-[#07090d]">
                  LV {user.level}
                </span>
              </motion.div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
                <p className="text-sm text-muted">
                  {user.handle} · since {user.memberSince}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-gradient-to-r from-yellow-300 to-amber-500 !px-4 !py-2 text-sm text-[#07090d] shadow-[0_0_30px_-6px_rgba(255,200,0,.7)]">
                <Crown className="h-4 w-4" /> {user.membership} Member
              </span>
              <ThemeToggle />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>Level {user.level}</span>
              <span>
                {user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line/10">
              <motion.div className="h-full rounded-full bg-gradient-brand shadow-glow" initial={{ width: 0 }} animate={{ width: `${(user.xp / user.xpNext) * 100}%` }} transition={{ duration: 1.4, delay: 0.3 }} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="chip bg-line/5 text-ink"><Target className="h-3.5 w-3.5 text-accent" /> {user.goal}</span>
            <span className="chip bg-line/5 text-ink"><Weight className="h-3.5 w-3.5 text-cyan" /> {user.weight}</span>
            <span className="chip bg-line/5 text-ink"><Ruler className="h-3.5 w-3.5 text-pink-400" /> {user.height}</span>
            <span className="chip bg-line/5 text-ink"><MapPin className="h-3.5 w-3.5 text-orange-400" /> {user.homeGym}</span>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-6 lg:gap-6">
        {profileStats.map((s, i) => (
          <GlassCard key={s.label} delay={0.1 + i * 0.05} className="!p-4 text-center sm:!p-5">
            <p className="font-display text-3xl font-bold sm:text-4xl">
              <AnimatedCounter value={s.value} />
            </p>
            <p className="text-xs text-muted sm:text-sm">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Achievements */}
      <div className="mb-4 mt-10 flex items-end justify-between">
        <h2 className="text-2xl font-bold">Achievements</h2>
        <span className="text-sm text-muted">
          {unlocked}/{achievements.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-6">
        {achievements.map((a, i) => {
          const Icon = icons[a.icon]
          return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 220 }}
              whileHover={{ y: -6 }}
              onClick={() =>
                a.unlocked
                  ? toast(a.desc, { title: `${a.name} unlocked 🏅` })
                  : toast(`${Math.round(a.progress * 100)}% there. ${a.desc} to unlock.`, { type: 'info', title: a.name })
              }
              className="glass group relative flex flex-col items-center overflow-hidden p-5 text-center"
            >
              {a.unlocked && <div className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30 blur-2xl transition-opacity group-hover:opacity-60" style={{ background: a.color }} />}
              <div className="relative">
                {a.unlocked ? (
                  <div
                    className="grid h-20 w-20 place-items-center rounded-full"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${a.color}, ${a.color}55)`, boxShadow: `0 0 34px -6px ${a.color}` }}
                  >
                    <Icon className="h-9 w-9 text-[#07090d]" />
                  </div>
                ) : (
                  <ProgressRing progress={a.progress} size={80} stroke={5} color={a.color}>
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-line/5">
                      <Lock className="h-6 w-6 text-muted" />
                    </div>
                  </ProgressRing>
                )}
              </div>
              <p className="relative mt-3 font-display font-semibold">{a.name}</p>
              <p className="relative text-xs text-muted">{a.unlocked ? a.desc : `${Math.round(a.progress * 100)}% complete`}</p>
            </motion.button>
          )
        })}
      </div>
    </Page>
  )
}
