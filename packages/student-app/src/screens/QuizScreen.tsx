import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable, TextInput } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore, QuizQuestion } from '../store/sessionStore'
import { quizApi } from '../api/client'
import { ScreenScaffold, PrimaryButton, OfflineBadge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Quiz'>

function getQuestionType(q: QuizQuestion): string {
  return q.questionType || (q.options?.length === 2 ? 'true_false' : 'mcq')
}

export default function QuizScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, activeQuiz, setQuizResult, setActiveQuiz, setHomeworkGenerating, markQuizCompleted } = useSessionStore()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [blankParts, setBlankParts] = useState<string[]>([])
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const q = activeQuiz?.questions[current]
  const qType = q ? getQuestionType(q) : 'mcq'

  useEffect(() => {
    if (!q) return
    setBlankParts(q.blanks?.map(() => '') || [])
    setMatchSelections({})
    setTextAnswer('')
    setSelected(null)
  }, [current, activeQuiz?.quizId])

  if (!activeQuiz || !q) {
    return (
      <ScreenScaffold tint="dusk">
        <ScreenHeader title="Trivia Quiz" kicker="NO ACTIVE ASSESSMENT" onBack={() => nav.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⏳</Text>
          <Text style={styles.waitTitle}>Waiting for Quiz...</Text>
          <Text style={styles.waitDesc}>
            There are no active quiz decks currently running in this classroom.
          </Text>
          <Pressable onPress={() => nav.goBack()}>
            <Text style={{ ...type.bodyBold, color: colors.coral }}>Go back to Lobby</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    )
  }
  const total = activeQuiz.questions.length
  const progress = (current / total) * 100

  const matchRights = useMemo(() => {
    if (!q.matchPairs?.length) return q.options?.filter(Boolean) || []
    return [...q.matchPairs.map(p => p.right)].sort(() => Math.random() - 0.5)
  }, [current, q.matchPairs])

  const hasAnswer = () => {
    if (qType === 'short_answer' || qType === 'fill_blank') {
      if (qType === 'fill_blank' && q.blanks?.length) {
        return blankParts.filter(Boolean).length >= q.blanks.length
      }
      return textAnswer.trim().length > 0
    }
    if (qType === 'match') {
      const pairs = q.matchPairs || []
      return pairs.length > 0 && pairs.every(p => matchSelections[p.left])
    }
    return !!selected
  }

  const buildAnswer = (): string => {
    if (qType === 'short_answer') return textAnswer.trim()
    if (qType === 'fill_blank') {
      if (q.blanks?.length) return blankParts.map(s => s.trim()).join('|')
      return textAnswer.trim()
    }
    if (qType === 'match') {
      return (q.matchPairs || [])
        .map(p => `${p.left}:${matchSelections[p.left]}`)
        .join(';')
    }
    return selected || ''
  }

  const resetInputs = () => {
    setSelected(null)
    setTextAnswer('')
    setBlankParts(q.blanks?.map(() => '') || [])
    setMatchSelections({})
  }

  const handleNext = async () => {
    if (!hasAnswer()) {
      Alert.alert('Answer required', 'Please complete your answer before continuing.')
      return
    }
    const newAnswers = [...answers, { questionIndex: current, answer: buildAnswer() }]
    setAnswers(newAnswers)
    resetInputs()

    if (current < total - 1) {
      setCurrent(current + 1)
    } else {
      setLoading(true)
      setHomeworkGenerating(true)
      try {
        const result = await quizApi.submit(activeQuiz.quizId, session!.id, student!.id, student!.name, newAnswers)
        markQuizCompleted(activeQuiz.quizId)
        setQuizResult(result)
        if (result.homework?.followUpQuestions?.length) setHomeworkGenerating(false)
        setActiveQuiz(null)
        nav.navigate('Results')
      } catch (e: any) {
        Alert.alert('Failed to Submit', e.message || "Make sure you are connected to the teacher's network.")
      }
      setLoading(false)
    }
  }

  const renderAnswerArea = () => {
    if (qType === 'short_answer') {
      return (
        <TextInput
          style={styles.textArea}
          value={textAnswer}
          onChangeText={setTextAnswer}
          placeholder="Type your answer…"
          placeholderTextColor={colors.inkFaint}
          multiline
        />
      )
    }

    if (qType === 'fill_blank') {
      if (q.blanks?.length) {
        return q.blanks.map((_, i) => (
          <TextInput
            key={i}
            style={styles.blankInput}
            value={blankParts[i] || ''}
            onChangeText={v => {
              const next = [...blankParts]
              next[i] = v
              setBlankParts(next)
            }}
            placeholder={`Blank ${i + 1}`}
            placeholderTextColor={colors.inkFaint}
          />
        ))
      }
      return (
        <TextInput
          style={styles.textArea}
          value={textAnswer}
          onChangeText={setTextAnswer}
          placeholder="Fill in the blank(s), separate with |"
          placeholderTextColor={colors.inkFaint}
        />
      )
    }

    if (qType === 'match' && q.matchPairs?.length) {
      return q.matchPairs.map(pair => (
        <View key={pair.left} style={styles.matchRow}>
          <Text style={styles.matchLeft}>{pair.left}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.matchOptions}>
              {matchRights.map(right => {
                const sel = matchSelections[pair.left] === right
                return (
                  <Pressable
                    key={right}
                    onPress={() => setMatchSelections(prev => ({ ...prev, [pair.left]: right }))}
                    style={[styles.matchChip, sel && styles.matchChipSel]}
                  >
                    <Text style={[styles.matchChipText, sel && { color: colors.white }]}>{right}</Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>
      ))
    }

    const opts = q.options?.filter(Boolean) || []
    return opts.map((opt: string, idx: number) => {
      const isSel = selected === opt
      return (
        <Pressable
          key={idx}
          onPress={() => setSelected(opt)}
          style={({ pressed }) => [
            styles.option,
            isSel ? styles.optionSelected : null,
            { transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
        >
          <View style={[styles.optIndex, isSel ? styles.optIndexSelected : null]}>
            <Text style={[styles.optLetter, isSel ? { color: colors.white } : null]}>
              {String.fromCharCode(65 + idx)}
            </Text>
          </View>
          <Text style={[styles.optText, isSel ? styles.optTextSelected : null]}>{opt}</Text>
        </Pressable>
      )
    })
  }

  return (
    <ScreenScaffold tint="dusk">
      <ScreenHeader title={`Question ${current + 1}`} kicker={qType.replace('_', ' ').toUpperCase()} />

      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={styles.countText}>
          {current + 1} of {total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.qCard}>
          {q.topic && <Text style={styles.qKicker}>{q.topic.toUpperCase()}</Text>}
          <Text style={styles.qText}>{q.question}</Text>
        </View>

        <View style={styles.optionsWrap}>{renderAnswerArea()}</View>

        <PrimaryButton
          label={loading ? 'Submitting...' : current < total - 1 ? 'Next Question' : 'Submit Answers'}
          variant="coral"
          onPress={handleNext}
          disabled={!hasAnswer() || loading}
          style={{ marginTop: spacing.md }}
          icon={
            loading ? (
              <ActivityIndicator color={colors.white} style={{ marginRight: 8 }} />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path
                  d="M5 12 H19 M12 5 L19 12 L12 19"
                  stroke={colors.white}
                  strokeWidth="2.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )
          }
        />

        <OfflineBadge style={{ alignSelf: 'center', marginTop: spacing.lg }} />
      </ScrollView>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  waitTitle: {
    fontFamily: type.heading.fontFamily,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
    fontWeight: '700',
  },
  waitDesc: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.paperDeep,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.skyDeep,
    borderRadius: radius.pill,
  },
  countText: {
    ...type.caption,
    color: colors.inkSoft,
    minWidth: 40,
    textAlign: 'right',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  qCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  qKicker: {
    ...type.caption,
    color: colors.coralDeep,
    marginBottom: 8,
  },
  qText: {
    fontFamily: type.heading.fontFamily,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
    fontWeight: '700',
  },
  optionsWrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    ...shadow.soft,
  },
  optionSelected: {
    borderColor: colors.sky,
    backgroundColor: colors.skyWash,
  },
  optIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.paper,
  },
  optIndexSelected: {
    backgroundColor: colors.skyDeep,
    borderColor: colors.skyDeep,
  },
  optLetter: {
    ...type.bodyBold,
    color: colors.inkSoft,
    fontSize: 14,
  },
  optText: {
    ...type.body,
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  optTextSelected: {
    fontWeight: '700',
    color: colors.skyDeep,
  },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 100,
    ...type.body,
    color: colors.ink,
  },
  blankInput: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    ...type.body,
    color: colors.ink,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  matchLeft: {
    ...type.bodyBold,
    width: 90,
    color: colors.ink,
  },
  matchOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  matchChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  matchChipSel: {
    backgroundColor: colors.skyDeep,
    borderColor: colors.skyDeep,
  },
  matchChipText: {
    ...type.caption,
    color: colors.ink,
  },
})
