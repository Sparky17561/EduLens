import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useProfileStore, SessionRecord } from '../../store/profileStore'
import { ScreenScaffold, Badge } from '../../components/ui'
import { ScreenHeader } from '../../components/widgets'
import { colors, type, spacing, radius, shadow } from '../../theme/tokens'

function formatDuration(secs: number) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function ScorePill({ score, total, pct }: { score: number; total: number; pct: number }) {
  const color = pct >= 75 ? colors.sageDeep : pct >= 50 ? colors.gold : colors.error
  const bg = pct >= 75 ? colors.sageWash : pct >= 50 ? colors.goldWash : colors.errorWash
  return (
    <View style={[styles.scorePill, { backgroundColor: bg }]}>
      <Text style={[styles.scorePillText, { color }]}>{score}/{total}</Text>
    </View>
  )
}

function SessionCard({ rec }: { rec: SessionRecord }) {
  const hasQuiz = rec.quizScore !== undefined && rec.quizTotal !== undefined
  const pct = rec.quizPercentage || 0
  const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D'

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.topicIcon}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6M2 12l10 6 10-6"
                  stroke={colors.skyDeep} strokeWidth="2" fill="none"
                  strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.topicText} numberOfLines={2}>{rec.topic || 'Untitled Session'}</Text>
          <Text style={styles.dateText}>{formatDate(rec.date)} · Code: {rec.code}</Text>
        </View>
        {hasQuiz && (
          <ScorePill score={rec.quizScore!} total={rec.quizTotal!} pct={pct} />
        )}
      </View>

      <View style={styles.cardRow}>
        {rec.durationSeconds > 0 && (
          <View style={styles.metaChip}>
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Circle cx="12" cy="12" r="9" stroke={colors.inkFaint} strokeWidth="2" fill="none" />
              <Path d="M12 7v5l3 3" stroke={colors.inkFaint} strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={styles.metaText}>{formatDuration(rec.durationSeconds)}</Text>
          </View>
        )}
        {hasQuiz && (
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>Grade {grade}</Text>
          </View>
        )}
        {rec.weakTopics && rec.weakTopics.length > 0 && (
          <View style={[styles.metaChip, { backgroundColor: colors.errorWash }]}>
            <Text style={[styles.metaText, { color: colors.error }]}>
              {rec.weakTopics.length} weak topic{rec.weakTopics.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default function PastSessionsTab() {
  const { sessionHistory } = useProfileStore()

  return (
    <ScreenScaffold tint="morning" scroll={false} padded={false}>
      <View style={styles.padded}>
        <ScreenHeader title="Past Sessions" kicker="HISTORY" />
      </View>
      {sessionHistory.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyDesc}>
            Once you join and complete a session, it will appear here with your quiz scores and homework.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countText}>{sessionHistory.length} session{sessionHistory.length !== 1 ? 's' : ''} recorded</Text>
          {sessionHistory.map(rec => (
            <SessionCard key={rec.id} rec={rec} />
          ))}
        </ScrollView>
      )}
    </ScreenScaffold>

  )
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.xxl,
  },
  emptyIcon: { fontSize: 52, marginBottom: spacing.md },
  emptyTitle: { ...type.subhead, color: colors.ink, fontWeight: '700', marginBottom: spacing.xs },
  emptyDesc: { ...type.small, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 },
  padded: { paddingHorizontal: spacing.lg },
  list: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  countText: { ...type.caption, color: colors.inkFaint, marginBottom: spacing.sm, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  topicIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.skyWash,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  topicText: { ...type.bodyBold, color: colors.ink, flex: 1 },
  dateText: { ...type.small, color: colors.inkFaint, marginTop: 2 },
  scorePill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, marginLeft: spacing.sm,
    alignSelf: 'flex-start',
  },
  scorePillText: { ...type.caption, fontWeight: '800' },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.paperDeep,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  metaText: { ...type.caption, color: colors.inkSoft, fontSize: 11 },
})
