import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { sessionApi, setBackendUrl } from '../api/client'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CodeEntry'>

export default function CodeEntryScreen() {
  const nav = useNavigation<Nav>()
  const { student, setStudent, setSession } = useSessionStore()
  const [code, setCode] = useState('')
  const [host, setHost] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 6) return Alert.alert('Enter the 6-character session code')
    if (!host.trim()) return Alert.alert('Enter the teacher\'s IP address (shown on the QR screen)')
    if (!student) return

    setLoading(true)
    try {
      setBackendUrl(host.trim(), 3001)
      const result = await sessionApi.join({ sessionCode: code.toUpperCase(), studentName: student.name })
      setStudent({ id: result.studentId, name: result.studentName })
      setSession({ id: result.sessionId, code: result.sessionCode, topic: result.topic, host: host.trim(), port: 3001 })
      nav.navigate('Lobby')
    } catch (err: any) {
      Alert.alert('Failed to join', err.response?.data?.error || err.message)
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Enter Session Code</Text>
        <Text style={s.sub}>Ask your teacher for the 6-character code shown on their screen</Text>

        <View style={s.codeWrap}>
          <TextInput
            style={s.codeInput}
            value={code}
            onChangeText={t => setCode(t.toUpperCase().slice(0, 6))}
            placeholder="e.g. K7MX2P"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
            autoFocus
            maxLength={6}
            keyboardType="default"
          />
        </View>

        <Text style={s.label}>Teacher's IP Address</Text>
        <TextInput
          style={s.ipInput}
          value={host}
          onChangeText={setHost}
          placeholder="e.g. 192.168.1.42"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
        />
        <Text style={s.ipHint}>The teacher's IP is shown under the QR code on their screen</Text>

        <TouchableOpacity
          style={[s.btn, (!code || code.length !== 6 || !host) && s.btnDisabled]}
          onPress={handleJoin}
          disabled={loading || !code || code.length !== 6 || !host}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Join Session →</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24 },
  back: { marginBottom: 24 },
  backText: { color: theme.colors.primary, fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text, marginBottom: 8 },
  sub: { fontSize: 14, color: theme.colors.textSub, marginBottom: 32, lineHeight: 20 },
  codeWrap: { marginBottom: 28 },
  codeInput: {
    fontSize: 36, fontWeight: '800', letterSpacing: 12,
    textAlign: 'center', color: theme.colors.primary,
    borderBottomWidth: 3, borderBottomColor: theme.colors.primary,
    paddingVertical: 12
  },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textSub, marginBottom: 8 },
  ipInput: {
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: 12, padding: 14, fontSize: 16,
    color: theme.colors.text, marginBottom: 8
  },
  ipHint: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 28 },
  btn: { backgroundColor: theme.colors.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' }
})
