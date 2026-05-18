import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { quizApi, aiApi } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  topic: string
}

type Mode = 'manual' | 'ai'

export default function QuizManager() {
  const navigate = useNavigate()
  const { teacher, activeSession, setActiveQuizId, students } = useAppStore()
  const [mode, setMode] = useState<Mode>('ai')
  const [launched, setLaunched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Manual mode state
  const [manualQuestions, setManualQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: '', topic: '' }
  ])

  // AI Generate mode state
  const [aiTopic, setAiTopic] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState('Medium')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGenError, setAiGenError] = useState('')
  const [aiQuestions, setAiQuestions] = useState<any[] | null>(null)

  useWebSocket(activeSession?.id || null)

  // ─── Manual mode helpers ───────────────────────────────────────────────────
  const addQuestion = () =>
    setManualQuestions([...manualQuestions, { question: '', options: ['', '', '', ''], correctAnswer: '', topic: '' }])

  const removeQuestion = (i: number) =>
    setManualQuestions(manualQuestions.filter((_, idx) => idx !== i))

  const updateQ = (i: number, field: keyof QuizQuestion, value: any) =>
    setManualQuestions(manualQuestions.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))

  const updateOption = (qi: number, oi: number, value: string) => {
    const q = { ...manualQuestions[qi], options: [...manualQuestions[qi].options] }
    q.options[oi] = value
    setManualQuestions(manualQuestions.map((x, idx) => (idx === qi ? q : x)))
  }

  // ─── AI Generate mode helpers ──────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) { setAiGenError('Enter a topic first'); return }
    setAiGenerating(true)
    setAiGenError('')
    setAiQuestions(null)
    try {
      const data = await aiApi.generateTriviaPreview(aiTopic, aiDifficulty)
      if (data.trivia && Array.isArray(data.trivia) && data.trivia.length > 0) {
        setAiQuestions(data.trivia)
      } else {
        setAiGenError('AI returned an empty question set. Try a different topic.')
      }
    } catch (err: any) {
      setAiGenError(err.response?.data?.error || err.message || 'Generation failed')
    }
    setAiGenerating(false)
  }

  const updateAiQuestion = (i: number, field: string, value: any) => {
    if (!aiQuestions) return
    setAiQuestions(aiQuestions.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))
  }

  const updateAiOption = (qi: number, oi: number, value: string) => {
    if (!aiQuestions) return
    const q = { ...aiQuestions[qi], options: [...aiQuestions[qi].options] }
    q.options[oi] = value
    setAiQuestions(aiQuestions.map((x, idx) => (idx === qi ? q : x)))
  }

  // ─── Launch quiz ───────────────────────────────────────────────────────────
  const launchQuiz = async () => {
    if (!activeSession || !teacher) return setError('Start a session first')
    setLoading(true); setError('')

    try {
      if (mode === 'ai' && aiQuestions) {
        // AI mode: broadcast pre-generated questions as a quiz
        const payload = aiQuestions.map((q: any) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.options[q.answerIndex] || q.correctAnswer || q.options[0],
          topic: q.topic || aiTopic
        }))
        const res = await quizApi.start(activeSession.id, teacher.id, payload)
        setActiveQuizId(res.quizId)
        setLaunched(true)
      } else if (mode === 'manual') {
        const valid = manualQuestions.filter(
          q => q.question.trim() && q.correctAnswer.trim() && q.options.filter(Boolean).length >= 2
        )
        if (!valid.length) {
          setError('Add at least one complete question with 2+ options and a correct answer')
          setLoading(false)
          return
        }
        const res = await quizApi.start(activeSession.id, teacher.id, valid)
        setActiveQuizId(res.quizId)
        setLaunched(true)
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  const submittedStudents = students.filter(s => s.score !== undefined)

  // ─── Styles ───────────────────────────────────────────────────────────────
  const s = localStyles

  return (
    <div className="page-body animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Quiz Studio</h2>
          <p>
            {launched
              ? `Quiz live · ${submittedStudents.length}/${students.length} submitted`
              : 'Create and launch a quiz for your class'}
          </p>
        </div>
        {!launched && (
          <div className="flex gap-2">
            {mode === 'manual' && (
              <button className="btn btn-ghost" onClick={addQuestion}>+ Question</button>
            )}
            {mode === 'ai' && aiQuestions && (
              <button className="btn btn-ghost" onClick={() => setAiQuestions(null)}>↺ Regenerate</button>
            )}
            <button
              className="btn btn-primary"
              onClick={launchQuiz}
              disabled={loading || (mode === 'ai' && !aiQuestions) || !activeSession}
              title={!activeSession ? 'Start a session first' : ''}
            >
              {loading ? <span className="spinner" /> : '▶ Launch to Students'}
            </button>
          </div>
        )}
        {launched && (
          <span className="badge badge-success" style={{ fontSize: 13, padding: '6px 14px' }}>🟢 Quiz Live</span>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: 16, padding: '10px 14px', background: '#fff0f0', borderRadius: 8 }}>{error}</div>}

      {!launched ? (
        <>
          {/* Mode Tabs */}
          <div style={s.tabRow}>
            <button
              style={{ ...s.tab, ...(mode === 'ai' ? s.tabActive : {}) }}
              onClick={() => setMode('ai')}
            >
              🤖 AI Generate
            </button>
            <button
              style={{ ...s.tab, ...(mode === 'manual' ? s.tabActive : {}) }}
              onClick={() => setMode('manual')}
            >
              ✍️ Manual Build
            </button>
          </div>

          {/* ── AI MODE ── */}
          {mode === 'ai' && (
            <div>
              {!aiQuestions ? (
                <div className="card animate-in">
                  <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>Generate Quiz with AI</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                    Enter a topic and click Generate. The AI will produce multiple-choice questions that you can review and edit before launching.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Lesson Topic</label>
                      <input
                        className="input"
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                        placeholder="e.g. Photosynthesis, Gravity, Water Cycle"
                        onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, width: 150 }}>
                      <label className="form-label">Difficulty</label>
                      <select className="input" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                        <option value="Easy">Easy (Cl. 5-6)</option>
                        <option value="Medium">Medium (Cl. 7-8)</option>
                        <option value="Hard">Hard (Cl. 9-10)</option>
                      </select>
                    </div>
                  </div>

                  {aiGenError && (
                    <div style={{ color: 'var(--danger)', marginBottom: 14, padding: '10px', background: '#fff0f0', borderRadius: 8, fontSize: 14 }}>
                      ⚠️ {aiGenError}
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating || !aiTopic.trim()}
                    style={{ width: '100%', padding: '14px' }}
                  >
                    {aiGenerating ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span className="spinner" /> Gemma is generating questions… (this may take 30–90s)
                      </span>
                    ) : '🤖 Generate Questions'}
                  </button>
                </div>
              ) : (
                /* AI Questions Editor */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <span style={s.generatedBadge}>✅ {aiQuestions.length} questions generated</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 10 }}>
                        Edit below, then click "▶ Launch to Students"
                      </span>
                    </div>
                  </div>

                  {aiQuestions.map((q, qi) => (
                    <div key={qi} className="card animate-in" style={{ borderLeft: '4px solid var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>Question {qi + 1}</h4>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAiQuestions(aiQuestions.filter((_, i) => i !== qi))}>✕</button>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Question</label>
                        <input
                          className="input"
                          value={q.question}
                          onChange={e => updateAiQuestion(qi, 'question', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Answer Options (correct answer highlighted in green)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {q.options.map((opt: string, oi: number) => (
                            <input
                              key={oi}
                              className="input"
                              value={opt}
                              onChange={e => updateAiOption(qi, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                              style={{ borderColor: oi === q.answerIndex ? 'var(--success)' : undefined, background: oi === q.answerIndex ? '#f0fff4' : undefined }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Correct Answer Index (0 = first option)</label>
                        <select
                          className="input"
                          value={q.answerIndex}
                          onChange={e => updateAiQuestion(qi, 'answerIndex', parseInt(e.target.value))}
                          style={{ width: '100%' }}
                        >
                          {q.options.map((_: string, oi: number) => (
                            <option key={oi} value={oi}>Option {oi + 1}: {q.options[oi] || `(empty)`}</option>
                          ))}
                        </select>
                      </div>

                      {q.explanation && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9f4', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', borderLeft: '3px solid var(--success)' }}>
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    className="btn btn-ghost"
                    onClick={() => setAiQuestions([...aiQuestions, { question: '', options: ['', '', '', ''], answerIndex: 0, explanation: '', topic: aiTopic }])}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    + Add Question Manually
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL MODE ── */}
          {mode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {manualQuestions.map((q, qi) => (
                <div key={qi} className="card animate-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Question {qi + 1}</h4>
                    {manualQuestions.length > 1 && (
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
                        <input
                          key={oi} className="input" value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          style={{ borderColor: q.correctAnswer === opt && opt ? 'var(--success)' : undefined }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correct Answer (must match an option exactly)</label>
                    <input
                      className="input" value={q.correctAnswer}
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
          )}
        </>
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

const localStyles: Record<string, React.CSSProperties> = {
  tabRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    padding: '6px',
    background: 'var(--bg-secondary)',
    borderRadius: 12,
    width: 'fit-content',
  },
  tab: {
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  generatedBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#f0fff4',
    color: '#276749',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    border: '1px solid #9ae6b4',
  },
}
