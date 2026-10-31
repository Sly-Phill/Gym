import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Dumbbell, Timer, TrendingUp, Calendar, User, LogOut, LogIn } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { initialsOf, useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function useLogout() {
  const { logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  return async () => {
    await logout()
    toast('You have been logged out. See you next session!', { type: 'info' })
    navigate('/')
  }
}

function LogoutButton({ className = '' }) {
  const handleLogout = useLogout()
  return (
    <button
      onClick={handleLogout}
      aria-label="Log out"
      title="Log out"
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line/10 text-muted transition hover:border-rose-400/50 hover:text-rose-400 ${className}`}
    >
      <LogOut className="h-5 w-5" />
    </button>
  )
}

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/library', label: 'Workout Library', short: 'Library', icon: Dumbbell },
  { to: '/workout', label: 'Live Workout', short: 'Train', icon: Timer, featured: true },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: TrendingUp },
  { to: '/classes', label: 'Class Booking', short: 'Classes', icon: Calendar },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: User },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line/10 bg-base/70 px-4 py-6 backdrop-blur-xl lg:flex">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="relative">
            {({ isActive }) => (
              <span
                className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-[#07090d]' : 'text-muted hover:bg-line/5 hover:text-ink'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-brand shadow-glow"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <SidebarUser />
    </aside>
  )
}

function SidebarUser() {
  const { status, user } = useAuth()
  if (status !== 'authed') {
    return (
      <div className="glass flex items-center gap-2 !rounded-2xl p-3">
        <Link to="/login" className="btn-primary flex-1 !py-2.5 text-sm">
          <LogIn className="h-4 w-4" /> Log in
        </Link>
        <ThemeToggle />
      </div>
    )
  }
  return (
    <div className="glass !rounded-2xl p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand font-display font-bold text-[#07090d]">
          {initialsOf(user.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.fullName}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ThemeToggle />
        <LogoutButtonWide />
      </div>
    </div>
  )
}

function LogoutButtonWide() {
  const handleLogout = useLogout()
  return (
    <button
      onClick={handleLogout}
      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line/10 text-sm font-medium text-muted transition hover:border-rose-400/50 hover:text-rose-400"
    >
      <LogOut className="h-4 w-4" /> Log out
    </button>
  )
}

export function MobileTopBar() {
  const { status, user } = useAuth()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line/10 bg-base/70 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
      <Logo />
      <div className="flex min-w-0 items-center gap-2">
        {status === 'authed' ? (
          <>
            {/* The bottom bar has no room for Profile, so the name chip links to it on phones and tablets. */}
            <Link to="/profile" className="chip min-h-10 min-w-0 bg-line/5 text-ink transition hover:bg-line/10">
              <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-brand text-[9px] font-bold text-[#07090d]">
                {initialsOf(user.fullName)}
              </span>
              <span className="truncate">{user.fullName.split(' ')[0]}</span>
              <span className="sr-only">, your profile</span>
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link to="/login" className="btn-ghost !px-3 !py-2 text-sm">
              <LogIn className="h-4 w-4" /> Log in
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export function BottomNav() {
  const items = navItems.filter((i) => i.to !== '/profile')
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="glass mx-auto flex max-w-md items-center justify-around !rounded-[1.75rem] px-2 py-2">
        {items.map(({ to, short, icon: Icon, featured }) => (
          <NavLink key={to} to={to} className="relative flex min-h-11 flex-1 flex-col justify-center">
            {({ isActive }) =>
              featured ? (
                <span className="flex flex-col items-center">
                  <span
                    className={`-mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-[#07090d] shadow-glow transition-transform ${
                      isActive ? 'scale-105' : ''
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className={`mt-1 text-[10px] font-semibold ${isActive ? 'text-accent' : 'text-muted'}`}>{short}</span>
                </span>
              ) : (
                <span className="relative flex flex-col items-center gap-1 py-1.5">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-active"
                      className="absolute -top-1 h-1 w-8 rounded-full bg-gradient-brand shadow-glow"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-accent' : 'text-muted'}`} />
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-ink' : 'text-muted'}`}>{short}</span>
                </span>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
