import { aiProvider } from './aiService'

export type QuestionType = 'mcq' | 'short_answer' | 'true_false' | 'match' | 'fill_blank'

export interface GeneratedQuestion {
  question: string
  questionType: QuestionType
  options: string[]
  correctAnswer: string
  answerIndex?: number
  topic: string
  bloomLevel: string
  explanation?: string
  matchPairs?: { left: string; right: string }[]
}

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

function extractJsonArray(raw: string): any[] | null {
  try {
    const cleaned = raw.replace(/```json|```/gi, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeQuestion(q: any, topic: string, bloom: string): GeneratedQuestion | null {
  if (!q?.question) return null
  const type = (q.questionType || q.type || 'mcq') as QuestionType
  let options = q.options || []
  let correctAnswer = q.correctAnswer || ''

  if (type === 'true_false') {
    options = ['True', 'False']
    correctAnswer = q.correctAnswer || options[q.answerIndex ?? 0] || 'True'
  } else if (type === 'match' && q.matchPairs) {
    options = q.matchPairs.map((p: any) => `${p.left} → ${p.right}`)
    correctAnswer = q.matchPairs.map((p: any) => `${p.left}:${p.right}`).join(';')
  } else if (type === 'fill_blank') {
    options = q.blanks || []
    correctAnswer = (q.blanks || q.correctBlanks || []).join('|')
  } else if (type === 'mcq' && typeof q.answerIndex === 'number') {
    correctAnswer = options[q.answerIndex] || correctAnswer
  }

  return {
    question: q.question,
    questionType: type,
    options,
    correctAnswer,
    answerIndex: q.answerIndex,
    topic: q.topic || topic,
    bloomLevel: q.bloomLevel || bloom,
    explanation: q.explanation,
    matchPairs: q.matchPairs
  }
}

export async function generateQuizQuestions(params: {
  topic: string
  difficulty?: string
  bloomLevel?: string
  count?: number
  questionTypes?: QuestionType[]
}): Promise<GeneratedQuestion[]> {
  const { topic, difficulty = 'Medium', bloomLevel = 'Understand', count = 5 } = params
  const types = params.questionTypes?.length
    ? params.questionTypes.join(', ')
    : 'mcq, short_answer, true_false, match, fill_blank'

  const prompt = `Create ${count} quiz questions for NCERT topic "${topic}" (difficulty: ${difficulty}, Bloom: ${bloomLevel}).
Use these types: ${types}.
JSON array ONLY:
[{
  "question":"...",
  "questionType":"mcq|short_answer|true_false|match|fill_blank",
  "options":["A","B","C","D"],
  "answerIndex":0,
  "correctAnswer":"...",
  "bloomLevel":"${bloomLevel}",
  "explanation":"...",
  "matchPairs":[{"left":"...","right":"..."}],
  "blanks":["answer1","answer2"]
}]`

  const provider = aiProvider as { fastAsk?: (p: string, n?: number) => Promise<string> }
  let raw: string
  if (provider.fastAsk) {
    raw = await provider.fastAsk(prompt, 1400)
  } else {
    raw = await aiProvider.ask(prompt, 'Output ONLY JSON array.', 0.2)
  }

  const arr = extractJsonArray(raw) || []
  const valid = arr
    .map(q => normalizeQuestion(q, topic, bloomLevel))
    .filter((q): q is GeneratedQuestion => q !== null)

  if (valid.length) return valid

  return [{
    question: `What is a key concept in ${topic}?`,
    questionType: 'mcq',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    answerIndex: 0,
    topic,
    bloomLevel,
    explanation: `Core idea of ${topic}`
  }]
}

export async function regenerateSingleQuestion(params: {
  topic: string
  questionType?: QuestionType
  bloomLevel?: string
  existingQuestion?: string
}): Promise<GeneratedQuestion> {
  const list = await generateQuizQuestions({
    topic: params.topic,
    bloomLevel: params.bloomLevel || 'Apply',
    count: 1,
    questionTypes: params.questionType ? [params.questionType] : ['mcq']
  })
  return list[0]
}

export { BLOOM_LEVELS }
