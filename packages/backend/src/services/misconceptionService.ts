import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { aiProvider } from './aiService'

export interface MisconceptionRecord {
  id: string
  session_id: string
  student_id: string | null
  student_name: string | null
  topic: string
  category: string
  pattern: string
  explanation: string
  suggestion: string
  wrong_answer: string | null
  correct_answer: string | null
  created_at: string
}

async function analyzeOneWrong(params: {
  question: string
  studentAnswer: string
  correctAnswer: string
  topic: string
}): Promise<{
  topic: string
  category: string
  pattern: string
  explanation: string
  suggestion: string
} | null> {
  try {
    if (!(await aiProvider.isAvailable())) return null
    const raw = await aiProvider.ask(
      `A student chose "${params.studentAnswer}" for this MCQ:
"${params.question}"
Correct answer: "${params.correctAnswer}"
Topic: ${params.topic}

What misconception does choosing "${params.studentAnswer}" reveal?
JSON only: {"category":"short name","pattern":"what they confused","explanation":"1-2 sentences","suggestion":"how to fix"}`,
      'Misconception analyst for children. JSON only.',
      0.2,
      true
    )
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    return {
      topic: params.topic,
      category: parsed.category || 'Conceptual confusion',
      pattern: parsed.pattern || `Chose "${params.studentAnswer}"`,
      explanation: parsed.explanation || '',
      suggestion: parsed.suggestion || 'Reteach with a visual example.'
    }
  } catch {
    return null
  }
}

export async function analyzeWrongAnswers(params: {
  sessionId: string
  studentId?: string
  studentName?: string
  wrongAnswers: Array<{
    question: string
    studentAnswer: string
    correctAnswer: string
    topic: string
  }>
}): Promise<MisconceptionRecord[]> {
  if (!params.wrongAnswers.length) return []

  const db = getDb()
  const results: MisconceptionRecord[] = []

  for (const w of params.wrongAnswers.slice(0, 6)) {
    let m = await analyzeOneWrong(w)
    if (!m) {
      m = {
        topic: w.topic,
        category: 'Conceptual confusion',
        pattern: `Selected "${w.studentAnswer}" instead of correct option`,
        explanation: `This may indicate confusion about ${w.topic}, especially around "${w.studentAnswer}".`,
        suggestion: `Reteach ${w.topic} contrasting "${w.studentAnswer}" with the correct idea.`
      }
    }

    const id = generateId('misc')
    db.prepare(`
      INSERT INTO misconceptions (id, session_id, student_id, student_name, topic, category, pattern, explanation, suggestion, wrong_answer, correct_answer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, params.sessionId, params.studentId || null, params.studentName || null,
      m.topic, m.category, m.pattern, m.explanation, m.suggestion,
      w.studentAnswer, w.correctAnswer
    )
    results.push({
      id,
      session_id: params.sessionId,
      student_id: params.studentId || null,
      student_name: params.studentName || null,
      topic: m.topic,
      category: m.category,
      pattern: m.pattern,
      explanation: m.explanation,
      suggestion: m.suggestion,
      wrong_answer: w.studentAnswer,
      correct_answer: w.correctAnswer,
      created_at: new Date().toISOString()
    })
  }

  return results
}

export function getSessionMisconceptions(sessionId: string): MisconceptionRecord[] {
  const db = getDb()
  return db.prepare(
    `SELECT * FROM misconceptions WHERE session_id = ? ORDER BY created_at DESC`
  ).all(sessionId) as MisconceptionRecord[]
}
