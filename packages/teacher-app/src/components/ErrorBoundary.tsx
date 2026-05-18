import React from 'react'
import { Icon } from './Icon'

interface State { hasError: boolean; error?: string }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state empty-state-modern" style={{ margin: 40 }}>
          <span className="empty-icon-bubble icon-bubble-danger">
            <Icon name="warning" size={32} />
          </span>
          <h3>Something went wrong</h3>
          <p>{this.state.error}</p>
          <button className="btn btn-primary" onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
