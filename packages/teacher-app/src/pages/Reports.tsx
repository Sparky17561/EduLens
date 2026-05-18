import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { reportApi, sessionApi, syncApi } from '../api/client'
import { useToast } from '../components/Toast'
import QRCode from 'qrcode.react'
import StudentQRScanner from '../components/StudentQRScanner'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

export default function Reports() {
  const { teacher, activeSession } = useAppStore()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [exportData, setExportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scannedStudent, setScannedStudent] = useState<any>(null)

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

  const exportBundle = async (sessionId: string) => {
    if (!teacher) return
    setLoading(true)
    try {
      const data = await syncApi.exportBundle(sessionId, teacher.id)
      toast(`Bundle saved: ${data.filename}`, 'success')
    } catch (e: any) {
      toast(e.message || 'Export failed', 'error')
    }
    setLoading(false)
  }

  const importBundleFile = async (file: File) => {
    setLoading(true)
    try {
      const text = await file.text()
      const bundle = JSON.parse(text)
      const r = await syncApi.importBundle(bundle)
      toast(`Restored session ${r.sessionId}`, 'success')
      loadReport(r.sessionId)
    } catch (e: any) {
      toast(e.message || 'Invalid bundle JSON', 'error')
    }
    setLoading(false)
  }

  const downloadPdf = async (sessionId: string) => {
    setLoading(true)
    try {
      const data = await reportApi.exportPdf(sessionId)
      const html = data.html || data.content
      if (!html) throw new Error('No PDF content')
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
        w.focus()
        setTimeout(() => w.print(), 400)
      }
      toast('Print dialog opened — save as PDF', 'success')
    } catch (e: any) {
      toast(e.message || 'PDF export failed', 'error')
    }
    setLoading(false)
  }

  const report = selectedReport

  return (
    <div className="page-body animate-in">
      <div className="story-hero story-hero-compact">
        <div className="story-hero-text">
          <span className="kicker">PRESSED IN PAGES</span>
          <h2 style={{ margin: '4px 0' }}>Reports</h2>
          <p className="subhead">Session history, export & restore — each one a remembered day.</p>
        </div>
        <div className="story-hero-image">
          <StoryImage
            file="reports-pressed-pages.png"
            shape="lopsided"
            rotate={-3}
            width={140}
            height={140}
            fallbackLabel="reports · pressed pages"
          />
        </div>
      </div>
      <div className="page-header" style={{ marginTop: -8 }}>
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowQRScanner(true)}>
            <Icon name="camera" size={14} /> Scan Student QR
          </button>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            <Icon name="download" size={14} /> Import bundle JSON
            <input type="file" accept=".json" hidden onChange={e => e.target.files?.[0] && importBundleFile(e.target.files[0])} />
          </label>
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
            <div className="empty-state empty-state-modern">
              <span className="empty-icon-bubble icon-bubble-primary"><Icon name="reports" size={32} /></span>
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
                <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => exportReport(report.session.id)} disabled={loading}>
                  <Icon name="upload" size={14} /> Export JSON/QR
                </button>
                <button className="btn btn-ghost" onClick={() => downloadPdf(report.session.id)} disabled={loading}>
                  <Icon name="print" size={14} /> PDF
                </button>
                <button className="btn btn-ghost" onClick={() => exportBundle(report.session.id)} disabled={loading}>
                  <Icon name="package" size={14} /> Bundle
                </button>
                </div>
              </div>

              {report.insights && (
                <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--primary)' }}>
                  <h4 style={{ marginBottom: 10 }}>Actionable Insights</h4>
                  <div className="grid-3" style={{ marginBottom: 12 }}>
                    <div><span className="stat-label">Class avg</span><div className="stat-value">{report.insights.classSummary?.avgScore ?? '—'}%</div></div>
                    <div><span className="stat-label">Homework done</span><div className="stat-value">{report.insights.classSummary?.homeworkCompletionRate ?? 0}%</div></div>
                    <div><span className="stat-label">Weak areas</span><div style={{ fontSize: 12 }}>{(report.insights.weakAreas || []).join(', ') || 'None'}</div></div>
                  </div>
                  {report.insights.recommendations?.length > 0 && (
                    <ul style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 18 }}>
                      {report.insights.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}

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
              <button className="modal-close" onClick={() => setShowModal(false)}><Icon name="x" size={16} /></button>
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
              <Icon name="download" size={14} /> Download JSON
            </button>
          </div>
        </div>
      )}

      {/* Student QR scanner */}
      {showQRScanner && (
        <StudentQRScanner
          onScan={(report) => {
            setScannedStudent(report)
            setShowQRScanner(false)
            toast(`Received report from ${report.student.name}`, 'success')
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Scanned student report */}
      {scannedStudent && (
        <div className="modal-overlay" onClick={() => setScannedStudent(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="analytics" size={20} /> {scannedStudent.student.name}'s Report
              </h3>
              <button className="modal-close" onClick={() => setScannedStudent(null)}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {scannedStudent.session.topic} · {scannedStudent.session.code} · {scannedStudent.date}
            </div>
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div className="stat-label">Score</div>
                <div className="stat-value">{scannedStudent.quiz.score}/{scannedStudent.quiz.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Percentage</div>
                <div className="stat-value" style={{ color: scannedStudent.quiz.percentage >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                  {scannedStudent.quiz.percentage}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Grade</div>
                <div className="stat-value">
                  {scannedStudent.quiz.percentage >= 90 ? 'A' : scannedStudent.quiz.percentage >= 75 ? 'B' : scannedStudent.quiz.percentage >= 60 ? 'C' : 'D'}
                </div>
              </div>
            </div>
            {scannedStudent.weakTopics?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="warning" size={12} /> Needs Review
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{scannedStudent.weakTopics.join(', ')}</div>
              </div>
            )}
            {scannedStudent.strongTopics?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={12} /> Mastered
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{scannedStudent.strongTopics.join(', ')}</div>
              </div>
            )}
            {scannedStudent.homework?.conceptRecap && (
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="book" size={14} /> {scannedStudent.homework.conceptRecap}
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                    onClick={() => setShowQRScanner(true)}>
              <Icon name="camera" size={14} /> Scan Another Student
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
