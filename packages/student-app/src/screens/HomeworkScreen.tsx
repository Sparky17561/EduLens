import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Homework'>

export default function HomeworkScreen() {
  const nav = useNavigation<Nav>()
  const { quizResult } = useSessionStore()
  const hw = quizResult?.homework

  if (!hw || !hw.followUpQuestions?.length) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>⏳</Text>
          <Text style={s.title}>Homework Pending</Text>
          <Text style={s.sub}>Complete the quiz to get your personalized homework</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.headerTitle}>My Homework</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Concept recap */}
        {hw.conceptRecap && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>📖 Concept Recap</Text>
            <Text style={s.bodyText}>{hw.conceptRecap}</Text>
          </View>
        )}

        {/* Follow-up questions */}
        {hw.followUpQuestions?.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>❓ Follow-up Questions</Text>
            <Text style={s.hint}>Practice these on your own or ask your teacher</Text>
            {hw.followUpQuestions.map((q, i) => (
              <View key={i} style={s.qRow}>
                <View style={s.qNum}><Text style={s.qNumText}>{i + 1}</Text></View>
                <Text style={s.qText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Revision tasks */}
        {hw.revisionTasks?.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>✏️ Revision Tasks</Text>
            {hw.revisionTasks.map((t, i) => (
              <View key={i} style={s.taskRow}>
                <Text style={s.bullet}>•</Text>
                <Text style={s.taskText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Practice challenge */}
        {hw.practiceChallenge && (
          <View style={[s.card, s.challengeCard]}>
            <Text style={s.sectionTitle}>🎯 Practice Challenge</Text>
            <Text style={s.challengeText}>{hw.practiceChallenge}</Text>
          </View>
        )}

        {/* Ask teacher prompts */}
        {hw.askTeacherPrompts?.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>🙋 Ask Your Teacher</Text>
            {hw.askTeacherPrompts.map((p, i) => (
              <View key={i} style={[s.taskRow, { backgroundColor: theme.colors.primaryDim, padding: 10, borderRadius: 10, marginBottom: 6 }]}>
                <Text style={s.taskText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.btn} onPress={() => nav.navigate('Report')}>
          <Text style={s.btnText}>📋 View Full Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: theme.colors.primary, fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  sub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18 },
  challengeCard: { backgroundColor: '#f0f0ff', borderWidth: 1.5, borderColor: theme.colors.primary + '40' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  hint: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 12 },
  bodyText: { fontSize: 14, lineHeight: 22, color: theme.colors.text },
  challengeText: { fontSize: 15, lineHeight: 24, color: theme.colors.text, fontStyle: 'italic' },
  qRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  qNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  qNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  qText: { flex: 1, fontSize: 14, lineHeight: 22, color: theme.colors.text },
  taskRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bullet: { fontSize: 18, color: theme.colors.primary, lineHeight: 22 },
  taskText: { flex: 1, fontSize: 14, lineHeight: 22, color: theme.colors.text },
  btn: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
})
