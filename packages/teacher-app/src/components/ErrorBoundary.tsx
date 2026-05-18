import React from 'react'

interface State { hasError: boolean; error?: string }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ margin: 40 }}>
          <div className="empty-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>{this.state.error}</p>
          <button className="btn btn-primary" onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
