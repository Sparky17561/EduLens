import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'

export default function Login() {
  const { setTeacher } = useAppStore()
  const [name, setName] = useState('Teacher')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Enter your name')
    if (!pin.trim()) return setError('Enter your PIN')

    setLoading(true)
    // Validate PIN against default (from .env, seeded in DB)
    await new Promise((r) => setTimeout(r, 400))
    // @ts-ignore
    if (pin === '1234' || pin === (import.meta.env.VITE_TEACHER_PIN || '1234')) {
      setTeacher({ id: 'teacher-default', name: name.trim() })
    } else {
      setError('Incorrect PIN')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>📡</div>
          <h1 style={styles.logoText}>EduLens</h1>
          <p style={styles.logoSub}>Teacher Dashboard</p>
        </div>

        <div style={styles.divider} />

        <form onSubmit={handleLogin} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ms. Sharma"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Teacher PIN</label>
            <input
              className="input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Default: 1234"
              maxLength={8}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '→ Enter Dashboard'}
          </button>
        </form>

        <p style={styles.hint}>
          LAN-first · AI-pluggable · Powered by Groq
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.12) 0%, transparent 70%), var(--bg-base)'
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px 36px',
    width: 380,
    boxShadow: 'var(--shadow-lg)'
  },
  logo: {
    textAlign: 'center',
    marginBottom: 24
  },
  logoIcon: { fontSize: 40, marginBottom: 8 },
  logoText: {
    fontSize: 32,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 4
  },
  logoSub: { color: 'var(--text-muted)', fontSize: 13 },
  divider: { height: 1, background: 'var(--border)', margin: '0 0 24px' },
  form: { display: 'flex', flexDirection: 'column' },
  errorBox: {
    marginTop: 12,
    background: 'var(--danger-dim)',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    fontSize: 13
  },
  hint: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: 'var(--text-muted)'
  }
}
