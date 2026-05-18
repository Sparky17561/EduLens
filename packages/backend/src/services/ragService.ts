import fs from 'fs'
import path from 'path'

// Polyfill global canvas-like items for pdf-parse/pdf.js compatibility in Electron Node env
if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    }
  }
  if (!(global as any).ImageData) {
    (global as any).ImageData = class ImageData {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    }
  }
  if (!(global as any).Path2D) {
    (global as any).Path2D = class Path2D {}
  }
}

const { PDFParse } = require('pdf-parse')

// Simple in-memory RAG store (active session knowledge)
interface Chunk {
  id: string
  text: string
  tokens: Set<string>
}

let documentChunks: Chunk[] = []
let activeKnowledgeBaseName = ''

// Simple tokenizer
function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  return new Set(words.filter(w => w.length > 2))
}

function chunkText(rawText: string): Chunk[] {
  const text = rawText.replace(/\n/g, ' ')
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: Chunk[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > 500) {
      if (currentChunk.trim().length > 0) {
        chunks.push({
          id: Math.random().toString(36).substr(2, 9),
          text: currentChunk.trim(),
          tokens: tokenize(currentChunk)
        })
      }
      currentChunk = sentence
    } else {
      currentChunk += ' ' + sentence
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: Math.random().toString(36).substr(2, 9),
      text: currentChunk.trim(),
      tokens: tokenize(currentChunk)
    })
  }
  return chunks
}

// Process a PDF and store its chunks persistently to the knowledge folder
export async function processPdfForStorage(filePath: string): Promise<number> {
  try {
    const dataBuffer = fs.readFileSync(filePath)
    const parser = new PDFParse({ data: dataBuffer })
    const data = await parser.getText()
    const chunks = chunkText(data.text)
    return chunks.length
  } catch (error) {
    console.error('Error processing PDF for RAG:', error)
    throw new Error('Failed to process PDF')
  }
}

// Load a saved PDF file into active session memory
export async function loadKnowledgeBase(filePath: string, name: string): Promise<number> {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[RAG] Knowledge base file not found: ${filePath}`)
      return 0
    }
    const dataBuffer = fs.readFileSync(filePath)
    const parser = new PDFParse({ data: dataBuffer })
    const data = await parser.getText()
    documentChunks = chunkText(data.text)
    activeKnowledgeBaseName = name
    console.log(`[RAG] Loaded "${name}" — ${documentChunks.length} chunks`)
    return documentChunks.length
  } catch (error) {
    console.error('Error loading knowledge base:', error)
    throw new Error('Failed to load knowledge base')
  }
}

export function retrieveRelevantContext(question: string, topK: number = 3): string {
  if (documentChunks.length === 0) return ''

  const questionTokens = tokenize(question)
  if (questionTokens.size === 0) return ''

  const scoredChunks = documentChunks.map(chunk => {
    let intersection = 0
    for (const token of questionTokens) {
      if (chunk.tokens.has(token)) intersection++
    }
    const union = new Set([...questionTokens, ...chunk.tokens]).size
    const score = intersection / union
    return { ...chunk, score }
  })

  scoredChunks.sort((a, b) => b.score - a.score)
  const topChunks = scoredChunks.filter(c => c.score > 0).slice(0, topK)
  if (topChunks.length === 0) return ''

  const contextText = topChunks.map(c => c.text).join('\n\n')
  return `\n--- Relevant Context from "${activeKnowledgeBaseName}" ---\n${contextText}\n----------------------------------------------------------\n`
}

export function clearRagContext() {
  documentChunks = []
  activeKnowledgeBaseName = ''
}

export function getActiveKnowledgeBaseName(): string {
  return activeKnowledgeBaseName
}
