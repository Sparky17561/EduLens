import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { sessionApi, setBackendUrl } from '../api/client'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>

export default function WelcomeScreen() {
  const nav = useNavigation<Nav>()
  const { setStudent, setSession } = useSessionStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const validateName = () => {
    if (!name.trim()) { Alert.alert('Enter your name first'); return false }
    return true
  }

  const handleQR = () => {
    if (!validateName()) return
    setStudent({ id: `stu-${Date.now()}`, name: name.trim() })
    nav.navigate('QRScanner')
  }

  const handleCode = () => {
    if (!validateName()) return
    setStudent({ id: `stu-${Date.now()}`, name: name.trim() })
    nav.navigate('CodeEntry')
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoIcon}>📡</Text>
          <Text style={s.logoText}>EduLens</Text>
          <Text style={s.logoSub}>Student App</Text>
        </View>

        {/* Name input */}
        <View style={s.card}>
          <Text style={s.label}>Your Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name..."
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            autoCapitalize="words"
          />
        </View>

        {/* Join options */}
        <Text style={s.sectionTitle}>Join a Session</Text>

        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleQR} activeOpacity={0.85}>
          <Text style={s.btnIcon}>📷</Text>
          <View style={s.btnContent}>
            <Text style={s.btnTitle}>Scan QR Code</Text>
            <Text style={s.btnSub}>Point camera at teacher's screen</Text>
          </View>
          <Text style={s.btnArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={handleCode} activeOpacity={0.85}>
          <Text style={s.btnIcon}>⌨️</Text>
          <View style={s.btnContent}>
            <Text style={[s.btnTitle, { color: theme.colors.primary }]}>Enter Session Code</Text>
            <Text style={s.btnSub}>Type the 6-character code</Text>
          </View>
          <Text style={[s.btnArrow, { color: theme.colors.primary }]}>→</Text>
        </TouchableOpacity>

        <Text style={s.hint}>Both devices must be on the same Wi-Fi</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, flexGrow: 1, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 52, marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: '800', color: theme.colors.primary, letterSpacing: -1 },
  logoSub: { fontSize: 14, color: theme.colors.textMuted, marginTop: 2 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, marginBottom: 24, ...theme.shadow.sm },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textSub, marginBottom: 8 },
  input: { fontSize: 16, color: theme.colors.text, padding: 12, backgroundColor: '#fff', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: theme.radius.lg, marginBottom: 12, ...theme.shadow.sm },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: theme.colors.primary },
  btnIcon: { fontSize: 24 },
  btnContent: { flex: 1 },
  btnTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  btnArrow: { fontSize: 18, color: '#fff', fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: 12, color: theme.colors.textMuted, marginTop: 8 }
})
