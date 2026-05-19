import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { sessionApi, setBackendUrl } from '../api/client'
import { ScreenScaffold, PrimaryButton, OfflineBadge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import Illustration from '../components/Illustration'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'CodeEntry'>

export default function CodeEntryScreen() {
  const nav = useNavigation<Nav>()
  const { student, setStudent, setSession } = useSessionStore()
  const [code, setCode] = useState('')
  const [host, setHost] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 6) return Alert.alert('Enter room code', 'Please fill in the 6-character room code.')
    if (!host.trim()) return Alert.alert('Enter teacher IP', "Please enter the teacher's IP address (e.g. 192.168.1.5)")
    if (!student) return

    setLoading(true)
    try {
      const h = host.trim()
      // If host looks like a domain (not a raw IP), assume HTTPS (port 443)
      const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(h)
      const port = isIp ? 3001 : 443
      setBackendUrl(h, port)
      const result = await sessionApi.join({ sessionCode: code.toUpperCase(), studentName: student.name })
      setStudent({ id: result.studentId, name: result.studentName })
      setSession({ id: result.sessionId, code: result.sessionCode, topic: result.topic, host: h, port })
      nav.navigate('Lobby')
    } catch (err: any) {
      Alert.alert('Unable to Connect', err.response?.data?.error || err.message || 'Make sure both devices are on the same Wi-Fi.')
    }
    setLoading(false)
  }

  const isBtnDisabled = !code || code.length !== 6 || !host || loading

  return (
    <ScreenScaffold tint="dawn">
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Session Code"
          kicker="ENTER ROOM CODE"
          onBack={() => nav.goBack()}
        />

        {/* hero Ghibli illustration */}
        <View style={styles.hero}>
          <Illustration name="pinUnlock" height={150} rounded={radius.lg} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Join Class Room</Text>
        <Text style={styles.sub}>
          Ask your teacher for the 6-character code and the server address shown on the dashboard.
        </Text>

        {/* Code Input Card */}
        <View style={styles.card}>
          <Text style={styles.label}>6-CHARACTER ROOM CODE</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={t => setCode(t.toUpperCase().slice(0, 6))}
            placeholder="K7MX2P"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="characters"
            maxLength={6}
            autoFocus
          />
        </View>

        {/* Host Input Card */}
        <View style={styles.card}>
          <Text style={styles.label}>SERVER ADDRESS</Text>
          <TextInput
            style={styles.ipInput}
            value={host}
            onChangeText={setHost}
            placeholder="192.168.1.5  or  myschool.onrender.com"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
            keyboardType="default"
          />
          <Text style={styles.hint}>
            LAN: IP shown under the QR code · Cloud: your Render domain
          </Text>
        </View>

        <PrimaryButton
          label={loading ? 'Connecting...' : 'Join Classroom'}
          variant="coral"
          onPress={handleJoin}
          disabled={isBtnDisabled}
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  hero: { marginTop: spacing.xs, marginBottom: spacing.md, alignItems: 'center' },
  title: {
    fontFamily: type.hero.fontFamily,
    fontSize: 24, lineHeight: 30,
    color: colors.ink,
    fontWeight: '700',
  },
  sub: {
    ...type.body,
    color: colors.inkSoft,
    marginTop: 6,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    ...type.caption,
    color: colors.skyDeep,
    marginBottom: 8,
  },
  codeInput: {
    ...type.hero,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 8,
    color: colors.coralDeep,
    paddingVertical: 8,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ipInput: {
    ...type.body,
    fontSize: 16,
    color: colors.ink,
    padding: 10,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hint: {
    ...type.small,
    color: colors.inkFaint,
    marginTop: 6,
  },
})
