import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { chatApi, aiApi } from '../api/client'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Chat'>

export default function ChatScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, messages, addMessage, setActiveQuiz } = useSessionStore()
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

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
    if (!input.trim() || !session || !student) return
    const text = input.trim()
    setInput('')

    if (text.startsWith('/ask ')) {
      const question = text.slice(5)
      addMessage({
        id: `local-${Date.now()}`,
        senderId: student.id,
        senderName: student.name,
        role: 'student',
        content: text,
        messageType: 'ask',
        createdAt: new Date().toISOString()
      })
      setAiLoading(true)
      
      // Fire-and-forget REST call so it never blocks or times out.
      // The answer will arrive organically via WebSocket!
      aiApi.ask(session.id, student.id, student.name, question).catch(e => {
        console.warn('[AI] POST failed, waiting on WebSocket:', e)
      })
      return
    }

    addMessage({ id: `local-${Date.now()}`, senderId: student.id, senderName: student.name, role: 'student', content: text, messageType: 'chat', createdAt: new Date().toISOString() })
    try { await chatApi.send(session.id, student.id, student.name, text) } catch {}
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Class Chat</Text>
          <Text style={s.headerSub}>{session?.topic}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={s.list}
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
                <View style={[s.msgRow, { alignSelf: 'center', width: '90%', marginVertical: 8 }]}>
                  <View style={s.quizCard}>
                    <Text style={s.quizHeader}>📝 CLASS QUIZ READY</Text>
                    <Text style={s.quizTitle}>Interactive Assessment is Live!</Text>
                    <Text style={s.quizInfo}>
                      Total Questions: <Text style={{ fontWeight: '700' }}>{quizData.totalQuestions || quizData.questions?.length || 5}</Text>
                    </Text>
                    
                    <TouchableOpacity
                      style={s.quizBtn}
                      onPress={() => {
                        setActiveQuiz({ quizId: quizData.quizId, questions: quizData.questions })
                        nav.navigate('Quiz')
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.quizBtnText}>📝 Give Test</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            }
          }

          return (
            <View style={[s.msgRow, isMine && s.msgRowRight]}>
              {!isMine && (
                <View style={[s.avatar, isAI && s.avatarAI]}>
                  <Text style={{ fontSize: isAI ? 12 : 14, fontWeight: '700', color: '#fff' }}>
                    {isAI ? '🤖' : msg.senderName[0]}
                  </Text>
                </View>
              )}
              <View style={{ maxWidth: '75%' }}>
                {!isMine && <Text style={s.senderName}>{msg.senderName}</Text>}
                <View style={[s.bubble, isMine ? s.bubbleMine : isAI ? s.bubbleAI : s.bubbleOther]}>
                  <Text style={[s.bubbleText, isMine && { color: '#fff' }]}>{msg.content}</Text>
                </View>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>No messages yet. Say hi or use /ask</Text></View>}
        ListFooterComponent={aiLoading ? <View style={s.thinking}><ActivityIndicator size="small" color={theme.colors.primary} /><Text style={s.thinkingText}>AI thinking…</Text></View> : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inputRow}>
          <TextInput style={s.input} value={input} onChangeText={setInput} placeholder="/ask [question] or message..." placeholderTextColor={theme.colors.textMuted} multiline onSubmitEditing={send} />
          <TouchableOpacity style={s.sendBtn} onPress={send} disabled={!input.trim() || aiLoading}>
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: theme.colors.primary, fontSize: 16 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  headerSub: { fontSize: 12, color: theme.colors.textMuted },
  list: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  avatarAI: { backgroundColor: theme.colors.primary },
  senderName: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 3 },
  bubble: { borderRadius: 14, padding: 12 },
  bubbleMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4 },
  bubbleAI: { backgroundColor: '#f0f0ff', borderWidth: 1, borderColor: theme.colors.primary + '30', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: theme.colors.text },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: theme.colors.textMuted, fontSize: 14 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, paddingHorizontal: 16 },
  thinkingText: { color: theme.colors.textMuted, fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: theme.colors.text, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
  quizCard: {
    width: '100%',
    backgroundColor: '#f6f9ff',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  quizHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center'
  },
  quizInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6
  },
  quizBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  quizBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  }
})
