import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center p-6">
          <p className="text-lg font-medium">Algo salió mal</p>
          <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
          <button
            className="text-sm underline text-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
