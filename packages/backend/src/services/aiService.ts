import 'dotenv/config'

// ─────────────────────────────────────────────────────────────────────────────
// Provider Interface — one interface, multiple backends
// ─────────────────────────────────────────────────────────────────────────────
export interface AIProvider {
  ask(userPrompt: string, systemPrompt?: string, temperature?: number, jsonMode?: boolean): Promise<string>
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
      const models: string[] = (data.models || []).map((m: any) => m.name)
      
      let foundModel = false
      if (models.some((m) => m.startsWith(this.model))) {
        foundModel = true
      } else {
        const q4Model = models.find(m => m.toLowerCase().includes('q4'))
        const gemmaModel = models.find(m => m.startsWith('gemma'))
        
        if (q4Model) {
          this.model = q4Model
          foundModel = true
        } else if (gemmaModel) {
          this.model = gemmaModel
          foundModel = true
        }
      }

      if (foundModel) {
        // Query model details to determine if it's offloaded to GPU
        try {
          const showRes = await fetch(`${this.baseUrl}/api/show`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model })
          })
          if (showRes.ok) {
            const showData: any = await showRes.json()
            const format = showData.details?.format || 'unknown'
            console.log(`[AI HW] Active Model: ${this.model} (${format})`)
            
            // Note: True CUDA detection usually requires looking at Ollama server logs
            // or testing inference speed. This logs the model structure as a baseline.
            console.log(`[AI HW] Target inference acceleration: CUDA (fallback to CPU)`)
          }
        } catch (err) {
          // Ignore
        }
        return true
      }
      
      // Or any first available model
      if (models.length > 0) {
        this.model = models[0]
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async ask(userPrompt: string, systemPrompt?: string, temperature: number = 0.7, jsonMode?: boolean): Promise<string> {
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
          temperature: temperature,
          num_predict: 1024,
          stop: ['User:', '\n\nUser']
        }
      }),
      signal: AbortSignal.timeout(180_000) // 3-min timeout for large models
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Ollama error ${res.status}: ${err}`)
    }

    const data: any = await res.json()
    return (data.response || '').trim()
  }

  // Lightweight fast call for trivia — tiny context, tiny output, no system prompt
  async fastAsk(prompt: string, maxTokens: number = 256): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: maxTokens, top_p: 0.9 }
      }),
      signal: AbortSignal.timeout(180_000) // 3-min hard cap per attempt
    })
    if (!res.ok) throw new Error(`Ollama error ${res.status}`)
    const data: any = await res.json()
    return (data.response || '').trim()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP PROVIDER: Groq cloud (dynamic selection enabled)
// ─────────────────────────────────────────────────────────────────────────────
import Groq from 'groq-sdk'
class GroqProvider implements AIProvider {
  private client: Groq | null = null
  private model: string
  constructor() {
    this.model = process.env.GROQ_MODEL || 'llama3-70b-8192'
    if (process.env.GROQ_API_KEY) {
      this.client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    }
  }
  providerName() { return 'Groq (cloud)' }
  async isAvailable() { return this.client !== null }
  async ask(userPrompt: string, systemPrompt?: string, temperature: number = 0.7, jsonMode?: boolean): Promise<string> {
    if (!this.client) return '[AI unavailable] Set GROQ_API_KEY in .env'
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: systemPrompt || 'You are EduLens AI, a helpful teaching assistant.' },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1024, temperature: temperature
    })
    return completion.choices[0]?.message?.content || '[No response]'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC SELECTION — Switches automatically if GROQ_API_KEY is found in .env
// ─────────────────────────────────────────────────────────────────────────────
export const aiProvider: AIProvider = process.env.GROQ_API_KEY
  ? new GroqProvider()
  : new OllamaProvider()

// ─────────────────────────────────────────────────────────────────────────────
// System prompts
// ─────────────────────────────────────────────────────────────────────────────
const STUDENT_ASK_SYSTEM =
  `You are EduLens, a patient AI tutor for Class 6-10 students in India following the NCERT curriculum.
Answer clearly in 3-5 sentences using simple language. Reason step by step before answering.
Give one real-world example if helpful.`

export const STRICT_RAG_SYSTEM =
  `You are EduLens, a precise and highly faithful AI tutor.
