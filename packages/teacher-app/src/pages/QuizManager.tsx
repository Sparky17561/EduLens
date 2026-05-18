import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { quizApi, aiApi } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import { useToast } from '../components/Toast'
import { Icon } from '../components/Icon'
import { StoryImage } from '../components/StoryImage'

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const QUESTION_TYPES = [
  { id: 'mcq', label: 'MCQ' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'true_false', label: 'True / False' },
  { id: 'match', label: 'Match' },
  { id: 'fill_blank', label: 'Fill Blanks' }
]

export default function QuizManager() {
  const { teacher, activeSession, setActiveQuizId, students } = useAppStore()
  const { toast } = useToast()
  const [launched, setLaunched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState('Medium')
  const [bloomLevel, setBloomLevel] = useState('Understand')
  const [questionCount, setQuestionCount] = useState(5)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq', 'true_false', 'short_answer'])
  const [aiGenerating, setAiGenerating] = useState(false)
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null)
  const [aiQuestions, setAiQuestions] = useState<any[] | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)

  useWebSocket(activeSession?.id || null)

  const toggleType = (id: string) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) { setError('Enter a topic'); return }
    setAiGenerating(true)
    setError('')
    setAiQuestions(null)
    try {
      const data = await aiApi.generateTriviaPreview(aiTopic, aiDifficulty, questionCount, bloomLevel, selectedTypes)
      setAiQuestions(data.trivia || [])
      toast('Quiz generated successfully', 'success')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
      toast('Generation failed', 'error')
    }
    setAiGenerating(false)
  }

  const regenerateOne = async (idx: number) => {
    if (!aiQuestions) return
    setRegeneratingIdx(idx)
    try {
      const q = aiQuestions[idx]
      const data = await aiApi.regenerateQuestion(aiTopic, q.questionType, q.bloomLevel || bloomLevel)
      const updated = [...aiQuestions]
      updated[idx] = data.question
      setAiQuestions(updated)
      toast('Question regenerated', 'success')
    } catch {
      toast('Regenerate failed', 'error')
    }
    setRegeneratingIdx(null)
  }

  const launchQuiz = async () => {
    if (!activeSession || !teacher || !aiQuestions?.length) return
    setLoading(true)
    setError('')
    try {
      const payload = aiQuestions.map((q: any) => ({
        question: q.question,
        questionType: q.questionType || 'mcq',
        options: q.options || [],
        correctAnswer: q.correctAnswer || (q.options && q.answerIndex != null ? q.options[q.answerIndex] : ''),
        topic: q.topic || aiTopic,
        bloomLevel: q.bloomLevel || bloomLevel,
        matchPairs: q.matchPairs,
        blanks: q.blanks
      }))
      const res = await quizApi.start(activeSession.id, teacher.id, payload)
      setActiveQuizId(res.quizId)
      setLaunched(true)
      toast('Quiz launched to students', 'success')
    } catch (e: any) {
      setError(e.response?.data?.error || e.message)
    }
    setLoading(false)
  }

  const submittedStudents = students.filter(s => s.score !== undefined)

  if (!activeSession) {
    return (
      <motionPage>
        <div className="empty-state empty-state-modern">
          <span className="empty-icon-bubble icon-bubble-primary">
            <Icon name="quiz" size={32} />
          </span>
          <h3>Start a session first</h3>
          <p>Go to Dashboard and start a live session before launching a quiz.</p>
        </div>
      </motionPage>
    )
  }

  return (
    <motionPage>
      <div className="story-hero story-hero-compact">
        <div className="story-hero-text">
          <span className="kicker">QUIZ STUDIO</span>
          <h2 style={{ margin: '4px 0' }}>{launched ? `${submittedStudents.length}/${students.length} submitted` : 'Seeds of curiosity'}</h2>
          <p className="subhead">{launched ? 'Watching submissions land in real time.' : 'AI-first quiz builder — generate, edit, launch.'}</p>
        </div>
        <div className="story-hero-image">
          <StoryImage
            file="quiz-seeds-of-curiosity.png"
            shape="lopsided"
            rotate={6}
            width={140}
            height={140}
            fallbackLabel="quiz · seeds"
          />
        </div>
      </div>

      <div className="page-header" style={{ marginTop: -8 }}>
        <div />
        {!launched && aiQuestions && (
          <button className="btn btn-primary" onClick={launchQuiz} disabled={loading}>
            {loading ? <span className="spinner" /> : <><Icon name="play" size={14} /> Launch to Students</>}
          </button>
        )}
        {launched && <span className="badge badge-success"><Icon name="check" size={12} /> Quiz Live</span>}
      </div>

      {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}

      {!launched && !aiQuestions && (
        <div className="card" style={{ maxWidth: 640 }}>
          <h3 style={{ marginBottom: 8 }}>Generate with AI</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Default flow — AI creates mixed question types aligned to Bloom taxonomy.</p>

          <motionGrid2>
            <div className="form-group">
              <label className="form-label">Topic</label>
              <input className="input" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Photosynthesis" onKeyDown={e => e.key === 'Enter' && handleAiGenerate()} />
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="input" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                <option value="Easy">Easy (Cl. 5-6)</option>
                <option value="Medium">Medium (Cl. 7-8)</option>
                <option value="Hard">Hard (Cl. 9-10)</option>
              </select>
            </div>
          </motionGrid2>

          <motionGrid2 style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Bloom Level</label>
              <select className="input" value={bloomLevel} onChange={e => setBloomLevel(e.target.value)}>
                {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Question Count</label>
              <input className="input" type="number" min={3} max={10} value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 5)} />
            </div>
          </motionGrid2>

          <div style={{ marginTop: 14 }}>
            <label className="form-label">Question Types</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {QUESTION_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-sm ${selectedTypes.includes(t.id) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggleType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 14 }} onClick={handleAiGenerate} disabled={aiGenerating || !aiTopic.trim()}>
            {aiGenerating ? <><span className="spinner" /> Generating (30–90s)…</> : <><Icon name="sparkle" size={16} /> Generate Quiz</>}
          </button>
        </div>
      )}

      {!launched && aiQuestions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <motionBar>
            <span className="badge badge-success">{aiQuestions.length} questions ready</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setAiQuestions(null)}><Icon name="x" size={12} /> Start Over</button>
            <button className="btn btn-ghost btn-sm" onClick={handleAiGenerate}><Icon name="refresh" size={12} /> Regenerate All</button>
          </motionBar>
          {aiQuestions.map((q, qi) => (
            <QuestionEditorCard
              key={qi}
              q={q}
              qi={qi}
              isOpen={editIdx === qi}
              onToggle={() => setEditIdx(editIdx === qi ? null : qi)}
              onRegenerate={() => regenerateOne(qi)}
              regenerating={regeneratingIdx === qi}
              onChange={(field, val) => setAiQuestions(aiQuestions.map((x, i) => i === qi ? { ...x, [field]: val } : x))}
              onDelete={() => setAiQuestions(aiQuestions.filter((_, i) => i !== qi))}
            />
          ))}
        </div>
      )}

      {launched && (
        <div className="grid-3">
          <div className="stat-card"><motionStatLabel>Submitted</motionStatLabel><motionStatVal color="var(--success)">{submittedStudents.length}</motionStatVal></div>
          <div className="stat-card"><motionStatLabel>Waiting</motionStatLabel><motionStatVal color="var(--warning)">{students.length - submittedStudents.length}</motionStatVal></div>
          <div className="stat-card"><motionStatLabel>Class Avg</motionStatLabel><motionStatVal>{submittedStudents.length ? `${Math.round(submittedStudents.reduce((a, s) => a + (s.percentage || 0), 0) / submittedStudents.length)}%` : '—'}</motionStatVal></div>
        </div>
      )}
    </motionPage>
  )
}

