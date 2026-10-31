import { PulseMark } from './Logo'

export default function Footer() {
  return (
    <footer className="mx-auto mb-28 mt-4 flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-line/10 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6 lg:mb-0 lg:px-10">
      <div className="flex items-center gap-2">
        <PulseMark className="h-6 w-6" />
        <span className="font-display font-bold italic text-ink">PulseFit</span>
        <span>· Train smarter. Get stronger.</span>
      </div>
      <p>&copy; {new Date().getFullYear()} PulseFit. All rights reserved.</p>
    </footer>
  )
}
