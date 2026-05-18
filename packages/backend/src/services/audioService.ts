import fs from 'fs'
import path from 'path'
import Groq from 'groq-sdk'

const LANG_VOICES: Record<string, string> = {
  'en-US': 'en-US-JennyNeural',
  'en': 'en-US-JennyNeural',
  'hi-IN': 'hi-IN-SwaraNeural',
  'hi': 'hi-IN-SwaraNeural',
  'ta-IN': 'ta-IN-PallaviNeural',
  'ta': 'ta-IN-PallaviNeural'
}

function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

/** Speech-to-text via Groq Whisper (multilingual Hindi/Tamil/English) */
export async function transcribeAudioBuffer(
  buffer: Buffer,
  mimeType: string,
  language?: string
): Promise<{ text: string; source: string }> {
  const client = getGroq()
  if (!client) {
    return { text: '', source: 'unavailable' }
  }

  const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm'

  try {
    const file = new File([buffer], `audio.${ext}`, { type: mimeType }) as any
    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: language?.startsWith('hi') ? 'hi' : language?.startsWith('ta') ? 'ta' : undefined,
      response_format: 'text'
    })
    const text = typeof transcription === 'string' ? transcription : (transcription as any).text || ''
    return { text: String(text).trim(), source: 'groq-whisper' }
  } catch (e: any) {
    console.warn('[audio] Groq transcribe failed:', e.message)
    return { text: '', source: 'error' }
  }
}

/** Text-to-speech via Microsoft Edge neural voices (no API key) */
export async function synthesizeSpeech(
  text: string,
  language = 'en-US'
): Promise<{ audioBase64: string; mimeType: string; source: string } | null> {
  const clean = text.replace(/[*#_`]/g, '').slice(0, 500)
  if (!clean.trim()) return null

  const voice = LANG_VOICES[language] || LANG_VOICES['en-US']

  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('edge-tts-node' as any)
    const tts = new MsEdgeTTS()
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const readable = tts.toStream(clean)
    const chunks: Buffer[] = []
    for await (const chunk of readable) {
      chunks.push(Buffer.from(chunk))
    }
    const buf = Buffer.concat(chunks)
    return {
      audioBase64: buf.toString('base64'),
      mimeType: 'audio/mpeg',
      source: 'edge-tts'
    }
  } catch (err) {
    console.warn('[audio] edge-tts failed, client should use expo-speech:', err)
    return null
  }
}

/** Optional: Ollama multimodal — if model supports audio in future */
export async function ollamaTranscribeIfSupported(_buffer: Buffer): Promise<string | null> {
  return null
}
