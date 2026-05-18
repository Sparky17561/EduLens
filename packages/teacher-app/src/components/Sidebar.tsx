import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { syncApi } from '../api/client'

const NAV_ITEMS = [
  { path: '/',          icon: '⊞',  label: 'Dashboard'  },
  { path: '/chat',      icon: '💬',  label: 'Chat'       },
  { path: '/quiz',      icon: '🎯',  label: 'Quiz Studio' },
  { path: '/analytics', icon: '📊',  label: 'Analytics'  },
  { path: '/homework',  icon: '📚',  label: 'Homework'   },
  { path: '/reports',   icon: '📋',  label: 'Reports'    },
  { path: '/settings',  icon: '⚙️',  label: 'Knowledge'  },
]

export default function Sidebar() {
  const { teacher, activeSession, students, aiProvider, aiAvailable, setTeacher, setActiveSession } = useAppStore()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  const handleLogout = () => {
    setTeacher(null)
    setActiveSession(null)
    navigate('/login')
  }

  const handleSync = async () => {
    if (!teacher || syncing) return
    setSyncing(true)
    try {
      await syncApi.sync(teacher.id)
      setLastSynced(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Sync failed', e)
    }
    setSyncing(false)
  }

  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>📡</span>
        <span style={styles.brandName}>EduLens</span>
      </div>

      {/* ⚠️ Offline Sync Alert */}
      <div style={{
        ...styles.syncAlert,
        background: lastSynced ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
        borderColor: lastSynced ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 12 }}>{lastSynced ? '🟢' : '🔴'}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: lastSynced ? 'var(--success)' : 'var(--warning)', flex: 1 }}>
            {lastSynced ? `Synced at ${lastSynced}` : 'Local-Only Data'}
          </span>
        </div>
        {!lastSynced && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
            All data stored on this device only. Sync to back it up.
          </p>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          style={styles.syncBtn}
        >
          {syncing ? '⏳ Syncing...' : '☁️ Sync Now'}
        </button>
      </div>

      {/* Session status */}
      {activeSession && (
        <div style={styles.sessionBadge}>
          <div className="live-dot" />
          <span style={styles.sessionCode}>{activeSession.code}</span>
          <span style={styles.sessionLabel}>LIVE</span>
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {})
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            {item.path === '/' && students.length > 0 && (
              <span style={styles.navBadge}>{students.length}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={styles.bottom}>
        {/* AI Status */}
        <div style={styles.aiStatus}>
          <span style={{ ...styles.aiDot, background: aiAvailable ? 'var(--success)' : 'var(--warning)' }} />
          <div style={styles.aiInfo}>
            <div style={styles.aiProviderName}>{aiProvider}</div>
            <div style={styles.aiProviderSub}>{aiAvailable ? 'Edge AI Online' : 'AI Offline'}</div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Teacher info */}
        <div style={styles.teacherRow}>
          <div style={styles.teacherAvatar}>{teacher?.name?.[0]?.toUpperCase() || 'T'}</div>
          <div style={styles.teacherInfo}>
            <div style={styles.teacherName}>{teacher?.name}</div>
            <div style={styles.teacherRole}>Teacher</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">⎋</button>
        </div>
      </div>
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    width: 'var(--sidebar-width)',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 16px 0',
    zIndex: 50,
    overflowY: 'auto'
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 18px', borderBottom: '1px solid var(--border)', marginBottom: 8
  },
  brandIcon: { fontSize: 22 },
  brandName: {
    fontSize: 18, fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
  },
  syncAlert: {
    margin: '0 10px 10px',
    padding: '10px 12px',
    borderRadius: 10, border: '1px solid',
  },
  syncBtn: {
    width: '100%', padding: '6px 0', borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer'
  } as any,
  sessionBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '4px 12px 8px',
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: 8, padding: '6px 10px'
  },
  sessionCode: { fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--success)', flex: 1 },
  sessionLabel: { fontSize: 10, fontWeight: 700, color: 'var(--success)', letterSpacing: 1 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, transition: 'all 0.15s ease'
  } as any,
  navItemActive: { background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 600 },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  navLabel: { flex: 1 },
  navBadge: {
    background: 'var(--primary)', color: '#fff', borderRadius: 99,
    padding: '1px 7px', fontSize: 11, fontWeight: 700
  },
  bottom: { padding: '0 12px' },
  aiStatus: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 8px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 8
  },
  aiDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  aiInfo: { flex: 1, minWidth: 0 },
  aiProviderName: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  aiProviderSub: { fontSize: 11, color: 'var(--text-muted)' },
  divider: { height: 1, background: 'var(--border)', margin: '8px 0' },
  teacherRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  teacherAvatar: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0
  },
  teacherInfo: { flex: 1, minWidth: 0 },
  teacherName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  teacherRole: { fontSize: 11, color: 'var(--text-muted)' },
  logoutBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center'
  }
}
