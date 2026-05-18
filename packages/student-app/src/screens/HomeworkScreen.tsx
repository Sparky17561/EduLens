import React from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { ScreenScaffold, PrimaryButton, OfflineBadge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Homework'>

export default function HomeworkScreen() {
  const nav = useNavigation<Nav>()
  const { quizResult, homeworkGenerating } = useSessionStore()
  const hw = quizResult?.homework

  if (homeworkGenerating || (quizResult && !hw?.followUpQuestions?.length)) {
    return (
      <ScreenScaffold tint="study">
        <ScreenHeader title="Homework" kicker="AI GENERATING" onBack={() => nav.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.skyDeep} />
          <Text style={styles.waitTitle}>Generating your homework…</Text>
          <Text style={styles.waitDesc}>EduLens AI is personalizing tasks from your quiz results. This may take up to a minute.</Text>
        </View>
      </ScreenScaffold>
    )
  }

  if (!hw || !hw.followUpQuestions?.length) {
    return (
      <ScreenScaffold tint="study">
        <ScreenHeader title="Homework" kicker="NO COMPLETED QUIZ" onBack={() => nav.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📖</Text>
          <Text style={styles.waitTitle}>Homework Pending</Text>
          <Text style={styles.waitDesc}>
            Once you submit your live classroom quiz answers, Gemma AI will immediately assemble a custom RAG homework assignment for you.
          </Text>
          <PrimaryButton label="Go back to Results" variant="sky" onPress={() => nav.goBack()} style={{ width: '80%' }} />
        </View>
      </ScreenScaffold>
    )
  }

  return (
    <ScreenScaffold tint="study" scroll={false}>
      <ScreenHeader
        title="My Homework"
        kicker="PERSONALIZED NCERT RECAP"
        onBack={() => nav.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Concept Recap Card */}
        {hw.conceptRecap && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📖 Concept Recap</Text>
            <Text style={styles.bodyText}>{hw.conceptRecap}</Text>
          </View>
        )}

        {/* Follow-up Questions Card */}
        {hw.followUpQuestions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>❓ Concept Self-Check</Text>
            <Text style={styles.hint}>Practice answering these in your notebook:</Text>
            {hw.followUpQuestions.map((q: string, idx: number) => (
              <View key={idx} style={styles.qRow}>
                <View style={styles.qIndexCircle}>
                  <Text style={styles.qIndexText}>{idx + 1}</Text>
                </View>
                <Text style={styles.qText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Revision Tasks Card */}
        {hw.revisionTasks?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>✏️ Action Revision Checklist</Text>
            {hw.revisionTasks.map((t: string, idx: number) => (
              <View key={idx} style={styles.taskRow}>
                <View style={styles.bulletBox}>
                  <Svg width={12} height={12} viewBox="0 0 24 24">
                    <Path d="M20 6 L9 17 L4 12" stroke={colors.skyDeep} strokeWidth="3"
                          fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text style={styles.taskText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Practice Challenge Card */}
        {hw.practiceChallenge && (
          <View style={[styles.card, styles.challengeCard]}>
            <Text style={[styles.sectionTitle, { color: colors.coralDeep }]}>🎯 Knowledge Challenge</Text>
            <Text style={styles.challengeText}>"{hw.practiceChallenge}"</Text>
          </View>
        )}

        {/* Ask your teacher Card */}
        {hw.askTeacherPrompts?.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.sageDeep }]}>🙋 Discuss with your Teacher</Text>
            <Text style={styles.hint}>Keep these questions handy for the next lecture session:</Text>
            {hw.askTeacherPrompts.map((p: string, idx: number) => (
              <View key={idx} style={styles.promptBubble}>
                <Text style={styles.promptText}>"{p}"</Text>
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label="View Full Report Card"
          variant="sky"
          onPress={() => nav.navigate('Report' as any)}
          style={{ marginTop: spacing.md }}
        />

        <OfflineBadge style={{ alignSelf: 'center', marginTop: spacing.md }} />
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  challengeCard: {
    backgroundColor: colors.coralWash,
    borderColor: colors.coralLight,
    borderWidth: 1.5,
  },
  sectionTitle: {
    fontFamily: type.heading.fontFamily,
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  hint: {
    ...type.small,
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  challengeText: {
    ...type.bodyBold,
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.coralDeep,
    lineHeight: 22,
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  qIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.skyWash,
    borderWidth: 1.5,
    borderColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qIndexText: {
    ...type.caption,
    color: colors.skyDeep,
  },
  qText: {
    ...type.body,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bulletBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.skyWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskText: {
    ...type.body,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  promptBubble: {
    backgroundColor: colors.sageWash,
    borderWidth: 1,
    borderColor: colors.sageLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  promptText: {
    ...type.bodyBold,
    fontStyle: 'italic',
    color: colors.sageDeep,
    fontSize: 14,
    lineHeight: 20,
  },
})
