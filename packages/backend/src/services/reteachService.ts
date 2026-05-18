import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { aiProvider } from './aiService'

export interface ReteachPlan {
  id: string
  session_id: string
  topic: string
  lesson_summary: string
  concept_explanation: string
  exercises_json: string
  examples_json: string
  homework_json: string
  quiz_json: string
  status: string
  created_at: string
}

export async function generateReteachPlan(sessionId: string, topic: string): Promise<ReteachPlan> {
  const db = getDb()

  let plan = {
    lesson_summary: `15-minute reteach on ${topic}`,
    concept_explanation: `Core ideas of ${topic}.`,
    exercises: [] as string[],
    examples: [] as string[],
    homework: { followUpQuestions: [] as string[], revisionTasks: [] as string[] },
    quiz: [] as object[],
    discussion_questions: [] as string[],
    misconception_warning: '',
    worked_example: ''
  }

  try {
    if (await aiProvider.isAvailable()) {
      const raw = await aiProvider.ask(
        `Create a 15-minute mini-lesson plan for weak topic "${topic}" (NCERT Class 6-10).
JSON only:
{
  "lesson_summary":"one line agenda",
  "concept_explanation":"short explanation (max 120 words)",
  "worked_example":"one fully worked example",
  "discussion_questions":["q1","q2","q3"],
  "misconception_warning":"common mistake to warn about",
  "exercises":["activity1","activity2"],
  "examples":["example1"],
  "homework":{"followUpQuestions":["..."],"revisionTasks":["..."]},
  "quiz":[{"question":"...","options":["A","B","C","D"],"answerIndex":0}]
}`,
        'Curriculum designer. JSON only. Be concise.',
        0.3,
        true
      )
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        plan = { ...plan, ...parsed }
        if (parsed.discussion_questions) {
          plan.exercises = [
            ...(parsed.exercises || []),
            ...parsed.discussion_questions.map((q: string) => `Discuss: ${q}`)
          ]
        }
        if (parsed.misconception_warning) {
          plan.concept_explanation += `\n\n⚠️ Common misconception: ${parsed.misconception_warning}`
        }
        if (parsed.worked_example) {
          plan.examples = [parsed.worked_example, ...(parsed.examples || [])]
        }
      }
    }
  } catch {
    // defaults
  }

  const id = generateId('reteach')
  db.prepare(`
    INSERT INTO reteach_plans (id, session_id, topic, lesson_summary, concept_explanation, exercises_json, examples_json, homework_json, quiz_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(
    id, sessionId, topic,
    plan.lesson_summary,
    plan.concept_explanation,
    JSON.stringify(plan.exercises),
    JSON.stringify(plan.examples),
    JSON.stringify(plan.homework),
    JSON.stringify(plan.quiz)
  )

  return db.prepare(`SELECT * FROM reteach_plans WHERE id = ?`).get(id) as ReteachPlan
}

export function getReteachPlans(sessionId: string) {
  const db = getDb()
  return db.prepare(`SELECT * FROM reteach_plans WHERE session_id = ? ORDER BY created_at DESC`).all(sessionId)
}

export function updateReteachPlan(id: string, updates: Partial<{
  lesson_summary: string
  concept_explanation: string
  exercises: string[]
  examples: string[]
  homework: object
  quiz: object[]
  status: string
}>) {
  const db = getDb()
  const existing = db.prepare(`SELECT * FROM reteach_plans WHERE id = ?`).get(id) as ReteachPlan | undefined
  if (!existing) return null

  if (updates.lesson_summary) db.prepare(`UPDATE reteach_plans SET lesson_summary = ? WHERE id = ?`).run(updates.lesson_summary, id)
  if (updates.concept_explanation) db.prepare(`UPDATE reteach_plans SET concept_explanation = ? WHERE id = ?`).run(updates.concept_explanation, id)
  if (updates.exercises) db.prepare(`UPDATE reteach_plans SET exercises_json = ? WHERE id = ?`).run(JSON.stringify(updates.exercises), id)
  if (updates.examples) db.prepare(`UPDATE reteach_plans SET examples_json = ? WHERE id = ?`).run(JSON.stringify(updates.examples), id)
  if (updates.homework) db.prepare(`UPDATE reteach_plans SET homework_json = ? WHERE id = ?`).run(JSON.stringify(updates.homework), id)
  if (updates.quiz) db.prepare(`UPDATE reteach_plans SET quiz_json = ? WHERE id = ?`).run(JSON.stringify(updates.quiz), id)
  if (updates.status) db.prepare(`UPDATE reteach_plans SET status = ? WHERE id = ?`).run(updates.status, id)

  return db.prepare(`SELECT * FROM reteach_plans WHERE id = ?`).get(id)
}

export async function generateReteachFromWeakTopics(sessionId: string, weakTopics: string[]): Promise<ReteachPlan[]> {
  const topics = weakTopics.slice(0, 3)
  const plans: ReteachPlan[] = []
  for (const topic of topics) {
    plans.push(await generateReteachPlan(sessionId, topic))
  }
  return plans
}
