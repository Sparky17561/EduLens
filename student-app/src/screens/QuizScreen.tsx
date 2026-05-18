import React, { useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Pressable } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { quizApi } from '../api/client'
import { ScreenScaffold, PrimaryButton, OfflineBadge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Quiz'>

export default function QuizScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, activeQuiz, setQuizResult, setActiveQuiz } = useSessionStore()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!activeQuiz) {
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

  const q = activeQuiz.questions[current]
  const total = activeQuiz.questions.length
  const progress = ((current) / total) * 100

  const handleSelect = (option: string) => setSelected(option)

  const handleNext = async () => {
    if (!selected) {
      Alert.alert('Select an Answer', 'Please choose one of the options below before moving forward.')
      return
    }
    const newAnswers = [...answers, { questionIndex: current, answer: selected }]
    setAnswers(newAnswers)
    setSelected(null)

    if (current < total - 1) {
      setCurrent(current + 1)
    } else {
      setLoading(true)
      try {
        const result = await quizApi.submit(activeQuiz.quizId, session!.id, student!.id, student!.name, newAnswers)
        setQuizResult(result)
        setActiveQuiz(null)  // Clear quiz so student can't retake it
        nav.navigate('Results')
      } catch (e: any) {
        Alert.alert('Failed to Submit', e.message || 'Make sure you are connected to the teacher\'s network.')
      }
      setLoading(false)
    }
  }

  return (
    <ScreenScaffold tint="dusk">
      <ScreenHeader
        title={`Question ${current + 1}`}
        kicker="TRIVIA IN PROGRESS"
      />

      {/* Ghibli-themed Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={styles.countText}>{current + 1} of {total}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Panel */}
        <View style={styles.qCard}>
          {q.topic && <Text style={styles.qKicker}>{q.topic.toUpperCase()}</Text>}
          <Text style={styles.qText}>{q.question}</Text>
        </View>

        {/* Option Grid */}
        <View style={styles.optionsWrap}>
          {q.options.filter(Boolean).map((opt: string, idx: number) => {
            const isSel = selected === opt
            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(opt)}
                style={({ pressed }) => [
                  styles.option,
                  isSel ? styles.optionSelected : null,
                  { transform: [{ scale: pressed ? 0.99 : 1 }] }
                ]}
              >
                <View style={[styles.optIndex, isSel ? styles.optIndexSelected : null]}>
                  <Text style={[styles.optLetter, isSel ? { color: colors.white } : null]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[styles.optText, isSel ? styles.optTextSelected : null]}>
                  {opt}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <PrimaryButton
          label={loading ? 'Submitting...' : current < total - 1 ? 'Next Question' : 'Submit Answers'}
          variant="coral"
          onPress={handleNext}
          disabled={!selected || loading}
          style={{ marginTop: spacing.md }}
          icon={
            loading ? (
              <ActivityIndicator color={colors.white} style={{ marginRight: 8 }} />
            ) : (
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M5 12 H19 M12 5 L19 12 L12 19" stroke={colors.white} strokeWidth="2.6"
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
})
