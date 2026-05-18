import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useProfileStore } from '../store/profileStore'
import { colors, type, spacing } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>

export default function SplashScreen() {
  const nav = useNavigation<Nav>()
  const { onboarded } = useProfileStore()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(24)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => {
      if (onboarded) {
        nav.replace('ProfileSelect')
      } else {
        nav.replace('Onboarding')
      }
    }, 2600)

    return () => clearTimeout(timer)
  }, [onboarded])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconEmoji}>🔭</Text>
        </View>
        <Text style={styles.brand}>EduLens</Text>
        <Text style={styles.tagline}>A gentle light for every learner</Text>
      </Animated.View>
      <Text style={styles.footer}>Works fully offline · Built for every classroom</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: { fontSize: 36 },
  brand: {
    fontFamily: type.hero?.fontFamily,
    fontSize: 40,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    ...type.small,
    color: colors.inkFaint,
    textAlign: 'center',
  },
})
