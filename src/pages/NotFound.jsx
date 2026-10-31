import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Page from '../components/Page'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <Page className="grid min-h-[70dvh] place-items-center">
      <EmptyState
        icon={Compass}
        title="This page skipped leg day"
        message="We couldn't find what you were looking for. Let's get you back on track."
        action={
          <Link to="/dashboard" className="btn-primary mt-2">
            Back to dashboard
          </Link>
        }
      />
    </Page>
  )
}
