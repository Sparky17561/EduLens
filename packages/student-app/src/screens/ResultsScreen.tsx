import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Results'>

export default function ResultsScreen() {
  const nav = useNavigation<Nav>()
  const { quizResult, student } = useSessionStore()

  if (!quizResult) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><Text>No results yet</Text></View>
      </SafeAreaView>
    )
  }

  const { score, total, percentage, weakTopics, strongTopics, topicBreakdown } = quizResult
  const passed = percentage >= 60
  const grade = percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : 'D'
  const gradeColor = percentage >= 75 ? theme.colors.success : percentage >= 60 ? theme.colors.warning : theme.colors.danger

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Score hero */}
        <View style={s.hero}>
          <Text style={s.emoji}>{passed ? '🎉' : '💪'}</Text>
          <Text style={s.scoreValue} numberOfLines={1}>{Math.round(percentage)}%</Text>
          <View style={[s.grade, { backgroundColor: gradeColor + '20', borderColor: gradeColor }]}>
            <Text style={[s.gradeText, { color: gradeColor }]}>Grade {grade}</Text>
          </View>
          <Text style={s.scoreSub}>{score} out of {total} correct · {passed ? 'Great job!' : 'Keep practicing!'}</Text>
        </View>

        {/* Topic breakdown */}
        {Object.keys(topicBreakdown).length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Topic Breakdown</Text>
            {Object.entries(topicBreakdown).map(([topic, pct]) => (
              <View key={topic} style={s.topicRow}>
                <Text style={s.topicName}>{topic}</Text>
                <View style={s.topicBar}>
                  <View style={[s.topicFill, { width: `${pct}%` as any, backgroundColor: (pct as number) >= 60 ? theme.colors.success : theme.colors.danger }]} />
                </View>
                <Text style={[s.topicPct, { color: (pct as number) >= 60 ? theme.colors.success : theme.colors.danger }]}>{Math.round(pct as number)}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weak areas */}
        {weakTopics.length > 0 && (
          <View style={[s.card, s.weakCard]}>
            <Text style={s.cardTitle}>⚠️ Needs More Practice</Text>
            {weakTopics.map(t => <View key={t} style={s.topicChip}><Text style={s.topicChipText}>{t}</Text></View>)}
          </View>
        )}

        {/* Strong areas */}
        {strongTopics.length > 0 && (
          <View style={[s.card, s.strongCard]}>
            <Text style={s.cardTitle}>✅ You're Strong In</Text>
            {strongTopics.map(t => <View key={t} style={[s.topicChip, s.topicChipGreen]}><Text style={[s.topicChipText, { color: theme.colors.success }]}>{t}</Text></View>)}
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={s.btn} onPress={() => nav.navigate('Homework')}>
          <Text style={s.btnText}>📚 View My Homework →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnSecondary} onPress={() => nav.navigate('Report')}>
          <Text style={s.btnSecondaryText}>📋 Full Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnGhost} onPress={() => nav.navigate('Chat')}>
          <Text style={s.btnGhostText}>💬 Ask a Question</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16 },
  hero: { alignItems: 'center', padding: 28, backgroundColor: theme.colors.surface, borderRadius: 24 },
  emoji: { fontSize: 48, marginBottom: 8 },
  scoreValue: { fontSize: 64, fontWeight: '900', color: theme.colors.text, lineHeight: 72 },
  grade: { borderWidth: 2, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 6, marginVertical: 8 },
  gradeText: { fontSize: 16, fontWeight: '800' },
  scoreSub: { fontSize: 14, color: theme.colors.textSub, textAlign: 'center' },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18 },
  weakCard: { backgroundColor: theme.colors.dangerDim },
  strongCard: { backgroundColor: theme.colors.successDim },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 14 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  topicName: { width: 80, fontSize: 13, color: theme.colors.textSub },
  topicBar: { flex: 1, height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: 'hidden' },
  topicFill: { height: '100%', borderRadius: 4 },
  topicPct: { width: 40, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  topicChip: { backgroundColor: theme.colors.dangerDim + 'aa', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 6 },
  topicChipGreen: { backgroundColor: theme.colors.successDim + 'aa' },
  topicChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.danger },
  btn: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { borderWidth: 2, borderColor: theme.colors.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
  btnSecondaryText: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },
  btnGhost: { padding: 16, alignItems: 'center' },
  btnGhostText: { color: theme.colors.textSub, fontSize: 15 }
})
