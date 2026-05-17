import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { quizApi } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  topic: string
}

export default function QuizManager() {
  const { teacher, activeSession, setActiveQuizId, activeQuizId, students } = useAppStore()
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: '', topic: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [error, setError] = useState('')
  useWebSocket(activeSession?.id || null)

  const addQuestion = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: '', topic: '' }])
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i))

  const updateQ = (i: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }
  const updateOption = (qi: number, oi: number, value: string) => {
    const q = { ...questions[qi], options: [...questions[qi].options] }
    q.options[oi] = value
    setQuestions(questions.map((x, idx) => idx === qi ? q : x))
  }

  const launchQuiz = async () => {
    if (!activeSession || !teacher) return setError('Start a session first')
    const valid = questions.filter(q => q.question.trim() && q.correctAnswer.trim() && q.options.filter(Boolean).length >= 2)
    if (!valid.length) return setError('Add at least one complete question with 2+ options and a correct answer')
    setLoading(true); setError('')
    try {
      const res = await quizApi.start(activeSession.id, teacher.id, valid)
      setActiveQuizId(res.quizId)
      setLaunched(true)
    } catch (e: any) { setError(e.response?.data?.error || e.message) }
    setLoading(false)
  }

  const submittedStudents = students.filter(s => s.score !== undefined)

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Quiz Manager</h2>
          <p>{launched ? `Quiz live · ${submittedStudents.length}/${students.length} submitted` : 'Build and launch a quiz'}</p>
        </div>
        {!launched ? (
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={addQuestion}>+ Question</button>
            <button className="btn btn-primary" onClick={launchQuiz} disabled={loading}>
              {loading ? <span className="spinner" /> : '▶ Launch Quiz'}
            </button>
          </div>
        ) : (
          <span className="badge badge-success" style={{ fontSize: 13, padding: '6px 14px' }}>🟢 Quiz Live</span>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {!launched ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, qi) => (
            <div key={qi} className="card animate-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ color: 'var(--text-secondary)' }}>Question {qi + 1}</h4>
                {questions.length > 1 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => removeQuestion(qi)}>✕</button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Question</label>
                  <input className="input" value={q.question} onChange={e => updateQ(qi, 'question', e.target.value)} placeholder="e.g. What is 2/3 + 1/3?" />
                </div>
                <div className="form-group" style={{ width: 140 }}>
                  <label className="form-label">Topic</label>
                  <input className="input" value={q.topic} onChange={e => updateQ(qi, 'topic', e.target.value)} placeholder="e.g. Fractions" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Answer Options</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {q.options.map((opt, oi) => (
                    <input key={oi} className="input" value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      style={{ borderColor: q.correctAnswer === opt && opt ? 'var(--success)' : undefined }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correct Answer (must match an option exactly)</label>
                <input className="input" value={q.correctAnswer}
                  onChange={e => updateQ(qi, 'correctAnswer', e.target.value)}
                  placeholder="Type the exact correct answer"
                  style={{ borderColor: q.correctAnswer ? 'var(--success)' : undefined }}
                />
              </div>
            </div>
          ))}

          <button className="btn btn-ghost" onClick={addQuestion} style={{ alignSelf: 'flex-start' }}>
            + Add Question
          </button>
        </div>
      ) : (
        /* Live results */
        <div>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Submitted</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{submittedStudents.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Waiting</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{students.length - submittedStudents.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Class Avg</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {submittedStudents.length > 0
                  ? `${Math.round(submittedStudents.reduce((a, s) => a + (s.percentage || 0), 0) / submittedStudents.length)}%`
                  : '—'}
              </div>
            </div>
          </div>

          {submittedStudents.length === 0 ? (
            <div className="empty-state">
              <div className="spinner" style={{ width: 32, height: 32 }} />
              <h3>Waiting for submissions…</h3>
              <p>Students are answering the quiz</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {submittedStudents.sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).map(s => (
                <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, minWidth: 32, textAlign: 'center', color: 'var(--text-primary)' }}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Weak: {s.weakTopics?.join(', ') || 'None'} · Strong: {s.strongTopics?.join(', ') || 'None'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: (s.percentage || 0) >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                      {Math.round(s.percentage || 0)}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
