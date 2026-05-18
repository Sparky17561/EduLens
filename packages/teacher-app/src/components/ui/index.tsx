import React, { CSSProperties } from 'react'
import { Icon, IconName } from '../Icon'

export function PageHeader({
  title,
  subtitle,
  kicker,
  actions
}: {
  title: string
  subtitle?: string
  kicker?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {kicker && <span className="kicker">{kicker}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  )
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'var(--text-primary)',
  trend,
  tone = 'muted',
}: {
  icon?: IconName
  label: string
  value: string | number
  sub?: string
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  tone?: 'muted' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="stat-card stat-card-modern">
      <div className="stat-card-top">
        {icon && (
          <span className={`icon-bubble icon-bubble-${tone}`} style={{ width: 30, height: 30 }}>
            <Icon name={icon} size={16} />
          </span>
        )}
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
  icon = 'document',
  title,
  description,
  action,
  tone = 'muted',
}: {
  icon?: IconName
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'muted' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="empty-state empty-state-modern">
      <span className={`empty-icon-bubble icon-bubble-${tone}`}>
        <Icon name={icon} size={32} />
      </span>
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

// Re-export so pages can import { Icon } from this file too if they want
export { Icon }
export type { IconName }

// Backwards-compat alias
export type CSSProps = CSSProperties
