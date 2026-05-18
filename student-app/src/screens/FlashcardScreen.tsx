import React, { useState, useRef } from 'react'
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { useSessionStore } from '../store/sessionStore'
import { ScreenScaffold, PrimaryButton, OfflineBadge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

export default function FlashcardScreen() {
  const nav = useNavigation()
  const { flashcards, session } = useSessionStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mastered, setMastered] = useState<Set<number>>(new Set())

  // MUST be a ref so it persists across renders without triggering re-render
  const flipAnim = useRef(new Animated.Value(0)).current

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start()
    setIsFlipped(v => !v)
  }

  const resetCard = () => {
    flipAnim.setValue(0)
    setIsFlipped(false)
  }

  const handleNext = () => {
    resetCard()
    setCurrentIndex(i => Math.min(flashcards.length - 1, i + 1))
  }

  const handlePrev = () => {
    resetCard()
    setCurrentIndex(i => Math.max(0, i - 1))
  }

  const handleMastered = () => {
    setMastered(prev => new Set([...prev, currentIndex]))
    if (currentIndex < flashcards.length - 1) handleNext()
  }

  // Front: 0 → 0deg, 1 → 180deg
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })
  // Back: starts already flipped at 180, rotates to 360 (=0)
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  })

  if (flashcards.length === 0) {
    return (
      <ScreenScaffold tint="morning">
        <ScreenHeader title="Flashcards" kicker="NO STUDY DECK AVAILABLE" onBack={() => nav.goBack()} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🃏</Text>
          <Text style={styles.waitTitle}>No Flashcards Ready</Text>
          <Text style={styles.waitDesc}>
            Flashcards are compiled automatically from class transcripts. Once your teacher initiates a lesson session, flashcards will spawn instantly!
          </Text>
          <PrimaryButton label="Go back to Lobby" variant="sky" onPress={() => nav.goBack()} style={{ width: '80%' }} />
        </View>
      </ScreenScaffold>
    )
  }

  const card = flashcards[currentIndex]
  const isMastered = mastered.has(currentIndex)
  const masteredCount = mastered.size

  return (
    <ScreenScaffold tint="morning">
      <ScreenHeader
        title="Offline Study"
        kicker="GEMMA REVISION CARDS"
        onBack={() => nav.goBack()}
      />

      <View style={styles.progressHeader}>
        <Text style={styles.progressTopic} numberOfLines={1}>{session?.topic}</Text>
        <Text style={styles.progressCount}>{masteredCount} of {flashcards.length} mastered</Text>
      </View>

      {/* Progress Dots Indicator */}
      <View style={styles.dotsRow}>
        {flashcards.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
              mastered.has(i) && styles.dotMastered
            ]}
          />
        ))}
      </View>

      {/* 3D Flip Card Area */}
      <View style={styles.cardContainer}>
        <Pressable onPress={handleFlip} style={styles.cardWrapper}>
          {/* Perspective wrapper for true 3D */}
          <View style={styles.perspective}>

            {/* Card Front face */}
            <Animated.View style={[
              styles.cardFace,
              styles.cardFront,
              { transform: [{ perspective: 1200 }, { rotateY: frontRotate }] }
            ]}>
              {isMastered && (
                <View style={styles.masteredTag}>
                  <Text style={styles.masteredTagText}>✓ MASTERED</Text>
                </View>
              )}
              <Text style={styles.cardKicker}>QUESTION · TAP TO REVEAL</Text>
              <Text style={styles.cardText}>{card.front}</Text>
            </Animated.View>

            {/* Card Back face */}
            <Animated.View style={[
              styles.cardFace,
              styles.cardBack,
              { transform: [{ perspective: 1200 }, { rotateY: backRotate }] }
            ]}>
              <Text style={[styles.cardKicker, { color: colors.white, opacity: 0.8 }]}>
                ANSWER · TAP TO FLIP BACK
              </Text>
              <Text style={[styles.cardText, { color: colors.white }]}>{card.back}</Text>
            </Animated.View>

          </View>
        </Pressable>
      </View>

      <Text style={styles.touchHint}>Tap the card to flip it</Text>

      {/* Navigation Controls */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={({ pressed }) => [
            styles.controlBtn,
            currentIndex === 0 && styles.controlBtnDisabled,
            { opacity: pressed ? 0.75 : 1 }
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M19 12 H5 M12 19 L5 12 L12 5" stroke={colors.ink} strokeWidth="2.5"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        {isFlipped && (
          <Pressable
            onPress={handleMastered}
            style={({ pressed }) => [
              styles.masteredAction,
              { transform: [{ scale: pressed ? 0.96 : 1 }] }
            ]}
          >
            <Text style={styles.masteredActionText}>✅ Got it!</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          style={({ pressed }) => [
            styles.controlBtn,
            currentIndex === flashcards.length - 1 && styles.controlBtnDisabled,
            { opacity: pressed ? 0.75 : 1 }
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M5 12 H19 M12 5 L19 12 L12 19" stroke={colors.ink} strokeWidth="2.5"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  waitTitle: {
    fontFamily: type.heading.fontFamily,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
    fontWeight: '700',
  },
  waitDesc: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  progressTopic: {
    ...type.smallBold,
    color: colors.inkSoft,
    flex: 1,
    marginRight: spacing.sm,
  },
  progressCount: {
    ...type.caption,
    color: colors.skyDeep,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.paperDeep,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  dotActive: {
    backgroundColor: colors.sky,
    width: 18,
  },
  dotMastered: {
    backgroundColor: colors.sage,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1.35,
    position: 'relative',
  },
  // The perspective container wraps both card faces
  perspective: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    ...shadow.lift,
    borderWidth: 1.5,
  },
  cardFront: {
    backgroundColor: colors.card,
    borderColor: colors.line,
  },
  cardBack: {
    backgroundColor: colors.skyDeep,
    borderColor: colors.skyDeep,
  },
  masteredTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: colors.sageWash,
    borderWidth: 1,
    borderColor: colors.sageDeep,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  masteredTagText: {
    ...type.caption,
    color: colors.sageDeep,
    fontSize: 9,
    fontWeight: '800',
  },
  cardKicker: {
    ...type.caption,
    color: colors.inkFaint,
    marginBottom: spacing.md,
  },
  cardText: {
    fontFamily: type.heading.fontFamily,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '700',
  },
  touchHint: {
    ...type.caption,
    textAlign: 'center',
    color: colors.inkFaint,
    paddingBottom: spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  controlBtnDisabled: {
    opacity: 0.35,
  },
  masteredAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.sageDeep,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  masteredActionText: {
    ...type.button,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
})
