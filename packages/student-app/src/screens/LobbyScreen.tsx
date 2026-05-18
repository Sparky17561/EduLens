import React from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { ScreenScaffold, PrimaryButton, OfflineBadge, Badge } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import Illustration from '../components/Illustration'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Lobby'>

export default function LobbyScreen() {
  const nav = useNavigation<Nav>()
  const { student, session, sessionEnded, quizResult, pendingQuiz, setPendingQuiz, activeQuiz } = useSessionStore()

  const handleStartQuiz = () => {
    setPendingQuiz(false)
    nav.navigate('Quiz')
  }

  const handleDismissQuiz = () => {
    setPendingQuiz(false)
  }

  if (sessionEnded) {
    return (
      <ScreenScaffold tint="dawn" scroll={false}>
        <ScreenHeader title="Class Dismissed" kicker="TAKE-HOME MODE" onBack={() => nav.navigate('Welcome')} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.endedHero}>
            <Illustration name="summary" height={150} rounded={radius.lg} />
          </View>

          <Text style={styles.endedTitle}>Study Offline Anytime</Text>
          <Text style={styles.endedSub}>
            The live classroom session has ended, but all your personalized RAG homework, study voiceovers, and offline notes are fully saved on your device.
          </Text>

          <View style={styles.endedActions}>
            {useSessionStore.getState().quizResult?.homework && (
              <PrimaryButton
                label="🏆 Review Homework & Results"
                variant="sage"
                onPress={() => nav.navigate('Results' as any)}
                style={styles.actionBtn}
              />
            )}
            
            <PrimaryButton
              label="💬 Ask AI Tutor (Offline)"
              variant="sky"
              onPress={() => nav.navigate('Chat')}
              style={styles.actionBtn}
            />

            <PrimaryButton
              label="🃏 Practice Flashcards"
              variant="coral"
              onPress={() => nav.navigate('Flashcards' as any)}
              style={styles.actionBtn}
            />

            <Pressable
              onPress={() => nav.navigate('Welcome')}
              style={({ pressed }) => [
                styles.exitBtn,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={styles.exitText}>Exit to Main Screen</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenScaffold>
    )
  }

  return (
    <ScreenScaffold tint="morning" scroll={false}>
      <ScreenHeader
        title="Class Lobby"
        kicker="LIVE SESSION"
        onBack={() => nav.navigate('Welcome')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Session info Ghibli-themed Card */}
        <View style={styles.sessionCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CONNECTED</Text>
            {session && <Badge label={`CODE: ${session.code}`} tone="sky" style={{ marginLeft: spacing.sm }} />}
          </View>
          <Text style={styles.topicText}>{session?.topic || 'Live Interactive Class'}</Text>
          <Text style={styles.topicSub}>Your device is actively listening to the teacher's lesson</Text>
        </View>

        {/* Student Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Circle cx="12" cy="8" r="3.5" stroke={colors.skyDeep} strokeWidth="2.2" fill="none" />
              <Path d="M5 20 Q5 13 12 13 Q19 13 19 20"
                    stroke={colors.skyDeep} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{student?.name || 'Happy Student'}</Text>
            <Text style={styles.profileSub}>Student Participant</Text>
          </View>
        </View>

        {/* === STUDENT DASHBOARD === */}
        <Text style={styles.dashTitle}>📱 My Dashboard</Text>

        <View style={styles.dashGrid}>
          {/* Chat card */}
          <Pressable
            onPress={() => nav.navigate('Chat')}
            style={({ pressed }) => [styles.dashCard, styles.dashCardBlue, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.dashCardIcon}>💬</Text>
            <Text style={styles.dashCardLabel}>Ask AI Tutor</Text>
            <Text style={styles.dashCardSub}>Chat & Q&A</Text>
          </Pressable>

          {/* Flashcards card */}
          <Pressable
            onPress={() => nav.navigate('Flashcards' as any)}
            style={({ pressed }) => [styles.dashCard, styles.dashCardCoral, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.dashCardIcon}>🃏</Text>
            <Text style={styles.dashCardLabel}>Flashcards</Text>
            <Text style={styles.dashCardSub}>Study & Revise</Text>
          </Pressable>

          {/* Results card — shows score if available */}
          <Pressable
            onPress={() => quizResult ? nav.navigate('Results') : null}
            style={({ pressed }) => [
              styles.dashCard,
              quizResult ? styles.dashCardGreen : styles.dashCardGray,
              { opacity: pressed ? 0.85 : 1 }
            ]}
          >
            <Text style={styles.dashCardIcon}>{quizResult ? '🏆' : '⏳'}</Text>
            <Text style={styles.dashCardLabel}>
              {quizResult ? `${Math.round(quizResult.percentage)}% Score` : 'Quiz Results'}
            </Text>
            <Text style={styles.dashCardSub}>
              {quizResult ? `${quizResult.score}/${quizResult.total} correct` : 'Waiting for quiz...'}
            </Text>
          </Pressable>

          {/* Report card */}
          <Pressable
            onPress={() => quizResult ? nav.navigate('Report' as any) : null}
            style={({ pressed }) => [
              styles.dashCard,
              quizResult ? styles.dashCardPurple : styles.dashCardGray,
              { opacity: pressed ? 0.85 : 1 }
            ]}
          >
            <Text style={styles.dashCardIcon}>📋</Text>
            <Text style={styles.dashCardLabel}>Report Card</Text>
            <Text style={styles.dashCardSub}>
              {quizResult ? 'View full report' : 'Complete quiz first'}
            </Text>
          </Pressable>
        </View>

        {/* Homework card (full width, only if quiz done) */}
        {quizResult?.homework && (
          <Pressable
            onPress={() => nav.navigate('Homework')}
            style={({ pressed }) => [styles.homeworkCard, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.dashCardIcon}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.homeworkLabel}>Personalized Homework Ready!</Text>
              <Text style={styles.homeworkSub}>Tap to review your AI-generated NCERT homework</Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.sageDeep }}>→</Text>
          </Pressable>
        )}

        {/* Wait hint if no quiz yet */}
        {!quizResult && (
          <View style={styles.waitCard}>
            <Illustration name="lesson" height={100} rounded={radius.md} />
            <Text style={styles.waitTitle}>Waiting for Class Trivia...</Text>
            <Text style={styles.waitDesc}>
              Pay attention to your teacher. The AI quiz will pop up automatically!
            </Text>
          </View>
        )}

        <OfflineBadge style={{ alignSelf: 'center', marginTop: spacing.lg }} />
      </ScrollView>

      {/* ===== QUIZ POPUP MODAL ===== */}
      <Modal
        visible={pendingQuiz && !!activeQuiz}
        transparent
        animationType="slide"
        onRequestClose={handleDismissQuiz}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quizPopup}>
            {/* Animated glow ring */}
            <View style={styles.quizPopupGlow}>
              <Text style={styles.quizPopupEmoji}>🎯</Text>
            </View>

            <Text style={styles.quizPopupTitle}>Quiz Time!</Text>
            <Text style={styles.quizPopupSub}>
              Your teacher has launched a live quiz for this class.
            </Text>

            {activeQuiz && (
              <View style={styles.quizInfoRow}>
                <View style={styles.quizInfoBadge}>
                  <Text style={styles.quizInfoNum}>{activeQuiz.questions.length}</Text>
                  <Text style={styles.quizInfoLabel}>Questions</Text>
                </View>
                <View style={styles.quizInfoBadge}>
                  <Text style={styles.quizInfoNum}>Live</Text>
                  <Text style={styles.quizInfoLabel}>Mode</Text>
                </View>
                {activeQuiz.questions[0]?.topic && (
                  <View style={styles.quizInfoBadge}>
                    <Text style={styles.quizInfoNum} numberOfLines={1}>
                      {activeQuiz.questions[0].topic.length > 8
                        ? activeQuiz.questions[0].topic.slice(0, 8) + '…'
                        : activeQuiz.questions[0].topic}
                    </Text>
                    <Text style={styles.quizInfoLabel}>Topic</Text>
                  </View>
                )}
              </View>
            )}

            <Pressable
              onPress={handleStartQuiz}
              style={({ pressed }) => [styles.startQuizBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Text style={styles.startQuizBtnText}>▶ Start Quiz Now</Text>
            </Pressable>

            <Pressable
              onPress={handleDismissQuiz}
              style={({ pressed }) => [styles.laterBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.laterBtnText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  endedHero: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  endedTitle: {
    fontFamily: type.hero.fontFamily,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
    fontWeight: '700',
  },
  endedSub: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  endedActions: {
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  exitBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: spacing.xs,
  },
  exitText: {
    ...type.bodyBold,
    color: colors.inkSoft,
  },
  sessionCard: {
    backgroundColor: colors.skyWash,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(74, 90, 184, 0.2)',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage, marginRight: 6 },
  liveText: { ...type.caption, color: colors.sageDeep },
  topicText: { ...type.title, color: colors.skyDeep, fontWeight: '700', fontSize: 22 },
  topicSub: { ...type.small, color: colors.inkSoft, marginTop: 2 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.skyWash,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  profileName: { ...type.bodyBold, color: colors.ink, fontWeight: '700' },
  profileSub: { ...type.small, color: colors.inkFaint },
  waitCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  waitTitle: {
    fontFamily: type.heading.fontFamily,
    fontSize: 18,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: 6,
    fontWeight: '700',
  },
  waitDesc: {
    ...type.small,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
  // === Dashboard styles ===
  dashTitle: {
    ...type.subhead,
    color: colors.ink,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dashGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dashCard: {
    width: '47%',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 100,
    justifyContent: 'center',
  },
  dashCardBlue: {
    backgroundColor: '#EEF2FF',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  dashCardCoral: {
    backgroundColor: '#FFF1EE',
    borderColor: 'rgba(229, 88, 78, 0.2)',
  },
  dashCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  dashCardPurple: {
    backgroundColor: '#FAF5FF',
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  dashCardGray: {
    backgroundColor: colors.paperDeep,
    borderColor: colors.line,
    opacity: 0.7,
  },
  dashCardIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  dashCardLabel: {
    ...type.bodyBold,
    fontSize: 13,
    color: colors.ink,
    fontWeight: '700',
    textAlign: 'center',
  },
  dashCardSub: {
    ...type.small,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 2,
  },
  homeworkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sageWash,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(92, 138, 98, 0.25)',
    gap: spacing.sm,
    ...shadow.soft,
  },
  homeworkLabel: {
    ...type.bodyBold,
    color: colors.sageDeep,
    fontWeight: '700',
    fontSize: 14,
  },
  homeworkSub: {
    ...type.small,
    color: colors.inkSoft,
    marginTop: 2,
  },
  // === Quiz Popup Modal ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  quizPopup: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...shadow.lift,
  },
  quizPopupGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quizPopupEmoji: {
    fontSize: 34,
  },
  quizPopupTitle: {
    fontFamily: type.hero.fontFamily,
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  quizPopupSub: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  quizInfoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quizInfoBadge: {
    flex: 1,
    backgroundColor: colors.skyWash,
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,90,184,0.2)',
  },
  quizInfoNum: {
    fontFamily: type.heading.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: colors.skyDeep,
  },
  quizInfoLabel: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  startQuizBtn: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: colors.skyDeep,
    borderRadius: radius.xl,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  startQuizBtnText: {
    ...type.button,
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  laterBtn: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  laterBtnText: {
    ...type.bodyBold,
    color: colors.inkSoft,
  },
})
