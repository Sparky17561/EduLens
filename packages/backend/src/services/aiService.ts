import 'dotenv/config'

// ─────────────────────────────────────────────────────────────────────────────
// Provider Interface — one interface, multiple backends
// ─────────────────────────────────────────────────────────────────────────────
export interface AIProvider {
  ask(userPrompt: string, systemPrompt?: string): Promise<string>
  isAvailable(): Promise<boolean>
  providerName(): string
}

export interface HomeworkOutput {
  followUpQuestions: string[]
  revisionTasks: string[]
  conceptRecap: string
  practiceChallenge: string
  askTeacherPrompts: string[]
}

export interface LessonOutline {
  title: string
  coreConcepts: string[]
  explanationSteps: string[]
  commonMisconceptions: string[]
  quizAngles: string[]
  visualAidSuggestion: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ★ ACTIVE PROVIDER: Ollama (local GGUF)
// ─────────────────────────────────────────────────────────────────────────────
class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
    this.model   = process.env.OLLAMA_MODEL || 'edulens'
  }

  providerName(): string {
    return `Ollama · ${this.model} (local)`
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) return false
      const data: any = await res.json()
      // Check if our model is loaded
      const models: string[] = (data.models || []).map((m: any) => m.name)
      return models.some((m) => m.startsWith(this.model))
    } catch {
      return false
    }
  }

  async ask(userPrompt: string, systemPrompt?: string): Promise<string> {
    const fullPrompt = systemPrompt
      ? `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`
      : userPrompt

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 512,
          stop: ['User:', '\n\nUser']
        }
      }),
      signal: AbortSignal.timeout(120_000) // 2-min timeout for large models
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama error ${res.status}: ${err}`)
    }

    const data: any = await res.json()
    return (data.response || '').trim()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP PROVIDER: Groq cloud (uncomment to swap back)
// ─────────────────────────────────────────────────────────────────────────────
// import Groq from 'groq-sdk'
// class GroqProvider implements AIProvider {
//   private client: Groq | null = null
//   private model: string
//   constructor() {
//     this.model = process.env.GROQ_MODEL || 'llama3-70b-8192'
//     if (process.env.GROQ_API_KEY) {
//       this.client = new Groq({ apiKey: process.env.GROQ_API_KEY })
//     }
//   }
//   providerName() { return 'Groq (cloud)' }
//   async isAvailable() { return this.client !== null }
//   async ask(userPrompt: string, systemPrompt?: string): Promise<string> {
//     if (!this.client) return '[AI unavailable] Set GROQ_API_KEY in .env'
//     const completion = await this.client.chat.completions.create({
//       model: this.model,
//       messages: [
//         { role: 'system', content: systemPrompt || 'You are EduLens AI, a helpful teaching assistant.' },
//         { role: 'user', content: userPrompt }
//       ],
//       max_tokens: 1024, temperature: 0.7
//     })
//     return completion.choices[0]?.message?.content || '[No response]'
//   }
// }

// ─────────────────────────────────────────────────────────────────────────────
// SWAP LINE — change one line to switch providers
// ─────────────────────────────────────────────────────────────────────────────
export const aiProvider: AIProvider = new OllamaProvider()
// export const aiProvider: AIProvider = new GroqProvider()  // ← cloud fallback

// ─────────────────────────────────────────────────────────────────────────────
// System prompts
// ─────────────────────────────────────────────────────────────────────────────
const STUDENT_ASK_SYSTEM =
  `You are EduLens, a patient AI tutor for Class 6-10 students in India following the NCERT curriculum.
Answer clearly in 3-5 sentences using simple language. Reason step by step before answering.
Give one real-world example if helpful.`

const TEACHER_GENERATE_SYSTEM =
  `You are EduLens AI, an expert curriculum designer for Indian school education (NCERT).
Always respond with valid JSON matching the requested schema exactly.`

const HOMEWORK_SYSTEM =
  `You are EduLens AI, an educational assessment expert.
Generate personalized homework based on a student's quiz performance and weak areas.
Respond ONLY with valid JSON — no markdown, no explanation outside the JSON.`

// ─────────────────────────────────────────────────────────────────────────────
// High-level service functions
// ─────────────────────────────────────────────────────────────────────────────

export async function askQuestion(question: string): Promise<string> {
  return aiProvider.ask(question, STUDENT_ASK_SYSTEM)
}

export async function generateLessonOutline(topic: string): Promise<LessonOutline> {
  const prompt =
    `Generate a structured lesson outline for the topic: "${topic}" (NCERT curriculum, Class 6-10).
