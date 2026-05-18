import React, { useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useProfileStore } from '../store/profileStore'
import { colors, type, spacing, radius } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    emoji: '📖',
    kicker: 'LEARN ANYWHERE',
    headline: 'Turn any lesson into\na live experience',
    body: 'Join your teacher\'s live class by scanning a QR code. Ask questions, take quizzes, and get instant AI help.',
    bg: '#FFF8F0',
  },
  {
    emoji: '🤖',
    kicker: 'AI TUTOR',
    headline: 'Your personal AI\ntutor, always ready',
    body: 'Type /explain, /hint, /define, or just ask a question. Get clear answers tailored for NCERT Class 6–10.',
    bg: '#F0F8FF',
  },
  {
    emoji: '📊',
    kicker: 'TRACK YOUR GROWTH',
    headline: 'See exactly where\nyou need help',
    body: 'After every quiz, get personalized homework and a report card. Your teacher sees how to help you better.',
    bg: '#F0FFF4',
  },
]

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>()
  const { setOnboarded } = useProfileStore()
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true })
      setCurrent(current + 1)
    } else {
      setOnboarded()
      nav.replace('ProfileSelect')
    }
  }

  const skip = () => {
    setOnboarded()
    nav.replace('ProfileSelect')
  }

  return (
    <View style={[styles.container, { backgroundColor: SLIDES[current].bg }]}>
      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <Pressable style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.slider}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.kicker}>{slide.kicker}</Text>
            <Text style={styles.headline}>{slide.headline}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
        ))}
      </View>

      {/* Next / Get Started */}
      <Pressable
        style={({ pressed }) => [styles.nextBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={goNext}
      >
        <Text style={styles.nextText}>
          {current === SLIDES.length - 1 ? 'Get Started' : 'Next →'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: 'absolute', top: 52, right: 24, zIndex: 10,
    paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 20,
  },
  skipText: { ...type.smallBold, color: colors.inkSoft },
  slider: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emojiWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emoji: { fontSize: 56 },
  kicker: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2,
    color: colors.coralDeep, marginBottom: 12,
  },
  headline: {
    fontFamily: type.hero?.fontFamily,
    fontSize: 28, lineHeight: 36, fontWeight: '800',
    color: colors.ink, textAlign: 'center', marginBottom: spacing.md,
  },
  body: {
    ...type.body, color: colors.inkSoft,
    textAlign: 'center', lineHeight: 24,
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.line, marginHorizontal: 4,
  },
  dotActive: { backgroundColor: colors.coral, width: 20 },
  nextBtn: {
    marginHorizontal: 32, marginBottom: 48,
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: { ...type.subhead, color: colors.white, fontWeight: '700' },
})
