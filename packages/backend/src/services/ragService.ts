import fs from 'fs'
import path from 'path'
import { getDb } from '../db/database'
import { generateId } from '../utils/codeGenerator'
import { embedTexts, cosineSimilarityVectors, isEmbeddingAvailable } from './embeddingService'

if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    }
  }
  if (!(global as any).ImageData) {
    (global as any).ImageData = class ImageData {
      width: number; height: number; data: Uint8ClampedArray
      constructor(width: number, height: number) {
        this.width = width; this.height = height
        this.data = new Uint8ClampedArray(width * height * 4)
      }
    }
  }
  if (!(global as any).Path2D) {
    (global as any).Path2D = class Path2D {}
  }
}

const { PDFParse } = require('pdf-parse')

export interface Citation {
  chunkId: string
  source: string
  chapter: string
  page: number
  label: string
}

export interface RagChunk {
  id: string
  kbId: string
  text: string
  tokens: Set<string>
  vector: Map<string, number>
  embedding?: number[]
  source: string
  chapter: string
  page: number
}

let activeChunks: RagChunk[] = []
let activeKnowledgeBaseId = ''
let activeKnowledgeBaseName = ''

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  return new Set(words.filter(w => w.length > 2))
}

function buildTfVector(tokens: Set<string>): Map<string, number> {
  const vec = new Map<string, number>()
  for (const t of tokens) vec.set(t, (vec.get(t) || 0) + 1)
  return vec
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0
  for (const [k, v] of a) {
    normA += v * v
    if (b.has(k)) dot += v * (b.get(k) || 0)
  }
  for (const v of b.values()) normB += v * v
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function jaccardScore(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = new Set([...a, ...b]).size
  return union > 0 ? inter / union : 0
}

function estimatePage(text: string, chunkIndex: number, charsPerPage = 2000): number {
  const pageMatch = text.match(/page\s*(\d+)/i)
  if (pageMatch) return parseInt(pageMatch[1], 10)
  return Math.max(1, Math.floor((chunkIndex * 500) / charsPerPage) + 1)
}

function extractChapter(text: string): string {
  const ch = text.match(/chapter\s*(\d+|[IVXLC]+)/i)
  return ch ? `Chapter ${ch[1]}` : 'General'
}

function chunkTextWithMeta(
  rawText: string,
  kbId: string,
  sourceName: string
): RagChunk[] {
  const text = rawText.replace(/\n+/g, ' ')
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: RagChunk[] = []
  let currentChunk = ''
  let chunkIndex = 0

  const flush = () => {
    if (currentChunk.trim().length < 20) return
    const tokens = tokenize(currentChunk)
    chunks.push({
      id: generateId('chunk'),
      kbId,
      text: currentChunk.trim(),
      tokens,
      vector: buildTfVector(tokens),
      source: sourceName,
      chapter: extractChapter(currentChunk),
      page: estimatePage(currentChunk, chunkIndex)
    })
    chunkIndex++
    currentChunk = ''
  }

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > 480) {
      flush()
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }
  flush()
  return chunks
}

async function embedChunkBatch(chunks: RagChunk[]): Promise<void> {
  if (!(await isEmbeddingAvailable())) return
  const texts = chunks.map(c => c.text)
  const vectors = await embedTexts(texts)
  vectors.forEach((emb, i) => {
    if (emb) chunks[i].embedding = emb
  })
}

