/**
 * Ollama embedding API with TF-IDF fallback signals in ragService.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'

let embedModelAvailable: boolean | null = null

export async function isEmbeddingAvailable(): Promise<boolean> {
  if (embedModelAvailable !== null) return embedModelAvailable
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) {
      embedModelAvailable = false
      return false
    }
    const data: any = await res.json()
    const names: string[] = (data.models || []).map((m: any) => m.name)
    embedModelAvailable = names.some(n => n.includes(EMBED_MODEL.split(':')[0]) || n.includes('embed'))
    if (!embedModelAvailable && names.length > 0) {
      const fallback = names.find(n => n.includes('nomic') || n.includes('mxbai') || n.includes('embed'))
      if (fallback) {
        process.env.OLLAMA_EMBED_MODEL = fallback
        embedModelAvailable = true
      }
    }
    return embedModelAvailable
  } catch {
    embedModelAvailable = false
    return false
  }
}

export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  const available = await isEmbeddingAvailable()
  if (!available) return texts.map(() => null)

  const model = process.env.OLLAMA_EMBED_MODEL || EMBED_MODEL
  const results: (number[] | null)[] = []

  for (const text of texts) {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: text.slice(0, 2000) }),
        signal: AbortSignal.timeout(60_000)
      })
      if (!res.ok) {
        results.push(null)
        continue
      }
      const data: any = await res.json()
      if (Array.isArray(data.embedding) && data.embedding.length > 0) {
        results.push(data.embedding as number[])
      } else {
        results.push(null)
      }
    } catch {
      results.push(null)
    }
  }
  return results
}

export function cosineSimilarityVectors(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
