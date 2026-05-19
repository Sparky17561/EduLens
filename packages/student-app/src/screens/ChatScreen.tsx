import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { chatApi, aiApi } from '../api/client'

const SLASH_CMDS = ['ask','generate','hint','cite','summarize','diagnose','rephrase','explain','flashcards','quizme','teachme','examples','define','compare','practice']
function isCmd(t: string) { return t.startsWith('/') && SLASH_CMDS.includes(t.slice(1).split(/\s/)[0]?.toLowerCase() || '') }
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import { ScreenScaffold, OfflineBadge } from '../components/ui'
import VoiceInput from '../components/VoiceInput'
import { CitationBlock } from '../components/CitationBlock'
import { ScreenHeader } from '../components/widgets'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Chat'>

export default function ChatScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, messages, addMessage, setActiveQuiz, sessionEnded, offlineQueue, queueMessage, clearQueue, ttsLanguage, setTtsLanguage, pendingQuiz, setPendingQuiz } = useSessionStore()
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const listRef = useRef<FlatList>(null)

  const toggleSpeech = (msgId: string, text: string) => {
    if (speakingId === msgId) {
      Speech.stop()
      setSpeakingId(null)
    } else {
      Speech.stop()
      setSpeakingId(msgId)
      Speech.speak(text, {
        language: ttsLanguage,
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null)
      })
    }
  }

  useEffect(() => {
    return () => {
      Speech.stop()
    }
  }, [])

  // Auto-sync offline queue when reconnected to an active session
  useEffect(() => {
    if (!sessionEnded && session && student && offlineQueue.length > 0) {
      console.log('Syncing offline queue...', offlineQueue.length)
      const queue = [...offlineQueue]
      clearQueue()
      queue.forEach(q => {
        if (isCmd(q.content)) {
          aiApi.command({ sessionId: session.id, senderId: student.id, senderName: student.name, role: 'student', input: q.content, sessionTopic: session.topic, language: ttsLanguage }).catch(e => console.warn(e))
        } else if (q.content.startsWith('/ask ')) {
          aiApi.ask(session.id, student.id, student.name, q.content.slice(5), session.topic, ttsLanguage).catch(e => console.warn(e))
        } else {
          chatApi.send(session.id, student.id, student.name, q.content).catch(e => console.warn(e))
        }
      })
    }
  }, [sessionEnded, session, student, offlineQueue])

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true })
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.senderId === 'ai' || lastMsg.role === 'ai') {
        setAiLoading(false)
      }
    }
  }, [messages])

  const send = async () => {
    if (!input.trim() || !student) return
    const text = input.trim()
    setInput('')

    // Display locally immediately
    addMessage({
      id: `local-${Date.now()}`,
      senderId: student.id,
      senderName: student.name,
      role: 'student',
      content: text,
      messageType: text.startsWith('/ask ') ? 'ask' : 'chat',
      createdAt: new Date().toISOString()
    })

    // If offline / session ended, just queue it
    if (sessionEnded || !session) {
      queueMessage(text)
      if (text.startsWith('/ask ')) {
        setTimeout(() => {
          addMessage({
            id: `offline-${Date.now()}`,
            senderId: 'ai',
            senderName: 'EduLens AI',
            role: 'ai',
            content: "You're offline! 🏠 I've saved this question. I'll automatically process it and give you the answer the moment you reconnect to your teacher's network.",
            messageType: 'ask',
            createdAt: new Date().toISOString()
          })
        }, 500)
      }
      return
    }

    if (isCmd(text)) {
      setAiLoading(true)
      aiApi.command({ sessionId: session.id, senderId: student.id, senderName: student.name, role: 'student', input: text, sessionTopic: session.topic, language: ttsLanguage }).catch(e => console.warn('[AI]', e))
      return
    }

    if (text.startsWith('/ask ')) {
      setAiLoading(true)
      aiApi.ask(session.id, student.id, student.name, text.slice(5), session.topic, ttsLanguage).catch(e => console.warn('[AI]', e))
      return
    }

    try { await chatApi.send(session.id, student.id, student.name, text) } catch {}
  }

  const playServerTts = async (audioBase64: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${audioBase64}` },
        { shouldPlay: true }
      )
      sound.setOnPlaybackStatusUpdate(st => {
        if (st.isLoaded && st.didJustFinish) sound.unloadAsync()
      })
    } catch {
      /* fallback handled by caller */
    }
  }

  const handleVoiceResponse = async (data: {
    question: string
    answer: string
    audioBase64?: string
    citations?: unknown[]
    confidence?: string
  }) => {
    if (!student) return
    setAiLoading(false)
    const now = new Date().toISOString()
    addMessage({
      id: `voice-q-${Date.now()}`,
      senderId: student.id,
      senderName: student.name,
      role: 'student',
      content: data.question,
      messageType: 'ask',
      createdAt: now
    })
    addMessage({
      id: `voice-a-${Date.now()}`,
      senderId: 'ai',
      senderName: 'EduLens AI',
      role: 'ai',
      content: data.answer,
      messageType: 'ask',
      citations: data.citations as any,
      ...(data.confidence === 'high' || data.confidence === 'medium' || data.confidence === 'low'
        ? { confidence: data.confidence }
        : {}),
      createdAt: now
    })
    if (data.audioBase64) {
      await playServerTts(data.audioBase64)
    } else {
      Speech.speak(data.answer, { language: ttsLanguage, rate: 0.85 })
    }
  }

  return (
    <ScreenScaffold tint="morning" scroll={false}>
      <ScreenHeader
        title="Class Chat"
        kicker="ASK QUESTIONS & SYNC LIVE"
        onBack={() => nav.goBack()}
      />

      {/* Quiz pending banner */}
      {pendingQuiz && (
        <Pressable
          onPress={() => { setPendingQuiz(false); nav.navigate('Quiz') }}
          style={styles.quizBanner}
        >
          <Text style={styles.quizBannerText}>🎯 Quiz is ready! Tap here to start</Text>
          <Text style={styles.quizBannerSub}>Your teacher launched a quiz</Text>
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: msg }) => {
            const isMine = msg.senderId === student?.id
            const isAI = msg.role === 'ai'
            const isQuiz = msg.messageType === 'quiz' || (msg.messageType === 'system' && msg.content.includes('"quizId"'))

            if (isQuiz) {
              let quizData: any = null
              try {
                quizData = JSON.parse(msg.content)
              } catch {
                quizData = null
              }

              if (quizData) {
                return (
                  <View style={styles.quizWrapper}>
                    <View style={styles.quizCard}>
                      <Text style={styles.quizLabel}>📝 CLASS QUIZ BROADCAST</Text>
                      <Text style={styles.quizTitle}>Interactive Trivia is Live!</Text>
                      <Text style={styles.quizInfo}>
                        Gemma generated 5 custom questions on this lesson topic.
                      </Text>
                      
                      <Pressable
                        style={({ pressed }) => [
                          styles.quizBtn,
                          { transform: [{ scale: pressed ? 0.98 : 1 }] }
                        ]}
                        onPress={() => {
                          setActiveQuiz({ quizId: quizData.quizId, questions: quizData.questions })
                          nav.navigate('Quiz')
                        }}
                      >
                        <Text style={styles.quizBtnText}>Start Quiz Now</Text>
                      </Pressable>
                    </View>
                  </View>
                )
              }
            }

            return (
              <View style={[styles.msgRow, isMine && styles.msgRowRight]}>
                {!isMine && (
                  <View style={[styles.avatar, isAI ? styles.avatarAI : styles.avatarOther]}>
                    <Text style={styles.avatarText}>
                      {isAI ? '🦉' : msg.senderName[0]}
                    </Text>
                  </View>
                )}
                <View style={{ maxWidth: '75%' }}>
                  {!isMine && <Text style={styles.senderName}>{msg.senderName}</Text>}
                  <View style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : isAI ? styles.bubbleAI : styles.bubbleOther
                  ]}>
                    <Text style={[styles.bubbleText, isMine && { color: colors.white }]}>
                      {msg.content}
                    </Text>
                    {isAI && (
                      <CitationBlock
                        citations={msg.citations}
                        confidence={msg.confidence}
                        confidenceNote={msg.confidenceNote}
                      />
                    )}
                  </View>
                  {isAI && (
                    <Pressable 
                      style={styles.listenBtn} 
                      onPress={() => toggleSpeech(msg.id, msg.content)}
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                        <Path d="M12 3 v18 M17 8 L22 12 L17 16"
                              stroke={colors.skyDeep} strokeWidth="2.5" fill="none"
                              strokeLinecap="round" strokeLinejoin="round" />
                        <Path d="M12 6 Q7 6 7 12 Q7 18 12 18"
                              stroke={colors.skyDeep} strokeWidth="2.5" fill="none" />
                      </Svg>
                      <Text style={styles.listenText}>
                        {speakingId === msg.id ? 'Stop Narration' : 'Narrate Offline'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet.</Text>
              <Text style={styles.emptySub}>Type a message to the class or use '/ask [question]' to consult Gemma AI offline.</Text>
            </View>
          }
          ListFooterComponent={
            aiLoading ? (
              <View style={styles.thinking}>
                <ActivityIndicator size="small" color={colors.skyDeep} />
                <Text style={styles.thinkingText}>Gemma is preparing grounded facts...</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.langRow}>
          {(['en-US', 'hi-IN'] as const).map(lang => (
            <Pressable
              key={lang}
              onPress={() => setTtsLanguage(lang)}
              style={[styles.langChip, ttsLanguage === lang && styles.langChipActive]}
            >
              <Text style={[styles.langChipText, ttsLanguage === lang && styles.langChipTextActive]}>
                {lang === 'en-US' ? 'EN' : 'HI'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputRow}>
          <VoiceInput
            onText={t => setInput(prev => (prev ? prev + ' ' : '') + t)}
            onVoiceResponse={handleVoiceResponse}
            sessionTopic={session?.topic}
            language={ttsLanguage}
          />
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Try /ask /hint /cite /flashcards or message class..."
            placeholderTextColor={colors.inkFaint}
            multiline
            onSubmitEditing={send}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (!input.trim() || aiLoading) && styles.sendBtnDisabled,
              { transform: [{ scale: pressed ? 0.95 : 1 }] }
            ]}
            onPress={send}
            disabled={!input.trim() || aiLoading}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M22 2 L11 13 M22 2 L15 22 L11 13 L2 9 Z"
                    stroke={colors.white} strokeWidth="2.4" fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  quizBanner: {
    backgroundColor: colors.coralWash,
    borderBottomWidth: 1, borderBottomColor: colors.coral,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  quizBannerText: { ...type.bodyBold, color: colors.coralDeep },
  quizBannerSub: { ...type.small, color: colors.coralDeep, opacity: 0.8 },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  msgRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  avatarAI: {
    backgroundColor: colors.coralWash,
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  avatarOther: {
    backgroundColor: colors.skyWash,
    borderWidth: 1.5,
    borderColor: colors.sky,
  },
  avatarText: {
    ...type.bodyBold,
    fontSize: 15,
  },
  senderName: {
    ...type.caption,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  bubble: {
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadow.soft,
  },
  bubbleMine: {
    backgroundColor: colors.skyDeep,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleAI: {
    backgroundColor: colors.cardSoft,
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.coralLight,
  },
  bubbleText: {
    ...type.body,
    fontSize: 15,
    color: colors.ink,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...type.subhead,
    color: colors.ink,
    marginBottom: 6,
    fontWeight: '700',
  },
  emptySub: {
    ...type.small,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  thinkingText: {
    ...type.smallBold,
    color: colors.inkSoft,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    backgroundColor: colors.card,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  langChipActive: {
    backgroundColor: colors.skyWash,
    borderColor: colors.sky,
  },
  langChipText: { ...type.caption, color: colors.inkSoft },
  langChipTextActive: { color: colors.skyDeep, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  sendBtnDisabled: {
    backgroundColor: colors.inkFaint,
    opacity: 0.5,
  },
  quizWrapper: {
    alignSelf: 'center',
    width: '100%',
    marginVertical: spacing.xs,
  },
  quizCard: {
    backgroundColor: colors.goldWash,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
  },
  quizLabel: {
    ...type.caption,
    color: colors.coralDeep,
    marginBottom: 6,
  },
  quizTitle: {
    fontFamily: type.heading.fontFamily,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '700',
  },
  quizInfo: {
    ...type.small,
    color: colors.inkSoft,
    textAlign: 'center',
    marginVertical: 6,
  },
  quizBtn: {
    width: '100%',
    backgroundColor: colors.skyDeep,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  quizBtnText: {
    ...type.button,
    color: colors.white,
    fontWeight: '700',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.skyWash,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.skyLight,
  },
  listenText: {
    ...type.caption,
    color: colors.skyDeep,
  },
})
