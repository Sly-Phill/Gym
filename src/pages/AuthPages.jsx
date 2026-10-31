import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User, Dumbbell, Timer } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-lime/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-cyan/20 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:px-10">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-md items-center gap-12 px-4 pb-16 pt-10 sm:pt-16 lg:max-w-5xl lg:grid-cols-2 lg:px-10">
        <motion.img
          src="/images/auth-athlete.webp"
          alt=""
          width="800"
          height="1000"
          decoding="async"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hidden aspect-[4/5] w-full max-w-sm justify-self-center rounded-[2.25rem] border border-line/10 object-cover shadow-glow lg:block"
        />
        <div className="flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-brand opacity-20 blur-3xl" />
          <div className="glass relative !rounded-[2rem] p-6 sm:p-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-1 text-muted">{subtitle}</p>
            {children}
          </div>
        </motion.div>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </main>
    </div>
  )
}

function Field({ icon: Icon, label, type = 'text', value, onChange, autoComplete, right, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border border-line/10 bg-line/5 px-4 py-3 transition focus-within:border-accent/60 focus-within:shadow-glow">
        <Icon className="h-5 w-5 shrink-0 text-muted" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted/70"
          {...rest}
        />
        {right}
      </span>
    </label>
  )
}

function PasswordField({ value, onChange, autoComplete, isNew }) {
  const [show, setShow] = useState(false)
  return (
    <Field
      icon={Lock}
      label="Password"
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      placeholder={isNew ? '8+ characters, a letter and a number' : 'Your password'}
      required
      minLength={isNew ? 8 : undefined}
      right={
        <button type="button" onClick={() => setShow((s) => !s)} className="text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      }
    />
  )
}

function FormError({ message }) {
  if (!message) return null
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400" role="alert">
      {message}
    </motion.p>
  )
}

function useAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => navigate(location.state?.from || '/dashboard', { replace: true })
}

export function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const done = useAfterAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login(email, password)
      toast(`Good to see you, ${user.fullName.split(' ')[0]}!`, { title: 'Welcome back 👋' })
      done()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New to PulseFit?{' '}
          <Link to="/signup" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" required />
        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
        <FormError message={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Log in <ArrowRight className="h-5 w-5" /></>}
        </button>
      </form>
    </AuthShell>
  )
}

const WORKOUT_GOALS = [2, 3, 4, 5, 6]

export function Signup() {
  const { signup } = useAuth()
  const toast = useToast()
  const done = useAfterAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await signup(form)
      toast("Your account is ready. Let's build today's workout!", { title: `Welcome, ${user.fullName.split(' ')[0]} 🎉` })
      done()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Join PulseFit"
      subtitle="Set your goals. We'll keep you on track."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field icon={User} label="Full name" value={form.fullName} onChange={set('fullName')} autoComplete="name" placeholder="Alex Rivera" required maxLength={80} />
        <Field icon={Mail} label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" required />
        <PasswordField value={form.password} onChange={set('password')} autoComplete="new-password" isNew />

        <fieldset>
          <legend className="mb-1.5 flex items-center gap-2 text-sm font-medium">
            <Dumbbell className="h-4 w-4 text-accent" /> Workouts per week
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {WORKOUT_GOALS.map((n) => {
              const active = form.weeklyGoalWorkouts === n
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('weeklyGoalWorkouts')(n)}
                  className={`relative rounded-xl py-2.5 font-display text-lg font-bold transition-colors ${active ? 'text-[#07090d]' : 'border border-line/10 text-muted hover:text-ink'}`}
                  aria-pressed={active}
                >
                  {active && <motion.span layoutId="goal-pill" className="absolute inset-0 rounded-xl bg-gradient-brand shadow-glow" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                  <span className="relative">{n}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan" /> Active minutes per week
            </span>
            <span className="font-display text-lg font-bold text-accent">{form.weeklyGoalMinutes} min</span>
          </span>
          <input
            type="range"
            min={30}
            max={600}
            step={15}
            value={form.weeklyGoalMinutes}
            onChange={(e) => set('weeklyGoalMinutes')(Number(e.target.value))}
            className="w-full accent-[#c6ff00]"
          />
        </label>

        <FormError message={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create account <ArrowRight className="h-5 w-5" /></>}
        </button>
      </form>
    </AuthShell>
  )
}