function persistChunks(kbId: string, chunks: RagChunk[]) {
  const db = getDb()
  db.prepare(`DELETE FROM rag_chunks WHERE kb_id = ?`).run(kbId)
  const insertWithEmb = db.prepare(`
    INSERT INTO rag_chunks (id, kb_id, text, source, chapter, page, vector_json, tokens_json, embedding_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertPlain = db.prepare(`
    INSERT INTO rag_chunks (id, kb_id, text, source, chapter, page, vector_json, tokens_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const tx = db.transaction((list: RagChunk[]) => {
    for (const c of list) {
      if (c.embedding?.length) {
        insertWithEmb.run(
          c.id, c.kbId, c.text, c.source, c.chapter, c.page,
          JSON.stringify([...c.vector.entries()]),
          JSON.stringify([...c.tokens]),
          JSON.stringify(c.embedding)
        )
      } else {
        insertPlain.run(
          c.id, c.kbId, c.text, c.source, c.chapter, c.page,
          JSON.stringify([...c.vector.entries()]),
          JSON.stringify([...c.tokens])
        )
      }
    }
  })
  tx(chunks)
}

function loadChunksFromDb(kbId: string): RagChunk[] {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM rag_chunks WHERE kb_id = ?`).all(kbId) as any[]
  return rows.map(r => {
    let embedding: number[] | undefined
    try {
      if (r.embedding_json) embedding = JSON.parse(r.embedding_json)
    } catch { /* ignore */ }
    return {
      id: r.id,
      kbId: r.kb_id,
      text: r.text,
      tokens: new Set(JSON.parse(r.tokens_json || '[]')),
      vector: new Map(JSON.parse(r.vector_json || '[]')),
      embedding,
      source: r.source,
      chapter: r.chapter,
      page: r.page
    }
  })
}

export async function processPdfForStorage(filePath: string, kbId: string, name: string): Promise<number> {
  const dataBuffer = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: dataBuffer })
  const data = await parser.getText()
  const chunks = chunkTextWithMeta(data.text, kbId, name)
  await embedChunkBatch(chunks)
  persistChunks(kbId, chunks)
  activeChunks = chunks
  activeKnowledgeBaseId = kbId
  activeKnowledgeBaseName = name
  console.log(`[RAG] Indexed "${name}" — ${chunks.length} chunks (embeddings: ${chunks.filter(c => c.embedding).length})`)
  return chunks.length
}

export async function loadKnowledgeBase(filePath: string, name: string, kbId?: string): Promise<number> {
  const db = getDb()
  let resolvedKbId = kbId

  if (!resolvedKbId) {
    const kb = db.prepare(`SELECT id FROM knowledge_bases WHERE file_path = ?`).get(filePath) as any
    resolvedKbId = kb?.id
  }

  if (resolvedKbId) {
    const stored = loadChunksFromDb(resolvedKbId)
    if (stored.length > 0) {
      activeChunks = stored
      activeKnowledgeBaseId = resolvedKbId
      activeKnowledgeBaseName = name
      return stored.length
    }
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[RAG] Knowledge base file not found: ${filePath}`)
    return 0
  }

  const dataBuffer = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: dataBuffer })
  const data = await parser.getText()
  const id = resolvedKbId || generateId('kb')
  activeChunks = chunkTextWithMeta(data.text, id, name)
  if (resolvedKbId) persistChunks(resolvedKbId, activeChunks)
  activeKnowledgeBaseId = id
  activeKnowledgeBaseName = name
  console.log(`[RAG] Loaded "${name}" — ${activeChunks.length} chunks`)
  return activeChunks.length
}

export function hasActiveKnowledgeBase(): boolean {
  return activeChunks.length > 0
}

export function activateKnowledgeBaseFromDb(kbId: string, name: string): number {
  activeChunks = loadChunksFromDb(kbId)
  activeKnowledgeBaseId = kbId
  activeKnowledgeBaseName = name
  console.log(`[RAG] Activated KB "${name}" from DB — ${activeChunks.length} chunks`)
  return activeChunks.length
}

export function formatCitationLabel(c: Citation): string {
  return `📖 From ${c.source}${c.chapter ? `, ${c.chapter}` : ''}, p.${c.page}`
}

export async function retrieveRelevantContextWithCitations(
  question: string,
  topK = 2
): Promise<{ context: string; citations: Citation[]; bestScore: number }> {
  if (activeChunks.length === 0) return { context: '', citations: [], bestScore: 0 }

  const questionTokens = tokenize(question)
  const questionVector = buildTfVector(questionTokens)
  if (questionTokens.size === 0) return { context: '', citations: [], bestScore: 0 }

  const embedReady = activeChunks.filter(c => c.embedding?.length).length > activeChunks.length * 0.5
  let queryEmbedding: number[] | null = null
  if (embedReady) {
    const [emb] = await embedTexts([question])
    queryEmbedding = emb
  }

  const scored = activeChunks.map(chunk => {
    let score = 0
    if (queryEmbedding && chunk.embedding?.length) {
      score = cosineSimilarityVectors(queryEmbedding, chunk.embedding)
    } else {
      const vecScore = cosineSimilarity(questionVector, chunk.vector)
      const jacScore = jaccardScore(questionTokens, chunk.tokens)
      score = vecScore * 0.55 + jacScore * 0.45
    }
    return { chunk, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const minScore = embedReady ? 0.35 : 0.05
  const top = scored.filter(s => s.score > minScore).slice(0, topK)
  if (!top.length) return { context: '', citations: [], bestScore: 0 }

  const bestScore = top[0].score
  const citations: Citation[] = top.map(({ chunk }) => ({
    chunkId: chunk.id,
    source: chunk.source,
    chapter: chunk.chapter,
    page: chunk.page,
    label: formatCitationLabel({
      chunkId: chunk.id,
      source: chunk.source,
      chapter: chunk.chapter,
      page: chunk.page,
      label: ''
    })
  }))

  const contextText = top.map(({ chunk }, i) =>
    `[${i + 1}] (${citations[i].label})\n${chunk.text}`
  ).join('\n\n')

  return {
    context: `\n--- Context from "${activeKnowledgeBaseName}" ---\n${contextText}\n---\n`,
    citations,
    bestScore
  }
}

export async function retrieveRelevantContext(question: string, topK = 3): Promise<string> {
  return (await retrieveRelevantContextWithCitations(question, topK)).context
}

export function clearRagContext() {
  activeChunks = []
  activeKnowledgeBaseId = ''
  activeKnowledgeBaseName = ''
}

export function getActiveKnowledgeBaseName(): string {
  return activeKnowledgeBaseName
}
