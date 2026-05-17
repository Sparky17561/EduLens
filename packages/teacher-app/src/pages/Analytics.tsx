import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { reportApi } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Analytics() {
  const { activeSession, students } = useAppStore()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeSession) return
    setLoading(true)
    reportApi.get(activeSession.id).then(setReport).catch(() => {}).finally(() => setLoading(false))
  }, [activeSession?.id, students.length])

  const analytics = report?.analytics
  const studentReports = report?.studentReports || []

  const chartData = analytics?.topicBreakdown
    ? Object.entries(analytics.topicBreakdown).map(([topic, avg]) => ({ topic, avg: Math.round(avg as number) }))
    : []

  const weakTopics: string[] = analytics?.weakTopics || []

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Analytics</h2>
          <p>{activeSession ? `Session ${activeSession.code} · ${activeSession.topic}` : 'No active session'}</p>
        </div>
        {activeSession && (
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setLoading(true)
            reportApi.get(activeSession.id).then(setReport).finally(() => setLoading(false))
          }}>
            ↻ Refresh
          </button>
        )}
      </div>

      {!activeSession && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Active Session</h3>
          <p>Start a session and launch a quiz to see analytics</p>
        </div>
      )}

      {activeSession && (
        <>
          {/* Stat cards */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Students</div>
              <div className="stat-value">{analytics?.total_students || students.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Class Avg</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {analytics?.avg_score ? `${Math.round(analytics.avg_score)}%` : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Weak Topics</div>
              <div className="stat-value" style={{ color: 'var(--danger)', fontSize: 18 }}>
                {weakTopics.length || '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Submitted</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {studentReports.length}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Topic chart */}
            <div className="card">
              <h4 style={{ marginBottom: 16 }}>Topic-wise Performance</h4>
              {chartData.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <p>No quiz data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="topic" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                      formatter={(v: any) => [`${v}%`, 'Avg Score']}
                    />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.avg >= 60 ? 'var(--success)' : 'var(--danger)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Weak topics */}
            <div className="card">
              <h4 style={{ marginBottom: 12 }}>Class Weak Areas</h4>
              {weakTopics.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}><p>No weak topics identified yet</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {weakTopics.map((topic, i) => (
                    <div key={i} style={styles.weakTopic}>
                      <span style={styles.weakIcon}>⚠️</span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{topic}</span>
                      <span className="badge badge-danger">Weak</span>
                    </div>
                  ))}
                </div>
              )}

              {analytics?.aiSummary && (
                <>
                  <div className="divider" />
                  <h4 style={{ marginBottom: 8 }}>AI Summary</h4>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>{analytics.aiSummary}</p>
                </>
              )}
            </div>
          </div>

          {/* Per-student results */}
          <div className="card">
            <h4 style={{ marginBottom: 14 }}>Student Results</h4>
            {studentReports.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>Waiting for quiz submissions…</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Student', 'Score', 'Strong Topics', 'Weak Topics', 'Homework'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentReports.sort((a: any, b: any) => b.percentage - a.percentage).map((r: any) => (
                      <tr key={r.id} style={styles.tr}>
                        <td style={styles.td}><span style={{ fontWeight: 600 }}>{r.student_name}</span></td>
                        <td style={styles.td}>
                          <span style={{ color: r.percentage >= 60 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                            {r.score}/{r.total} ({Math.round(r.percentage)}%)
                          </span>
                        </td>
                        <td style={styles.td}>{r.strongTopics?.join(', ') || '—'}</td>
                        <td style={styles.td}>
                          {r.weakTopics?.length > 0
                            ? r.weakTopics.map((t: string, i: number) => <span key={i} className="badge badge-danger" style={{ marginRight: 4 }}>{t}</span>)
                            : '—'}
                        </td>
                        <td style={styles.td}>
                          {r.homework?.followUpQuestions?.length > 0
                            ? <span className="badge badge-success">✓ Generated</span>
                            : <span className="badge badge-muted">Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  weakTopic: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px',
    background: 'var(--danger-dim)',
    borderRadius: 8, fontSize: 13
  },
  weakIcon: { fontSize: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)' }
}
