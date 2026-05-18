import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { sessionApi, knowledgeApi } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import QRCode from 'qrcode.react'

export default function Dashboard() {
  const { teacher, activeSession, setActiveSession, students, messages } = useAppStore()
  const [topic, setTopic] = useState('General')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>('')
  const navigate = useNavigate()

  useWebSocket(activeSession?.id || null)

  // Fetch available knowledge bases
  useEffect(() => {
    if (!teacher) return
    knowledgeApi.list(teacher.id)
      .then(d => setKnowledgeBases(d.knowledgeBases || []))
      .catch(() => {})
  }, [teacher])

  const startSession = async () => {
    if (!teacher) return
    setLoading(true)
    setError('')
    try {
      const data = await sessionApi.start(teacher.id, topic, selectedKbId || undefined)
      setActiveSession({
        id: data.sessionId,
        code: data.sessionCode,
        topic: data.topic,
        qrDataUrl: data.qrDataUrl,
        hostIp: data.hostIp,
        port: data.port,
        joinUrl: data.joinUrl,
        startedAt: new Date().toISOString()
      })
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  const endSession = async () => {
    if (!activeSession || !teacher) return
    if (!confirm('End the session? All students will be disconnected.')) return
    setLoading(true)
    try {
      await sessionApi.end(activeSession.id, teacher.id)
      setActiveSession(null)
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  const copyUrl = () => {
    if (activeSession) {
      navigator.clipboard.writeText(activeSession.joinUrl)
    }
  }

  const sessionDuration = activeSession
    ? Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000)
    : 0

  const [ticker, setTicker] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTicker((x) => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="page-body animate-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Dashboard</h2>
          <p>
            {activeSession
              ? `Session active · ${topic} · ${sessionDuration}m elapsed`
              : 'Start a session to begin teaching'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {!activeSession ? (
            <button className="btn btn-success btn-lg" onClick={startSession} disabled={loading}>
              {loading ? <span className="spinner" /> : '▶ Start Session'}
            </button>
          ) : (
            <button className="btn btn-danger btn-lg" onClick={endSession} disabled={loading}>
              {loading ? <span className="spinner" /> : '■ End Session'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Pre-session setup */}
      {!activeSession && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>Session Topic</h4>
          <div className="flex gap-2 items-center">
            <input
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Fractions, Newton's Laws..."
            />
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            This helps the AI generate relevant content and homework
          </p>

          {/* Knowledge Base Selector */}
          {knowledgeBases.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <label className="form-label">📚 Lesson Material (optional)</label>
              <select
                className="input"
                value={selectedKbId}
                onChange={e => setSelectedKbId(e.target.value)}
                style={{ marginTop: 6 }}
              >
                <option value="">— None (use built-in NCERT knowledge) —</option>
                {knowledgeBases.map(kb => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Select a PDF to supplement AI answers with your custom material.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Active session grid */}
      {activeSession && (
        <>
          {/* Stats strip */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <StatCard icon="👥" label="Students Online" value={students.length} color="var(--primary)" />
            <StatCard icon="💬" label="Chat Messages" value={messages.filter(m => m.messageType === 'chat' || m.messageType === 'ask').length} color="var(--info)" />
            <StatCard icon="✏️" label="Quiz Submitted" value={students.filter(s => s.score !== undefined).length} color="var(--success)" />
            <StatCard
              icon="📊"
              label="Avg Score"
              value={
                students.filter(s => s.percentage !== undefined).length > 0
                  ? `${Math.round(students.filter(s => s.percentage !== undefined).reduce((a, s) => a + (s.percentage || 0), 0) / students.filter(s => s.percentage !== undefined).length)}%`
                  : '—'
              }
              color="var(--warning)"
            />
          </div>

          {/* Main two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            {/* Left: QR + join info */}
            <div className="card glow" style={{ textAlign: 'center' }}>
              <div style={styles.qrHeader}>
                <div className="live-dot" />
                <h3>Session Active</h3>
                <span className="badge badge-success">LIVE</span>
              </div>

              <div style={styles.qrWrap}>
                <QRCode
                  value={activeSession.joinUrl}
                  size={220}
                  bgColor="transparent"
                  fgColor="#e2e8f0"
                  level="M"
                />
              </div>

              {/* Session code */}
              <div style={styles.codeBlock}>
                <div style={styles.codeLabel}>SESSION CODE</div>
                <div style={styles.codeValue}>{activeSession.code}</div>
              </div>

              {/* Join URL */}
              <div style={styles.urlRow}>
                <code style={styles.urlText}>{activeSession.joinUrl}</code>
                <button className="btn btn-ghost btn-sm" onClick={copyUrl} title="Copy URL">📋</button>
              </div>

              <p style={styles.helpText}>
                Students scan the QR, type the code, or paste the URL to join
              </p>

              {/* Quick actions */}
              <div style={styles.actionRow}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/chat')}>💬 Chat</button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/quiz')}>✏️ Quiz</button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>📊 Analytics</button>
              </div>
              
              <div style={{ ...styles.actionRow, marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/trivia-generator')} style={{ width: '100%' }}>
                  💡 Generate AI Interactive Trivia
                </button>
              </div>
            </div>

            {/* Right: Student Roster */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={styles.rosterHeader}>
                <h4>Students</h4>
                <span style={styles.rosterCount}>{students.length} online</span>
              </div>
              <div style={styles.rosterList}>
                {students.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-icon">🎓</div>
                    <p>Waiting for students to join…</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <div key={student.id} style={styles.rosterItem}>
                      <div style={styles.studentAvatar}>{student.name[0]?.toUpperCase()}</div>
                      <div style={styles.studentInfo}>
                        <div style={styles.studentName}>{student.name}</div>
                        <div style={styles.studentMeta}>
                          {student.percentage !== undefined
                            ? `Score: ${student.score}/${student.score !== undefined ? (student as any).total || '?' : '?'} (${Math.round(student.percentage)}%)`
                            : `Joined ${new Date(student.joinedAt).toLocaleTimeString()}`}
                        </div>
                      </div>
                      {student.percentage !== undefined && (
                        <span className={`badge ${student.percentage >= 60 ? 'badge-success' : 'badge-danger'}`}>
                          {Math.round(student.percentage)}%
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* No session placeholder */}
      {!activeSession && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon">📡</div>
          <h3>No Active Session</h3>
          <p>Set a topic above and click "Start Session" to generate a QR code</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  qrHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20
  },
  qrWrap: {
    display: 'flex', justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 16, padding: 20, marginBottom: 20
  },
  codeBlock: {
    background: 'var(--bg-elevated)',
    borderRadius: 10, padding: '12px 20px', marginBottom: 12
  },
  codeLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 4 },
  codeValue: { fontSize: 32, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--primary)', letterSpacing: 4 },
  urlRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-base)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '6px 10px', marginBottom: 12, overflow: 'hidden'
  },
  urlText: { flex: 1, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  helpText: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 },
  actionRow: { display: 'flex', gap: 8, justifyContent: 'center' },
  rosterHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)'
  },
  rosterCount: { fontSize: 12, color: 'var(--text-muted)' },
  rosterList: { overflowY: 'auto', maxHeight: 380 },
  rosterItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 4px', borderBottom: '1px solid var(--border)'
  },
  studentAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--bg-elevated)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0, color: 'var(--text-primary)'
  },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  studentMeta: { fontSize: 11, color: 'var(--text-muted)' }
}
