import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { reportApi } from '../api/client'

export default function Homework() {
  const { activeSession } = useAppStore()
  const [report, setReport] = useState<any>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!activeSession) return
    reportApi.get(activeSession.id).then(setReport).catch(() => {})
  }, [activeSession?.id])

  const studentReports = (report?.studentReports || []).filter((r: any) => r.homework?.followUpQuestions?.length)

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Homework</h2>
          <p>Auto-generated from quiz weak-area analysis · {studentReports.length} students with homework</p>
        </div>
        {activeSession && (
          <button className="btn btn-ghost btn-sm" onClick={() => reportApi.get(activeSession.id).then(setReport).catch(() => {})}>
            ↻ Refresh
          </button>
        )}
      </div>

      {!activeSession && (
        <div className="empty-state"><div className="empty-icon">📚</div><h3>No Active Session</h3><p>Start a session and run a quiz first</p></div>
      )}

      {activeSession && studentReports.length === 0 && (
        <div className="empty-state"><div className="empty-icon">⏳</div><h3>Waiting for quiz submissions</h3><p>Homework generates automatically after each student submits</p></div>
      )}

      {studentReports.map((r: any) => {
        const hw = r.homework
        const isOpen = expanded === r.id
        return (
          <div key={r.id} className="card" style={{ marginBottom: 12 }}>
            <div style={styles.header} onClick={() => setExpanded(isOpen ? null : r.id)}>
              <div style={styles.studentInfo}>
                <div style={styles.avatar}>{r.student_name[0]?.toUpperCase()}</div>
                <div>
                  <div style={styles.studentName}>{r.student_name}</div>
                  <div style={styles.studentMeta}>
                    Score: {r.score}/{r.total} · Weak: {r.weakTopics?.join(', ') || 'None'}
                  </div>
                </div>
              </div>
              <div style={styles.headerRight}>
                <span className={`badge ${r.percentage >= 60 ? 'badge-success' : 'badge-danger'}`}>{Math.round(r.percentage)}%</span>
                <span style={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && hw && (
              <div style={styles.body} className="animate-in">
                {hw.conceptRecap && (
                  <div style={styles.section}>
                    <h4>📖 Concept Recap</h4>
                    <p style={styles.text}>{hw.conceptRecap}</p>
                  </div>
                )}

                {hw.followUpQuestions?.length > 0 && (
                  <div style={styles.section}>
                    <h4>❓ Follow-up Questions</h4>
                    <ol style={styles.list}>
                      {hw.followUpQuestions.map((q: string, i: number) => <li key={i} style={styles.listItem}>{q}</li>)}
                    </ol>
                  </div>
                )}

                {hw.revisionTasks?.length > 0 && (
                  <div style={styles.section}>
                    <h4>✏️ Revision Tasks</h4>
                    <ul style={styles.list}>
                      {hw.revisionTasks.map((t: string, i: number) => <li key={i} style={styles.listItem}>{t}</li>)}
                    </ul>
                  </div>
                )}

                {hw.practiceChallenge && (
                  <div style={{ ...styles.section, background: 'var(--primary-glow)', borderRadius: 8, padding: 14 }}>
                    <h4>🎯 Practice Challenge</h4>
                    <p style={styles.text}>{hw.practiceChallenge}</p>
                  </div>
                )}

                {hw.askTeacherPrompts?.length > 0 && (
                  <div style={styles.section}>
                    <h4>🙋 Suggested Questions for Teacher</h4>
                    <ul style={styles.list}>
                      {hw.askTeacherPrompts.map((p: string, i: number) => <li key={i} style={styles.listItem}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' },
  studentInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'var(--primary-glow)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, color: 'var(--primary)'
  },
  studentName: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' },
  studentMeta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  chevron: { color: 'var(--text-muted)', fontSize: 12 },
  body: { marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 },
  section: {},
  text: { fontSize: 13, lineHeight: 1.7, marginTop: 6 },
  list: { paddingLeft: 20, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 },
  listItem: { fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }
}
