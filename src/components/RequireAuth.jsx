import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Page from './Page'
import Skeleton, { SkeletonCard } from './Skeleton'
import ErrorState from './ErrorState'

export default function RequireAuth({ children }) {
  const { status, error, refresh } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <Page>
        <Skeleton className="mb-6 h-10 w-56" />
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard className="h-64 lg:col-span-2" />
          <SkeletonCard className="h-64" />
        </div>
      </Page>
    )
  }
  if (status === 'error') {
    return (
      <Page>
        <ErrorState error={error} onRetry={refresh} />
      </Page>
    )
  }
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
