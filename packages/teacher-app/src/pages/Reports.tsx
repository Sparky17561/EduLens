import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { reportApi, sessionApi } from '../api/client'
import QRCode from 'qrcode.react'

export default function Reports() {
  const { teacher, activeSession } = useAppStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [exportData, setExportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!teacher) return
    sessionApi.list(teacher.id).then(d => setSessions(d.sessions || [])).catch(() => {})
  }, [teacher?.id, activeSession?.id])

  const loadReport = async (sessionId: string) => {
    setLoading(true)
    try {
      const r = await reportApi.get(sessionId)
      setSelectedReport(r)
    } catch (e) {}
    setLoading(false)
  }

  const exportReport = async (sessionId: string) => {
    setLoading(true)
    try {
      const d = await reportApi.export(sessionId)
      setExportData(d)
      setShowModal(true)
    } catch (e) {}
    setLoading(false)
  }

  const downloadJson = () => {
    if (!exportData) return
    const blob = new Blob([exportData.jsonBlob], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edulens-report-${exportData.exportData?.session?.id || 'export'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const report = selectedReport

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Reports</h2>
          <p>Session history and export</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100% - 70px)', overflow: 'hidden' }}>
        {/* Sessions list */}
        <div className="card" style={{ overflowY: 'auto' }}>
          <h4 style={{ marginBottom: 12 }}>Sessions</h4>
          {sessions.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No sessions yet</p>}
          {sessions.map(s => (
            <div key={s.id} style={{ ...styles.sessionItem, borderColor: selectedReport?.session?.id === s.id ? 'var(--primary)' : 'var(--border)' }}
              onClick={() => loadReport(s.id)}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.topic}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {new Date(s.created_at).toLocaleDateString()} · {s.student_count || 0} students
              </div>
              <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-muted'}`} style={{ marginTop: 6 }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* Report detail */}
        <div style={{ overflowY: 'auto' }}>
          {!report && !loading && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Select a session</h3>
              <p>Click a session to view its report</p>
            </div>
          )}
          {loading && <div className="empty-state"><span className="spinner" style={{ width: 32, height: 32 }} /></div>}

          {report && (
            <div className="animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3>{report.session?.topic}</h3>
                  <p style={{ fontSize: 12 }}>
                    {new Date(report.session?.created_at).toLocaleString()} · Code: {report.session?.session_code}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => exportReport(report.session.id)} disabled={loading}>
                  📤 Export Report
                </button>
              </div>

              {/* Summary stats */}
              <div className="grid-3" style={{ marginBottom: 16 }}>
                <div className="stat-card">
                  <div className="stat-label">Students</div>
                  <div className="stat-value">{report.analytics?.total_students || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Class Avg</div>
                  <div className="stat-value" style={{ color: 'var(--primary)' }}>
                    {report.analytics?.avg_score ? `${Math.round(report.analytics.avg_score)}%` : '—'}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">AI Summary</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                    {report.analytics?.aiSummary || 'Not generated'}
                  </div>
                </div>
              </div>

              {/* Per-student */}
              {report.studentReports?.map((r: any) => (
                <div key={r.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{r.student_name}</div>
                    <span className={`badge ${r.percentage >= 60 ? 'badge-success' : 'badge-danger'}`}>
                      {r.score}/{r.total} · {Math.round(r.percentage)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Weak: {r.weakTopics?.join(', ') || 'None'} · Strong: {r.strongTopics?.join(', ') || 'None'}
                  </div>
                  {r.homework?.conceptRecap && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Homework: {r.homework.conceptRecap.slice(0, 100)}…
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export modal */}
      {showModal && exportData && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Report</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <p style={{ marginBottom: 20, fontSize: 13 }}>
              Scan QR with the student app to import, or download the JSON file.
            </p>

            {exportData.qrDataUrl ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <QRCode value={`edulens://import/${exportData.base64}`} size={200} bgColor="transparent" fgColor="var(--text-primary)" />
              </div>
            ) : (
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                Report is too large for QR. Use JSON download instead.
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={downloadJson}>
              ⬇ Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sessionItem: {
    padding: '10px 12px', borderRadius: 8, border: '1px solid',
    marginBottom: 8, cursor: 'pointer',
    transition: 'all 0.15s ease'
  }
}
