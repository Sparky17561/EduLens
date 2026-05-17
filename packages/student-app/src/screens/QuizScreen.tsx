import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { quizApi } from '../api/client'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Quiz'>

export default function QuizScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, activeQuiz, setQuizResult } = useSessionStore()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!activeQuiz) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={s.emoji}>⏳</Text>
          <Text style={s.title}>No Quiz Active</Text>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={{ color: theme.colors.primary }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const q = activeQuiz.questions[current]
  const total = activeQuiz.questions.length
  const progress = ((current) / total) * 100

  const handleSelect = (option: string) => setSelected(option)

  const handleNext = async () => {
    if (!selected) return Alert.alert('Select an answer first')
    const newAnswers = [...answers, { questionIndex: current, answer: selected }]
    setAnswers(newAnswers as any)
    setSelected(null)

    if (current < total - 1) {
      setCurrent(current + 1)
    } else {
      // Submit
      setLoading(true)
      try {
        const result = await quizApi.submit(activeQuiz.quizId, session!.id, student!.id, student!.name, newAnswers)
        setQuizResult(result)
        nav.navigate('Results')
      } catch (e: any) {
        Alert.alert('Submission failed', e.message)
      }
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Progress */}
      <View style={s.progressWrap}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={s.progressText}>{current + 1} / {total}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Question */}
        <View style={s.questionCard}>
          {q.topic && <Text style={s.topicTag}>{q.topic}</Text>}
          <Text style={s.questionText}>{q.question}</Text>
        </View>

        {/* Options */}
        <View style={s.options}>
          {q.options.filter(Boolean).map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[s.option, selected === opt && s.optionSelected]}
              onPress={() => handleSelect(opt)}
              activeOpacity={0.8}
            >
              <View style={[s.optionCircle, selected === opt && s.optionCircleSelected]}>
                <Text style={[s.optionLetter, selected === opt && { color: '#fff' }]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[s.optionText, selected === opt && { color: theme.colors.primary, fontWeight: '700' }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[s.nextBtn, (!selected || loading) && s.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.nextBtnText}>{current < total - 1 ? 'Next Question →' : '✓ Submit Quiz'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  progressWrap: { padding: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSub, width: 48, textAlign: 'right' },
  content: { padding: 16, paddingTop: 8, gap: 16 },
  questionCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 22 },
  topicTag: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  questionText: { fontSize: 20, fontWeight: '700', color: theme.colors.text, lineHeight: 28 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 14,
    borderWidth: 2, borderColor: theme.colors.border,
    backgroundColor: '#fff'
  },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryDim },
  optionCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  optionCircleSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  optionLetter: { fontSize: 14, fontWeight: '800', color: theme.colors.textSub },
  optionText: { flex: 1, fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  nextBtn: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' }
})
