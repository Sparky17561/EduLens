import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { sessionApi, knowledgeApi } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import { useReport } from '../hooks/useReport'
import { useSync } from '../hooks/useSync'
import { StatCard, EmptyState } from '../components/ui'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'
import QRCode from 'qrcode.react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const { teacher, activeSession, setActiveSession, students, messages } = useAppStore()
  const [topic, setTopic] = useState('General')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([])
  const [selectedKbId, setSelectedKbId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const navigate = useNavigate()
  const { report, refresh: refreshReport } = useReport(activeSession?.id || null, refreshKey)
  const { pending, lastSynced, syncing } = useSync()

  useWebSocket(activeSession?.id || null)

  useEffect(() => {
    const handler = () => { setRefreshKey(k => k + 1); refreshReport() }
    window.addEventListener('edulens:analytics_updated', handler)
    return () => window.removeEventListener('edulens:analytics_updated', handler)
  }, [refreshReport])

  useEffect(() => {
    if (!teacher) return
    knowledgeApi.list(teacher.id).then(d => setKnowledgeBases(d.knowledgeBases || [])).catch(() => {})
    sessionApi.list(teacher.id).then(d => setPastSessions((d.sessions || []).filter((s: any) => s.status === 'ended'))).catch(() => {})
  }, [teacher, activeSession?.id])

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

  const insights = report?.insights
  const analytics = report?.analytics
  const weakTopics: string[] = analytics?.weakTopics || insights?.weakAreas || []
  const chartData = analytics?.topicBreakdown
    ? Object.entries(analytics.topicBreakdown).map(([topic, avg]) => ({ topic, avg: Math.round(avg as number) }))
    : []

  const submittedCount = students.filter(s => s.percentage !== undefined).length
  const avgScore = submittedCount > 0
    ? Math.round(students.filter(s => s.percentage !== undefined).reduce((a, s) => a + (s.percentage || 0), 0) / submittedCount)
    : Math.round(analytics?.avg_score || 0)

  const homeworkDone = report?.studentReports?.filter((r: any) => r.homework?.followUpQuestions?.length).length || 0
  const homeworkTotal = report?.studentReports?.length || 0

  return (
    <div className="page-body animate-in">
      <MotionHeader
        title="Dashboard"
        subtitle={activeSession ? `Session ${activeSession.code} · ${activeSession.topic}` : 'Start a session to begin'}
        kicker={activeSession ? 'CLASSROOM · LIVE' : 'CLASSROOM'}
        actions={
          !activeSession ? (
            <button className="btn btn-success btn-lg" onClick={startSession} disabled={loading}>
              {loading ? <span className="spinner" /> : <><Icon name="play" size={16} /> Start Session</>}
            </button>
          ) : (
            <button className="btn btn-danger btn-lg" onClick={endSession} disabled={loading}>
              {loading ? <span className="spinner" /> : <><Icon name="stop" size={16} /> End Session</>}
            </button>
          )
        }
      />

      {error && <p style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>}

      {activeSession && (
        <>
          <div className="health-card" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 12 }}>Classroom Health</h4>
            <div className="grid-4">
              <StatCard icon="users" tone="primary" label="Students Online" value={students.length} color="var(--primary)" />
              <StatCard icon="analytics" tone="primary" label="Class Avg" value={avgScore ? `${avgScore}%` : '—'} color="var(--info)" trend={avgScore >= 60 ? 'up' : 'down'} />
              <StatCard icon="homework" tone="success" label="Homework" value={homeworkTotal ? `${homeworkDone}/${homeworkTotal}` : '—'} sub="AI generated" color="var(--success)" />
              <StatCard icon="cloud" tone={pending > 0 ? 'warning' : 'success'} label="Sync" value={syncing ? '…' : pending > 0 ? `${pending} pending` : lastSynced ? 'OK' : 'Local'} color={pending > 0 ? 'var(--warning)' : 'var(--success)'} />
            </div>
            {weakTopics.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weak topics:</span>
                {weakTopics.slice(0, 5).map(t => (
                  <span key={t} className="badge badge-danger">{t}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/quiz')}><Icon name="quiz" size={14} /> Quiz Studio</button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}><Icon name="analytics" size={14} /> Analytics</button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reteach')}><Icon name="reteach" size={14} /> Reteach</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setRefreshKey(k => k + 1); refreshReport() }}><Icon name="refresh" size={14} /> Refresh</button>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 20, height: 220 }}>
              <h4 style={{ marginBottom: 8 }}>Topic Performance</h4>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={chartData}>
                  <XAxis dataKey="topic" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.avg >= 60 ? 'var(--success)' : 'var(--danger)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <MotionGrid>
            <SessionPanel activeSession={activeSession} navigate={navigate} copyUrl={() => navigator.clipboard.writeText(activeSession.joinUrl)} students={students} />
          </MotionGrid>
        </>
      )}

      {!activeSession && (
        <>
          <div className="story-hero">
            <div className="story-hero-text">
              <span className="kicker">QUIET CLASSROOM</span>
              <div className="headline">Start the day's lesson</div>
              <p className="subhead">Set a topic and start a session to share the QR code with your class.</p>
            </div>
            <div className="story-hero-image">
              <StoryImage
                file="dashboard-quiet-classroom.png"
                shape="tilted"
                rotate={4}
                width={180}
                height={180}
                fallbackLabel="dashboard · quiet classroom"
              />
            </div>
          </div>

          <div className="card" style={{ maxWidth: 480, marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Session Topic</h4>
            <input className="input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions, Photosynthesis…" />
            {knowledgeBases.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="book" size={14} /> Knowledge Base (optional)
                </label>
                <select className="input" value={selectedKbId} onChange={e => setSelectedKbId(e.target.value)} style={{ marginTop: 6 }}>
                  <option value="">— Built-in NCERT —</option>
                  {knowledgeBases.map(kb => (
                    <option key={kb.id} value={kb.id}>{kb.name} ({kb.chunk_count} chunks)</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {pastSessions.length === 0 ? (
            <EmptyState icon="broadcast" tone="primary" title="No Active Session" description="Set a topic and start a session to get your QR code and class dashboard." />
          ) : (
            <div>
              <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Past Sessions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {pastSessions.map((s: any) => (
                  <div key={s.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer' }}
                       onClick={() => navigate('/reports')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.topic}</div>
                      <span className="badge badge-muted" style={{ fontSize: 11 }}>{s.session_code}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {s.ended_at && ` · ended ${new Date(s.ended_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="users" size={12} /> {s.student_count || 0} students
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--primary)', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        View Report <Icon name="arrow-right" size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MotionHeader({ title, subtitle, kicker, actions }: { title: string; subtitle: string; kicker?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        {kicker && <span className="kicker">{kicker}</span>}
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {actions}
    </div>
  )
}

function MotionGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>{children}</div>
}

function SessionPanel({ activeSession, navigate, copyUrl, students }: any) {
  return (
    <>
      <div className="card glow" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div className="live-dot" />
          <h3 style={{ margin: 0 }}>Session Live</h3>
          <span className="badge badge-success">LIVE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <QRCode value={activeSession.joinUrl} size={200} bgColor="transparent" fgColor="#e2e8f0" />
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 20px', marginBottom: 12 }}>
          <MotionSmall>SESSION CODE</MotionSmall>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--primary)', letterSpacing: 4 }}>{activeSession.code}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/chat')}><Icon name="chat" size={14} /> Chat</button>
          <button className="btn btn-ghost btn-sm" onClick={copyUrl}><Icon name="copy" size={14} /> Copy URL</button>
        </div>
      </div>
      <div className="card">
        <h4 style={{ marginBottom: 12 }}>Students ({students.length})</h4>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {students.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Waiting for students…</p>
          ) : (
            students.map((s: any) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.percentage !== undefined ? `Score ${Math.round(s.percentage)}%` : 'Joined'}
                  </div>
                </div>
                {s.percentage !== undefined && (
                  <span className={`badge ${s.percentage >= 60 ? 'badge-success' : 'badge-danger'}`}>{Math.round(s.percentage)}%</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function MotionSmall({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)' }}>{children}</div>
}
