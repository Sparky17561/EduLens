import React from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { ScreenScaffold, PrimaryButton, OfflineBadge, Badge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import Illustration from '../components/Illustration'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Results'>

export default function ResultsScreen() {
  const nav = useNavigation<Nav>()
  const { quizResult } = useSessionStore()

  if (!quizResult) {
    return (
      <ScreenScaffold tint="meadow">
        <ScreenHeader title="Report Card" kicker="NO TEST COMPLETED" onBack={() => nav.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
          <Text style={styles.waitTitle}>No Results Found</Text>
          <Text style={styles.waitDesc}>
            Take the live classroom trivia quiz to generate your personal score and NCERT homework recommendations.
          </Text>
          <Pressable onPress={() => nav.goBack()}>
            <Text style={{ ...type.bodyBold, color: colors.skyDeep }}>Back to Lobby</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    )
  }

  const { score, total, percentage, weakTopics, strongTopics, topicBreakdown } = quizResult
  const passed = percentage >= 60
  const grade = percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : 'D'
  const gradeColor = percentage >= 75 ? colors.sageDeep : percentage >= 60 ? colors.gold : colors.error
  const gradeWash = percentage >= 75 ? colors.sageWash : percentage >= 60 ? colors.goldWash : colors.errorWash

  return (
    <ScreenScaffold tint="meadow" scroll={false}>
      <ScreenHeader
        title="Your Results"
        kicker="TRIVIA SCORECARD"
        onBack={() => nav.navigate('Lobby')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Score Panel */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>{passed ? '🎉' : '🌱'}</Text>
          <Text style={styles.heroPct}>{Math.round(percentage)}%</Text>
          
          <View style={[styles.gradeBadge, { backgroundColor: gradeWash, borderColor: gradeColor }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>Grade {grade}</Text>
          </View>
          
          <Text style={styles.heroSub}>
            {score} of {total} questions correct · {passed ? 'Fantastic effort!' : 'Keep cultivating knowledge!'}
          </Text>
        </View>

        {/* Topic Breakdown Card */}
        {Object.keys(topicBreakdown).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Topic Performance</Text>
            {Object.entries(topicBreakdown).map(([topic, pct]) => {
              const pass = (pct as number) >= 60
              const color = pass ? colors.sageDeep : colors.error
              return (
                <View key={topic} style={styles.breakdownRow}>
                  <Text style={styles.breakdownName} numberOfLines={1}>{topic}</Text>
                  <View style={styles.breakdownTrack}>
                    <View style={[styles.breakdownFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.breakdownPct, { color }]}>{Math.round(pct as number)}%</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Areas for growth */}
        {weakTopics.length > 0 && (
          <View style={[styles.card, styles.weakCard]}>
            <Text style={[styles.cardTitle, { color: colors.error }]}>⚠️ Review Recommended</Text>
            <View style={styles.chipRow}>
              {weakTopics.map((t: string) => (
                <View key={t} style={[styles.chip, { backgroundColor: colors.errorWash, borderColor: colors.error }]}>
                  <Text style={[styles.chipText, { color: colors.error }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Strengths */}
        {strongTopics.length > 0 && (
          <View style={[styles.card, styles.strongCard]}>
            <Text style={[styles.cardTitle, { color: colors.sageDeep }]}>✅ Expert In</Text>
            <View style={styles.chipRow}>
              {strongTopics.map((t: string) => (
                <View key={t} style={[styles.chip, { backgroundColor: colors.sageWash, borderColor: colors.sageDeep }]}>
                  <Text style={[styles.chipText, { color: colors.sageDeep }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.btnColumn}>
          <PrimaryButton
            label="📚 Open Grounded Homework"
            variant="coral"
            onPress={() => nav.navigate('Homework')}
            style={styles.btn}
          />

          <PrimaryButton
            label="📋 View Full Report Cards"
            variant="sky"
            onPress={() => nav.navigate('Report' as any)}
            style={styles.btn}
          />

          <Pressable
            onPress={() => nav.navigate('Chat')}
            style={({ pressed }) => [
              styles.askBtn,
              { opacity: pressed ? 0.75 : 1 }
            ]}
          >
            <Text style={styles.askText}>💬 Consult Gemma AI Tutor</Text>
          </Pressable>
        </View>

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
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  heroPct: {
    fontFamily: type.hero.fontFamily,
    fontSize: 54,
    color: colors.ink,
    fontWeight: '800',
    lineHeight: 60,
  },
  gradeBadge: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginVertical: spacing.sm,
  },
  gradeText: {
    ...type.caption,
    fontWeight: '800',
  },
  heroSub: {
    ...type.small,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  weakCard: {
    backgroundColor: '#FAF5F5',
    borderColor: 'rgba(201, 88, 107, 0.15)',
  },
  strongCard: {
    backgroundColor: '#F5FAF6',
    borderColor: 'rgba(92, 138, 98, 0.15)',
  },
  cardTitle: {
    ...type.subhead,
    color: colors.ink,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  breakdownName: {
    ...type.smallBold,
    color: colors.inkSoft,
    width: 90,
  },
  breakdownTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.paperDeep,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  breakdownPct: {
    ...type.smallBold,
    width: 38,
    textAlign: 'right',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: {
    ...type.caption,
    fontWeight: '700',
  },
  btnColumn: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  btn: {
    width: '100%',
  },
  askBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  askText: {
    ...type.bodyBold,
    color: colors.skyDeep,
  },
})
