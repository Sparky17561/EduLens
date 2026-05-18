import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

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
      <div style={styles.split}>
        {/* Story panel */}
        <div style={styles.heroPanel}>
          <div style={styles.heroAmoeba}>
            <StoryImage
              file="login-first-light.png"
              shape="puff"
              rotate={-6}
              width={420}
              height={420}
              fallbackLabel="login · first light"
            />
          </div>
          <div style={styles.heroCopy}>
            <span className="kicker">A QUIET START</span>
            <h1 style={styles.heroHeadline}>Begin the lesson{'\n'}before the noise.</h1>
            <p style={styles.heroSub}>EduLens helps you teach with calm, listen with attention, and meet every student where they are.</p>
          </div>
        </div>

        {/* Form panel */}
        <div style={styles.formPanel}>
          <div style={styles.card}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}><Icon name="brand" size={32} /></span>
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
                {loading ? <span className="spinner" /> : <><Icon name="arrow-right" size={16} /> Enter Dashboard</>}
              </button>
            </form>

            <p style={styles.hint}>
              LAN-first · AI-pluggable · Powered by Groq
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #FBF6EE 0%, #F0E1D5 50%, #E8EBFA 100%)',
    overflow: 'auto',
  },
  split: {
    minHeight: '100%',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    alignItems: 'center',
    padding: '40px 8vw',
    gap: 48,
  },
  heroPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  heroAmoeba: {
    width: 420,
    maxWidth: '100%',
    aspectRatio: '1 / 1',
  },
  heroCopy: {
    maxWidth: 460,
  },
  heroHeadline: {
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1.1,
    color: 'var(--text-primary)',
    whiteSpace: 'pre-line',
    margin: '8px 0 12px',
    letterSpacing: '-0.5px',
  },
  heroSub: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  formPanel: { display: 'flex', justifyContent: 'center' },
  card: {
    background: 'var(--bg-card)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px 36px',
    width: 400,
    maxWidth: '100%',
    boxShadow: 'var(--shadow-lg)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 24,
  },
  logoIcon: { display: 'inline-flex', color: 'var(--primary)', marginBottom: 8 },
  logoText: {
    fontSize: 32,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6C7BD6, #E8836B)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 4,
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
    fontSize: 13,
  },
  hint: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: 'var(--text-muted)',
  },
}
