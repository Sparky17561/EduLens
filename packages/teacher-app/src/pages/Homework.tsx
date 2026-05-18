import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { reportApi } from '../api/client'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

export default function Homework() {
  const { activeSession } = useAppStore()
  const [report, setReport] = useState<any>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    if (!activeSession) return
    reportApi.get(activeSession.id).then(setReport).catch(() => {})
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('edulens:analytics_updated', handler)
    return () => window.removeEventListener('edulens:analytics_updated', handler)
  }, [activeSession?.id])

  const studentReports = (report?.studentReports || []).filter((r: any) => r.homework?.followUpQuestions?.length)

  return (
    <div className="page-body animate-in">
      <div className="story-hero story-hero-compact">
        <div className="story-hero-text">
          <span className="kicker">THE PATH HOME</span>
          <h2 style={{ margin: '4px 0' }}>Homework</h2>
          <p className="subhead">Auto-generated from quiz weak-area analysis · {studentReports.length} students with homework</p>
        </div>
        <div className="story-hero-image">
          <StoryImage
            file="homework-path-home.png"
            shape="tilted"
            rotate={5}
            width={140}
            height={140}
            fallbackLabel="homework · path home"
          />
        </div>
      </div>
      <div className="page-header" style={{ marginTop: -8 }}>
        <div />
        {activeSession && (
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        )}
      </div>

      {!activeSession && (
        <div className="empty-state empty-state-modern">
          <span className="empty-icon-bubble icon-bubble-primary"><Icon name="homework" size={32} /></span>
          <h3>No Active Session</h3>
          <p>Start a session and run a quiz first</p>
        </div>
      )}

      {activeSession && studentReports.length === 0 && (
        <div className="empty-state empty-state-modern">
          <span className="empty-icon-bubble icon-bubble-warning"><Icon name="hourglass" size={32} /></span>
          <h3>Waiting for quiz submissions</h3>
          <p>Homework generates automatically after each student submits</p>
        </div>
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
                <span style={styles.chevron}><Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} /></span>
              </div>
            </div>

            {isOpen && hw && (
              <div style={styles.body} className="animate-in">
                {hw.conceptRecap && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}><Icon name="book-open" size={16} /> Concept Recap</h4>
                    <p style={styles.text}>{hw.conceptRecap}</p>
                  </div>
                )}

                {hw.followUpQuestions?.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}><Icon name="question" size={16} /> Follow-up Questions</h4>
                    <ol style={styles.list}>
                      {hw.followUpQuestions.map((q: string, i: number) => <li key={i} style={styles.listItem}>{q}</li>)}
                    </ol>
                  </div>
                )}

                {hw.revisionTasks?.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}><Icon name="pencil" size={16} /> Revision Tasks</h4>
                    <ul style={styles.list}>
                      {hw.revisionTasks.map((t: string, i: number) => <li key={i} style={styles.listItem}>{t}</li>)}
                    </ul>
                  </div>
                )}

                {hw.practiceChallenge && (
                  <div style={{ ...styles.section, background: 'var(--primary-glow)', borderRadius: 8, padding: 14 }}>
                    <h4 style={styles.sectionTitle}><Icon name="target" size={16} /> Practice Challenge</h4>
                    <p style={styles.text}>{hw.practiceChallenge}</p>
                  </div>
                )}

                {hw.askTeacherPrompts?.length > 0 && (
                  <div style={styles.section}>
                    <h4 style={styles.sectionTitle}><Icon name="hand-raised" size={16} /> Suggested Questions for Teacher</h4>
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
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' },
  text: { fontSize: 13, lineHeight: 1.7, marginTop: 6 },
  list: { paddingLeft: 20, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 },
  listItem: { fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }
}
