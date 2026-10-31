export default function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />
}

export function SkeletonCard({ className = '', children }) {
  return (
    <div className={`glass space-y-3 p-5 ${className}`} role="status" aria-label="Loading">
      {children}
    </div>
  )
}
