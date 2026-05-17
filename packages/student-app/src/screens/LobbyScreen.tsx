import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Lobby'>

export default function LobbyScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, sessionEnded } = useSessionStore()

  if (sessionEnded) {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👋</Text>
        <Text style={[s.title, { textAlign: 'center' }]}>Session Ended</Text>
        <Text style={[s.sub, { textAlign: 'center' }]}>Your teacher has ended the session. Thanks for participating!</Text>
        <TouchableOpacity style={s.btn} onPress={() => nav.navigate('Welcome')}>
          <Text style={s.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.topRow}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>LIVE SESSION</Text>
        </View>

        <Text style={s.emoji}>🎓</Text>
        <Text style={s.title}>You're In!</Text>
        <Text style={s.name}>{student?.name}</Text>
        <Text style={s.sub}>Joined session <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{session?.code}</Text></Text>
        <Text style={s.topic}>Topic: {session?.topic}</Text>

        <View style={s.waitCard}>
          <Text style={s.waitIcon}>⏳</Text>
          <Text style={s.waitText}>Waiting for your teacher to start the quiz…</Text>
          <Text style={s.waitSub}>The quiz will appear here automatically</Text>
        </View>

        <TouchableOpacity style={s.chatBtn} onPress={() => nav.navigate('Chat')}>
          <Text style={s.chatBtnText}>💬 Open Class Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.success },
  liveText: { fontSize: 11, fontWeight: '700', color: theme.colors.success, letterSpacing: 1.5 },
  emoji: { fontSize: 56, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.primary },
  sub: { fontSize: 15, color: theme.colors.textSub },
  topic: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 },
  waitCard: {
    backgroundColor: theme.colors.surface, borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 8, width: '100%', marginTop: 8
  },
  waitIcon: { fontSize: 32 },
  waitText: { fontSize: 15, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
  waitSub: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },
  chatBtn: { marginTop: 16, borderWidth: 2, borderColor: theme.colors.primary, padding: 16, borderRadius: 14, width: '100%', alignItems: 'center' },
  chatBtnText: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
  btn: { marginTop: 24, backgroundColor: theme.colors.primary, padding: 18, borderRadius: 14, width: '80%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
})
