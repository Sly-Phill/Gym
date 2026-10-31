import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Suspense, useEffect } from 'react'
import { Sidebar, MobileTopBar, BottomNav } from './Navigation'
import Footer from './Footer'
import Page from './Page'
import Skeleton, { SkeletonCard } from './Skeleton'

// Shown for a moment while a screen's code downloads.
function PageFallback() {
  return (
    <Page>
      <Skeleton className="mb-2 h-4 w-28" />
      <Skeleton className="mb-6 h-10 w-56" />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="h-64 lg:col-span-2" />
        <SkeletonCard className="h-64" />
      </div>
    </Page>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const outlet = useOutlet()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="relative min-h-dvh">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-lime/10 blur-[120px] lg:left-40" />
      <div className="pointer-events-none fixed -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-cyan/10 blur-[120px]" />

      <Sidebar />
      <div className="relative lg:pl-64">
        <MobileTopBar />
        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Suspense fallback={<PageFallback />}>{outlet}</Suspense>
          </div>
        </AnimatePresence>
        <Footer />
      </div>
      <BottomNav />
    </div>
  )
}
