import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { useSync } from '../hooks/useSync'

const NAV_ITEMS = [
  { path: '/', icon: '◉', label: 'Dashboard' },
  { path: '/chat', icon: '💬', label: 'Chat' },
  { path: '/quiz', icon: '✦', label: 'Quiz Studio' },
  { path: '/analytics', icon: '📊', label: 'Analytics' },
  { path: '/homework', icon: '📚', label: 'Homework' },
  { path: '/reteach', icon: '🔄', label: 'Reteach' },
  { path: '/reports', icon: '📋', label: 'Reports' },
  { path: '/settings', icon: '⚙', label: 'Knowledge' },
]

export default function Sidebar() {
  const { teacher, activeSession, students, aiProvider, aiAvailable, setTeacher, setActiveSession } = useAppStore()
  const navigate = useNavigate()
  const { syncing, pending, lastSynced, error, runSync, retrySync, logs } = useSync()

  const logout = () => {
    setTeacher(null)
    setActiveSession(null)
    navigate('/login')
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.brandIcon}>◎</span>
        <div>
          <span style={styles.brandName}>EduLens</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Classroom AI</span>
        </div>
      </div>

      <SyncPanel pending={pending} syncing={syncing} lastSynced={lastSynced} error={error} onSync={runSync} onRetry={retrySync} logs={logs} />

      {activeSession && (
        <div style={styles.sessionBadge}>
          <div className="live-dot" />
          <span style={styles.sessionCode}>{activeSession.code}</span>
          <span style={styles.sessionLabel}>LIVE</span>
        </div>
      )}

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            {item.path === '/' && students.length > 0 && <span style={styles.navBadge}>{students.length}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        <div style={styles.aiStatus}>
          <span style={{ ...styles.aiDot, background: aiAvailable ? 'var(--success)' : 'var(--warning)' }} />
          <div style={styles.aiInfo}>
            <div style={styles.aiProviderName}>{aiProvider}</div>
            <div style={styles.aiProviderSub}>{aiAvailable ? 'AI Online' : 'AI Offline'}</div>
          </div>
        </div>
        <div style={styles.divider} />
        <div style={styles.teacherRow}>
          <motionAvatar>{teacher?.name?.[0]?.toUpperCase() || 'T'}</motionAvatar>
          <div style={styles.teacherInfo}>
            <div style={styles.teacherName}>{teacher?.name}</div>
            <div style={styles.teacherRole}>Teacher</div>
          </div>
          <button type="button" onClick={logout} style={styles.logoutBtn} title="Logout">⎋</button>
        </div>
      </div>
    </aside>
  )
}

function SyncPanel(props: {
  pending: number; syncing: boolean; lastSynced: string | null; error: string | null
  onSync: () => void; onRetry: () => void; logs: { id: string; status: string; record_count: number }[]
}) {
  const { pending, syncing, lastSynced, error, onSync, onRetry, logs } = props
  return (
    <div style={{
      margin: '0 10px 10px', padding: '10px 12px', borderRadius: 12, border: '1px solid',
      background: pending > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
      borderColor: pending > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.25)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12 }}>{pending > 0 ? '🟡' : lastSynced ? '🟢' : '⚪'}</span>
        <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: pending > 0 ? 'var(--warning)' : 'var(--success)' }}>
          {syncing ? 'Syncing…' : pending > 0 ? `${pending} pending` : lastSynced ? `Synced ${lastSynced}` : 'Offline-first'}
        </span>
      </div>
      {error && <p style={{ fontSize: 10, color: 'var(--danger)', marginBottom: 6 }}>{error}</p>}
      <button type="button" onClick={onSync} disabled={syncing} style={styles.syncBtn}>{syncing ? '⏳ Syncing…' : '☁ Sync Now'}</button>
      {pending > 0 && <button type="button" onClick={onRetry} disabled={syncing} style={{ ...styles.syncBtn, marginTop: 4 }}>↻ Retry</button>}
      {logs.slice(0, 2).map((log) => (
        <div key={log.id} className="sync-log-item"><span>{log.status}</span><span>{log.record_count} records</span></div>
      ))}
    </div>
  )
}

function motionAvatar({ children }: { children: React.ReactNode }) {
  return <div style={styles.teacherAvatar}>{children}</div>
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-width)', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '0 0 16px', zIndex: 50, overflowY: 'auto' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 18px', borderBottom: '1px solid var(--border)', marginBottom: 8 },
  brandIcon: { fontSize: 22, color: 'var(--primary)' },
  brandName: { fontSize: 17, fontWeight: 800, display: 'block', background: 'linear-gradient(135deg, #6C7BD6, #E8836B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  syncBtn: { width: '100%', padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  sessionBadge: { display: 'flex', alignItems: 'center', gap: 8, margin: '4px 12px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '6px 10px' },
  sessionCode: { fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--success)', flex: 1 },
  sessionLabel: { fontSize: 10, fontWeight: 700, color: 'var(--success)', letterSpacing: 1 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 },
  navItemActive: { background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600 },
  navIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  navLabel: { flex: 1 },
  navBadge: { background: 'var(--primary)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  bottom: { padding: '0 12px' },
  aiStatus: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 8 },
  aiDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  aiInfo: { flex: 1, minWidth: 0 },
  aiProviderName: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  aiProviderSub: { fontSize: 11, color: 'var(--text-muted)' },
  divider: { height: 1, background: 'var(--border)', margin: '8px 0' },
  teacherRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  teacherAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  teacherInfo: { flex: 1, minWidth: 0 },
  teacherName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  teacherRole: { fontSize: 11, color: 'var(--text-muted)' },
  logoutBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 },
}
