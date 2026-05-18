import React, { CSSProperties } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  )
}

function motionDiv({ children, className, style }: { children: React.ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={className} style={style}>{children}</div>
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'var(--text-primary)',
  trend
}: {
  icon?: string
  label: string
  value: string | number
  sub?: string
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="stat-card stat-card-modern">
      <div className="stat-card-top">
        {icon && <span className="stat-icon">{icon}</span>}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {trend && (
        <span className={`stat-trend stat-trend-${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}
        </span>
      )}
    </div>
  )
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action
}: {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state empty-state-modern">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-block">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export const CHAT_COMMANDS = [
  '/ask', '/generate', '/hint', '/cite', '/summarize', '/diagnose',
  '/rephrase', '/explain', '/flashcards', '/quizme', '/teachme', '/examples',
  '/define', '/compare', '/practice'
]

export function CommandChips() {
  return (
    <div className="cmd-chips">
      {CHAT_COMMANDS.map(cmd => (
        <span key={cmd} className="cmd-chip">{cmd}</span>
      ))}
    </div>
  )
}