Respond with JSON in this exact format:
{
  "title": "...",
  "coreConcepts": ["...", "..."],
  "explanationSteps": ["Step 1: ...", "Step 2: ..."],
  "commonMisconceptions": ["...", "..."],
  "quizAngles": ["...", "..."],
  "visualAidSuggestion": "..."
}
Respond with JSON only.`

  const raw = await aiProvider.ask(prompt, TEACHER_GENERATE_SYSTEM)
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    // extract first JSON object in case model adds text before/after
    const match = cleaned.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : cleaned) as LessonOutline
  } catch {
    return {
      title: topic,
      coreConcepts: [`Core concepts of ${topic}`],
      explanationSteps: ['Introduce the topic', 'Explain with examples', 'Summarise key points'],
      commonMisconceptions: [`Common misconceptions about ${topic}`],
      quizAngles: [`Test understanding of ${topic}`],
      visualAidSuggestion: `Draw a diagram illustrating ${topic}`
    }
  }
}

export async function generateHomework(params: {
  studentName: string
  weakTopics: string[]
  wrongAnswers: Array<{ question: string; studentAnswer: string; correctAnswer: string; topic: string }>
  score: number
  total: number
}): Promise<HomeworkOutput> {
  const { studentName, weakTopics, wrongAnswers, score, total } = params

  const wrongSummary = wrongAnswers
    .slice(0, 5)
    .map(q => `- Q: "${q.question}" | Student said: "${q.studentAnswer}" | Correct: "${q.correctAnswer}" (Topic: ${q.topic})`)
    .join('\n')

  const prompt =
    `Student: ${studentName}
Quiz score: ${score}/${total}
Weak topics: ${weakTopics.join(', ') || 'General'}
Wrong answers:
${wrongSummary || 'None provided'}

Generate personalized homework as JSON:
{
  "followUpQuestions": ["question1", "question2", "question3"],
  "revisionTasks": ["task1", "task2"],
  "conceptRecap": "Brief plain-English recap of the weak concepts",
  "practiceChallenge": "One challenge problem they should try",
  "askTeacherPrompts": ["Suggested question 1 to ask teacher", "Suggested question 2"]
}
Return ONLY the JSON object.`

  try {
    const raw = await aiProvider.ask(prompt, HOMEWORK_SYSTEM)
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : cleaned) as HomeworkOutput
  } catch {
    return generateFallbackHomework(weakTopics, score, total)
  }
}

export async function generateAnalyticsSummary(params: {
  totalStudents: number
  avgScore: number
  weakTopics: string[]
  topicBreakdown: Record<string, { avg: number; count: number }>
}): Promise<string> {
  const prompt =
    `Classroom quiz results:
- Students: ${params.totalStudents}
- Average score: ${params.avgScore.toFixed(1)}%
- Class-wide weak topics: ${params.weakTopics.join(', ') || 'None'}
- Topic breakdown: ${JSON.stringify(params.topicBreakdown)}

Write a 3-sentence teacher analytics summary identifying key class gaps and next steps.`

  try {
    return await aiProvider.ask(
      prompt,
      'You are an educational data analyst. Be concise, specific, and actionable.'
    )
  } catch {
    return `Class average is ${params.avgScore.toFixed(1)}%. Weak areas: ${params.weakTopics.join(', ') || 'none identified'}. Consider reviewing these topics before the next session.`
  }
}

// Template fallback — works even when Ollama is not running
export function generateFallbackHomework(weakTopics: string[], score: number, total: number): HomeworkOutput {
  const topicsStr = weakTopics.length > 0 ? weakTopics.join(' and ') : 'the quiz topics'
  return {
    followUpQuestions: [
      `Explain the main concept of ${topicsStr} in your own words.`,
      `Give one real-world example related to ${topicsStr}.`,
      `What formula or rule applies to ${topicsStr}?`
    ],
    revisionTasks: [
      `Re-read your NCERT notes on ${topicsStr} and highlight key definitions.`,
      `Solve 5 practice problems related to ${topicsStr} from your textbook.`
    ],
    conceptRecap: `You scored ${score}/${total}. Focus on reviewing ${topicsStr}, paying attention to definitions, step-by-step solutions, and practice problems.`,
    practiceChallenge: `Create your own problem related to ${topicsStr} and solve it step by step.`,
    askTeacherPrompts: [
      `Can you explain ${topicsStr} with a different example?`,
      `What is the most common mistake students make with ${topicsStr}?`
    ]
  }
}
