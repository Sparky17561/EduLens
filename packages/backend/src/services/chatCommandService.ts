import { askQuestion, aiProvider, STRICT_RAG_SYSTEM } from './aiService'
import {
  retrieveRelevantContextWithCitations,
  hasActiveKnowledgeBase,
  formatCitationLabel,
  type Citation
} from './ragService'

export type ChatCommand =
  | 'ask' | 'generate' | 'hint' | 'cite' | 'summarize' | 'diagnose'
  | 'rephrase' | 'explain' | 'flashcards' | 'quizme' | 'teachme' | 'examples'
  | 'define' | 'compare' | 'practice'

export interface CommandResult {
  answer: string
  confidence: 'high' | 'medium' | 'low'
  confidenceNote?: string
  citations?: Citation[]
  metadata?: Record<string, unknown>
}

const CONCISE_RULES =
  `Rules: Be concise (2-4 sentences unless asked for more). NCERT Class 6-10 India. Simple language for children.
If the provided context does not cover the question, say you are not certain and suggest asking the teacher. Never invent facts.`

export function parseSlashCommand(input: string): { command: ChatCommand; arg: string } | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) return null
  const space = trimmed.indexOf(' ')
  const cmd = (space === -1 ? trimmed.slice(1) : trimmed.slice(1, space)).toLowerCase()
  const arg = space === -1 ? '' : trimmed.slice(space + 1).trim()
  const valid: ChatCommand[] = [
    'ask', 'generate', 'hint', 'cite', 'summarize', 'diagnose',
    'rephrase', 'explain', 'flashcards', 'quizme', 'teachme', 'examples',
    'define', 'compare', 'practice'
  ]
  if (!valid.includes(cmd as ChatCommand)) return null
  return { command: cmd as ChatCommand, arg }
}

function assessConfidence(
  answer: string,
  hasRag: boolean,
  ragScore: number
): { level: 'high' | 'medium' | 'low'; note?: string } {
  const lower = answer.toLowerCase()
  if (
    lower.includes("i'm not certain") ||
    lower.includes('ask your teacher') ||
    lower.includes('could not find') ||
    lower.includes('not in the provided')
  ) {
    return { level: 'low', note: "I'm not certain — ask your teacher to explain this one." }
  }
  if (hasRag && ragScore >= 0.15) return { level: 'high' }
  if (hasRag && ragScore > 0.05) {
    return { level: 'medium', note: 'Partial match from textbook — double-check with your teacher.' }
  }
  if (hasActiveKnowledgeBase() && !hasRag) {
    return { level: 'medium', note: 'General curriculum answer — verify with NCERT or your teacher.' }
  }
  return { level: 'medium', note: 'General curriculum answer — verify with NCERT.' }
}

function formatCitationFooter(citations: Citation[]): string {
  if (!citations.length) return ''
  return '\n\n' + citations.map(c => formatCitationLabel(c)).join('\n')
}

async function runPrompt(userPrompt: string, systemPrompt: string, temperature = 0.4): Promise<string> {
  const provider = aiProvider as { fastAsk?: (p: string, n?: number) => Promise<string> }
  if (provider.fastAsk) {
    const full = `${systemPrompt}\n\n${userPrompt}\n\nAnswer:`
    return provider.fastAsk(full, 400)
  }
  return askQuestion(userPrompt, systemPrompt, temperature)
}

