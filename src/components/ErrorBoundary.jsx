import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('PulseFit crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-base p-6 text-ink">
        <div className="glass max-w-md p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/15">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Oops, we pulled a muscle</h1>
          <p className="mt-2 text-muted">Something went wrong on our side. Your progress is safe. Give it another rep.</p>
          <button className="btn-primary mt-6" onClick={() => window.location.assign('/dashboard')}>
            <RotateCcw className="h-4 w-4" /> Reload PulseFit
          </button>
        </div>
      </div>
    )
  }
}