function QuestionEditorCard({ q, qi, isOpen, onToggle, onRegenerate, regenerating, onChange, onDelete }: any) {
  const typeLabel = QUESTION_TYPES.find(t => t.id === (q.questionType || 'mcq'))?.label || 'MCQ'
  return (
    <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={onToggle}>
        <div>
          <span className="badge badge-primary" style={{ marginRight: 8 }}>Q{qi + 1}</span>
          <span className="badge badge-muted">{typeLabel}</span>
          <span className="badge badge-muted" style={{ marginLeft: 6 }}>{q.bloomLevel || 'Understand'}</span>
          <p style={{ marginTop: 8, fontSize: 14 }}>{q.question}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onRegenerate() }} disabled={regenerating} title="Regenerate">
            {regenerating ? '…' : <Icon name="refresh" size={14} />}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onDelete() }} title="Delete">
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div className="form-group">
            <label className="form-label">Question</label>
            <textarea className="textarea" value={q.question} onChange={e => onChange('question', e.target.value)} rows={2} />
          </div>
          {(q.questionType === 'mcq' || q.questionType === 'true_false' || !q.questionType) && q.options?.map((opt: string, oi: number) => (
            <input key={oi} className="input" style={{ marginBottom: 6 }} value={opt} onChange={e => {
              const opts = [...q.options]; opts[oi] = e.target.value; onChange('options', opts)
            }} placeholder={`Option ${oi + 1}`} />
          ))}
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">Correct Answer</label>
            <input className="input" value={q.correctAnswer || ''} onChange={e => onChange('correctAnswer', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

function motionPage({ children }: { children: React.ReactNode }) {
  return <div className="page-body animate-in">{children}</div>
}
function motionGrid2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...style }}>{children}</div>
}
function motionBar({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>{children}</div>
}
function motionStatLabel({ children }: { children: React.ReactNode }) {
  return <div className="stat-label">{children}</div>
}
function motionStatVal({ children, color }: { children: React.ReactNode; color?: string }) {
  return <div className="stat-value" style={{ color }}>{children}</div>
}