export async function executeChatCommand(
  command: ChatCommand,
  arg: string,
  context?: { sessionTopic?: string; previousAnswer?: string; language?: string }
): Promise<CommandResult> {
  // Guard: /ask with no question — use session topic or prompt for input
  if (command === 'ask' && !arg.trim()) {
    if (context?.sessionTopic) {
      arg = `Explain the key concepts of: ${context.sessionTopic}`
    } else {
      return {
        answer: "Please type a question after /ask — for example: /ask What is photosynthesis?",
        confidence: 'low',
        citations: []
      }
    }
  }

  const topic = arg || context?.sessionTopic || 'the lesson topic'
  const langNote = context?.language && context.language !== 'en-US' && context.language !== 'English'
    ? `\n\nIMPORTANT: Answer in ${context.language} language.`
    : ''
  let answer = ''
  let citations: Citation[] = []
  let metadata: Record<string, unknown> = {}
  let ragScore = 0

  const usesRag = ['cite', 'summarize', 'ask', 'define', 'compare'].includes(command)
  const rag = usesRag
    ? await retrieveRelevantContextWithCitations(arg || topic, 2)
    : { context: '', citations: [] as Citation[], bestScore: 0 }

  citations = rag.citations
  const hasRag = rag.context.length > 0
  ragScore = rag.bestScore

  switch (command) {
    case 'ask':
    case 'cite':
    case 'define': {
      const sys = `${STRICT_RAG_SYSTEM}\n${CONCISE_RULES}`
      const prompt = hasRag
        ? `Use ONLY this context:\n${rag.context}\n\nQuestion: ${arg}\n\nShort grounded answer.${langNote}`
        : `Question: ${arg}\n\n${CONCISE_RULES}${langNote}`
      answer = await runPrompt(prompt, sys, 0.2)
      if (citations.length) answer += formatCitationFooter(citations)
      break
    }
    case 'compare':
      answer = await runPrompt(
        hasRag
          ? `Compare using context:\n${rag.context}\n\nCompare: ${arg}`
          : `Compare these concepts for a student: ${arg}`,
        `NCERT tutor. ${CONCISE_RULES} Use a short table or 3 bullets.`,
        0.3
      )
      if (citations.length) answer += formatCitationFooter(citations)
      break
    case 'hint':
      answer = await runPrompt(
        `Topic: ${topic}\nGive a HINT only (no full answer).`,
        `Socratic tutor. ${CONCISE_RULES}`,
        0.5
      )
      break
    case 'summarize':
      answer = await runPrompt(
        hasRag
          ? `Summarize in 4-5 bullets:\n${rag.context}`
          : `Summarize NCERT topic "${topic}" in 4-5 bullets.`,
        `Summarizer. ${CONCISE_RULES}`,
        0.3
      )
      if (citations.length) answer += formatCitationFooter(citations)
      break
    case 'diagnose':
      answer = await runPrompt(
        `Student confusion: "${topic}"\nName the misconception and one fix.`,
        `Diagnostician. ${CONCISE_RULES}`,
        0.4
      )
      break
    case 'rephrase':
      answer = await runPrompt(
        `Simplify for Class 6-10:\n${context?.previousAnswer || topic}`,
        `Rewriter. ${CONCISE_RULES}`,
        0.3
      )
      break
    case 'explain':
      answer = await runPrompt(
        `Explain: ${topic}\nDefinition + why it matters + one example (short).`,
        `NCERT tutor. ${CONCISE_RULES}`,
        0.4
      )
      break
    case 'practice':
      answer = await runPrompt(
        `Give 2 short practice problems on "${topic}" with answers at the end.`,
        `Practice generator. ${CONCISE_RULES}`,
        0.3
      )
      break
    case 'flashcards': {
      const fcRag = hasActiveKnowledgeBase()
        ? await retrieveRelevantContextWithCitations(arg || topic, 4)
        : { context: '', citations: [] as Citation[], bestScore: 0 }
      const fcCtx = fcRag.context
        ? `Based on this content:\n${fcRag.context}\n\n`
        : ''
      const raw = await runPrompt(
        `${fcCtx}Generate 6 flashcards for "${topic}". Each card: a concise question on the front and a short answer (max 20 words) on the back. Return ONLY a JSON array: [{"front":"...","back":"..."}].`,
        'JSON array only. No extra text.',
        0.3
      )
      try {
        const match = raw.match(/\[[\s\S]*\]/)
        const cards = JSON.parse(match ? match[0] : raw)
        metadata = { flashcards: cards }
        answer = (cards as { front: string; back: string }[])
          .map((c, i) => `**${i + 1}.** ${c.front}\n→ ${c.back}`)
          .join('\n\n')
      } catch {
        answer = raw
      }
      break
    }
    case 'quizme': {
      const raw = await runPrompt(
        `3 MCQs on "${topic}". JSON: [{"question":"...","options":["A","B","C","D"],"answerIndex":0}]`,
        'JSON only.',
        0.2
      )
      try {
        const match = raw.match(/\[[\s\S]*\]/)
        const qs = JSON.parse(match ? match[0] : raw)
        metadata = { quiz: qs }
        answer = (qs as { question: string }[]).map((q, i) => `${i + 1}. ${q.question}`).join('\n')
      } catch {
        answer = raw
      }
      break
    }
    case 'teachme':
      answer = await runPrompt(
        `Teach "${topic}": Hook → Core idea → Steps → 1 check question.`,
        `Teacher. ${CONCISE_RULES}`,
        0.4
      )
      break
    case 'examples':
      answer = await runPrompt(
        `3 real-world examples of "${topic}" for Indian students.`,
        `Examples. ${CONCISE_RULES}`,
        0.4
      )
      break
    default:
      answer = await runPrompt(arg, `Tutor. ${CONCISE_RULES}`)
  }

  answer = answer.replace(/^(Answer:|Response:)\s*/i, '').trim()
  const conf = assessConfidence(answer, hasRag, ragScore)
  const prefix =
    conf.level === 'low' ? `⚠️ ${conf.note}\n\n` :
    conf.level === 'medium' ? `ℹ️ ${conf.note}\n\n` : ''

  return {
    answer: prefix + answer,
    confidence: conf.level,
    confidenceNote: conf.note,
    citations: citations.length ? citations : undefined,
    metadata: Object.keys(metadata).length ? metadata : undefined
  }
}
