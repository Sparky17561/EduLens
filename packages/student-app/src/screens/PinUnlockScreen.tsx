import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useProfileStore, Profile } from '../store/profileStore'
import { useSessionStore } from '../store/sessionStore'
import { colors, type, spacing, radius } from '../theme/tokens'
import { getAvatarSource, getAvatarTint } from '../theme/avatars'

type Nav = NativeStackNavigationProp<RootStackParamList, 'PinUnlock'>
type Route = RouteProp<RootStackParamList, 'PinUnlock'>

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function PinUnlockScreen() {
  const nav = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { mode, profileId, profileData } = route.params
  const { profiles, addProfile, updateProfile } = useProfileStore()
  const { setStudent } = useSessionStore()

  const profile = profiles.find(p => p.id === profileId) || profileData
  const [stage, setStage] = useState<'create' | 'confirm' | 'enter'>(mode === 'create' ? 'create' : 'enter')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const shakeAnim = useRef(new Animated.Value(0)).current

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  const handleKey = (key: string) => {
    if (key === '⌫') {
      if (stage === 'enter' || stage === 'create') setPin(p => p.slice(0, -1))
      else setConfirmPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (key === '') return

    if (stage === 'create') {
      const next = pin + key
      if (next.length <= 4) {
        setPin(next)
        if (next.length === 4) setStage('confirm')
      }
    } else if (stage === 'confirm') {
      const next = confirmPin + key
      if (next.length <= 4) {
        setConfirmPin(next)
        if (next.length === 4) {
          if (next === pin) {
            // Save profile
            const finalProfile: Profile = { ...profileData!, pin }
            addProfile(finalProfile)
            setStudent({ id: finalProfile.id, name: finalProfile.name })
            nav.replace('MainTabs')
          } else {
            setError('PINs do not match. Try again.')
            shake()
            setConfirmPin('')
          }
        }
      }
    } else {
      // Enter mode
      const next = pin + key
      if (next.length <= 4) {
        setPin(next)
        if (next.length === 4) {
          if (profile?.pin === next) {
            setStudent({ id: profile.id, name: profile.name })
            nav.replace('MainTabs')
          } else {
            setError('Wrong PIN, try again.')
            shake()
            setPin('')
          }
        }
      }
    }
  }

  const currentPin = (stage === 'confirm') ? confirmPin : pin

  const title = stage === 'create' ? 'Create your PIN'
    : stage === 'confirm' ? 'Tap it once more'
    : error ? 'Wrong PIN, try again'
    : `Welcome back`

  const subtitle = stage === 'create' ? 'Pick 4 numbers only you will remember'
    : stage === 'confirm' ? 'Enter the same 4 numbers to confirm'
    : `Tap your secret 4-digit PIN, ${profile?.name || ''}`

  return (
    <View style={styles.container}>
      <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.top}>
        <View style={[styles.avatarWrap, { backgroundColor: getAvatarTint(profile?.avatar) + '22' }]}>
          {getAvatarSource(profile?.avatar)
            ? <Image source={getAvatarSource(profile?.avatar)!} style={styles.avatarImg} resizeMode="cover" />
            : <Text style={styles.avatar}>{profile?.avatar || '🧒'}</Text>}
        </View>
        <Text style={[styles.title, error ? styles.titleError : null]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* PIN dots */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.pinDot, currentPin.length > i && styles.pinDotFilled]} />
        ))}
      </Animated.View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((key, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.key, key === '' && styles.keyEmpty, pressed && styles.keyPressed]}
            onPress={() => handleKey(key)}
            disabled={key === ''}
          >
            <Text style={[styles.keyText, key === '⌫' && styles.keyBackspace]}>{key}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0', paddingHorizontal: 32 },
  backBtn: { marginTop: 52, marginBottom: 8 },
  backText: { ...type.bodyBold, color: colors.coral },
  top: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatar: { fontSize: 64 },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatarImg: { width: '100%', height: '100%' },
  title: { fontFamily: type.hero?.fontFamily, fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center', marginBottom: 8 },
  titleError: { color: '#E53E3E' },
  subtitle: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.coral,
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: colors.coral },
  errorText: { ...type.smallBold, color: '#E53E3E', textAlign: 'center', marginBottom: 8 },
  keypad: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginTop: 24,
    gap: 16,
    justifyContent: 'center',
  },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line,
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyPressed: { backgroundColor: '#FFE8DC' },
  keyText: { fontSize: 24, fontWeight: '600', color: colors.ink },
  keyBackspace: { fontSize: 20, color: colors.coralDeep },
})
