import React, { useState, useRef } from 'react'
import { Pressable, Modal, View, Text, TextInput, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import Svg, { Path } from 'react-native-svg'
import { colors, radius, spacing, type } from '../theme/tokens'
import api from '../api/client'

interface Props {
  onText: (text: string) => void
  onVoiceResponse?: (data: {
    question: string
    answer: string
    audioBase64?: string
    citations?: unknown[]
    confidence?: string
  }) => void
  sessionTopic?: string
  language?: string
}

export default function VoiceInput({ onText, onVoiceResponse, sessionTopic, language = 'hi-IN' }: Props) {
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const recRef = useRef<Audio.Recording | null>(null)

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Microphone', 'Allow microphone access to ask doubts by voice.')
        return
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      recRef.current = rec
      setRecording(true)
    } catch (e: any) {
      Alert.alert('Recording failed', e.message)
    }
  }

  const stopAndSend = async () => {
    if (!recRef.current) return
    setRecording(false)
    setBusy(true)
    try {
      await recRef.current.stopAndUnloadAsync()
      const uri = recRef.current.getURI()
      recRef.current = null

      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any })

        if (onVoiceResponse) {
          const res = await api.post('/ai/voice-ask', {
            question: draft,
            language,
            sessionTopic,
            audioBase64: base64,
            audioMime: 'audio/m4a'
          }, { timeout: 120000 }).catch(() => null)

          if (res?.data?.answer) {
            onVoiceResponse({
              question: res.data.question || draft,
              answer: res.data.answer,
              audioBase64: res.data.audio?.audioBase64,
              citations: res.data.citations,
              confidence: res.data.confidence
            })
            setOpen(false)
            setDraft('')
            setBusy(false)
            return
          }
        }

        // Fallback: try text transcription
        try {
          const form = new FormData()
          form.append('audio', { uri, name: 'voice.m4a', type: 'audio/m4a' } as any)
          form.append('language', language)
          const res = await api.post('/ai/transcribe', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
          })
          const transcribed = res.data?.text
          if (transcribed?.trim()) {
            onText(transcribed.trim())
            setOpen(false)
            setDraft('')
            setBusy(false)
            return
          }
        } catch {}
      }

      // Final fallback: use whatever the user typed in the draft field
      if (draft.trim()) {
        onText(draft.trim())
        setOpen(false)
        setDraft('')
      } else {
        Alert.alert(
          'Voice not available',
          'Speech recognition requires a Groq API key on the server. Type your question in the box below and tap "Use typed text".'
        )
      }
    } catch (e: any) {
      // If draft is available, use it silently rather than showing an error
      if (draft.trim()) {
        onText(draft.trim())
        setOpen(false)
        setDraft('')
      } else {
        Alert.alert('Voice failed', e.response?.data?.error || e.message || 'Type your question instead.')
      }
    }
    setBusy(false)
  }

  const handleRecordToggle = async () => {
    if (recording) {
      await stopAndSend()
    } else {
      await startRecording()
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={busy}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.skyDeep} />
        ) : (
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
              d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8"
              stroke={colors.skyDeep}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.title}>Ask in {language.startsWith('hi') ? 'Hindi' : 'your language'}</Text>
            <Text style={styles.hint}>Hold record, speak your doubt, then release to send to AI.</Text>

            <Pressable
              onPress={handleRecordToggle}
              disabled={busy}
              style={[styles.recordBtn, recording && styles.recordActive]}
            >
              <Text style={styles.recordText}>{recording ? '🔴 Tap to stop & send' : '🎤 Tap to start recording'}</Text>
            </Pressable>

            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Or type here…"
              multiline
            />
            <Pressable style={styles.done} onPress={() => { onText(draft); setOpen(false) }} disabled={!draft.trim()}>
              <Text style={styles.doneText}>Use typed text</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.skyWash,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.sky,
  },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...type.bodyBold, fontSize: 17, color: colors.ink },
  hint: { ...type.caption, color: colors.inkSoft },
  recordBtn: {
    backgroundColor: colors.coralWash,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.coral,
  },
  recordActive: { backgroundColor: colors.coralLight },
  recordText: { ...type.bodyBold, color: colors.coralDeep },
  input: {
    minHeight: 60,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...type.body,
    color: colors.ink,
  },
  done: {
    backgroundColor: colors.skyDeep,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  doneText: { ...type.bodyBold, color: colors.white },
})