Answer the student's question based strictly on the provided Context.
Follow these rules strictly:
1. Answer ONLY using the facts directly mentioned in the Context. If the context does not explicitly provide the answer, say: "I could not find the exact answer in the provided textbook or curriculum material." and do not speculate.
2. DO NOT make up any facts, examples, sections, or details that are not in the Context.
3. Keep your tone direct, educational, and fully grounded in the provided text. Never assume or extrapolate.`

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

export async function askQuestion(question: string, systemPrompt?: string, temperature?: number): Promise<string> {
  return aiProvider.ask(question, systemPrompt || STUDENT_ASK_SYSTEM, temperature)
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

  const raw = await aiProvider.ask(prompt, TEACHER_GENERATE_SYSTEM, 0.5, true)
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
    const raw = await aiProvider.ask(prompt, HOMEWORK_SYSTEM, 0.3, true)
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : cleaned) as HomeworkOutput
  } catch (err) {
    console.warn('[aiService] generateHomework AI or Parse failed:', err)
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
    ]
  }
}

// Helper to extract and parse a JSON array from raw model output
function extractJsonArray(raw: string): any[] | null {
  try {
    const cleaned = raw.replace(/```json|```/gi, '').trim()
    // Try to find array anywhere in the response
    const match = cleaned.match(/\[[\s\S]*?\]/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export async function generateTrivia(topic: string, difficulty: string = 'Medium'): Promise<{ question: string; options: string[]; answerIndex: number; explanation: string }[]> {
  console.info(`[generateTrivia] Starting AI generation for topic: "${topic}"...`)

  // Use fastAsk on Ollama, or standard ask on Groq/other cloud providers
  const isFastProvider = (aiProvider as any).fastAsk !== undefined

  // === ATTEMPT 1: 3 questions, single-object approach (faster for tiny models) ===
  for (let i = 1; i <= 3; i++) {
    const numQ = 4 - i  // 3, 2, then 1 question
    const maxTok = numQ === 3 ? 1200 : numQ === 2 ? 800 : 400

    const prompt = `Write ${numQ} multiple choice quiz question${numQ > 1 ? 's' : ''} about "${topic}" for school students.
Output ONLY a valid JSON array. Start with [ and end with ]. No other text.
[
  {"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}
]`

    try {
      console.info(`[generateTrivia] Attempt ${i}: Requesting ${numQ} question(s) (maxTok=${maxTok})...`)
      let raw: string
      if (isFastProvider) {
        raw = await (aiProvider as any).fastAsk(prompt, maxTok)
      } else {
        raw = await aiProvider.ask(prompt, 'Output ONLY a JSON array. No explanation.', 0.1)
      }
      console.info(`[generateTrivia] Raw response: ${raw.slice(0, 200)}`)
      const result = extractJsonArray(raw)
      if (result) {
        // Validate structure of at least the first question
        const valid = result.filter((q: any) =>
          typeof q.question === 'string' &&
          Array.isArray(q.options) && q.options.length >= 2 &&
          typeof q.answerIndex === 'number'
        )
        if (valid.length > 0) {
          console.info(`[generateTrivia] ✅ Success on attempt ${i}: ${valid.length} valid questions.`)
          return valid
        }
      }
      console.warn(`[generateTrivia] Attempt ${i}: Parsed but no valid questions in response.`)
    } catch (err: any) {
      console.warn(`[generateTrivia] Attempt ${i} failed: ${err.message || err}`)
    }
  }

  // Final fallback — throw so the route returns a 500 to the teacher UI
  throw new Error(`AI could not generate trivia for "${topic}". Try a shorter/simpler topic or check Ollama is running.`)
}

export async function generateFlashcards(topic: string): Promise<{ front: string; back: string }[]> {
  const prompt = `Create 8 study flashcards for the topic: "${topic}" (NCERT curriculum, Class 6-10).
Respond with JSON ONLY in this exact format:
[
  { "front": "Question or term on the front of the card", "back": "Clear, concise answer or definition" }
]
`
  try {
    const raw = await aiProvider.ask(prompt, TEACHER_GENERATE_SYSTEM, 0.4, true)
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    const cards = JSON.parse(match ? match[0] : cleaned)
    return Array.isArray(cards) ? cards : []
  } catch (err) {
    console.warn('[aiService] generateFlashcards AI or Parse failed:', err)
    return [
      { front: `What is the main theme of ${topic}?`, back: `${topic} covers fundamental principles related to this subject area.` },
      { front: `Name one key concept in ${topic}.`, back: `A core concept is directly related to the main topic.` },
      { front: `Give an example of ${topic} in real life.`, back: `Real-world applications of ${topic} include everyday phenomena.` }
    ]
  }
}

