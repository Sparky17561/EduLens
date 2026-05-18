import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useSessionStore } from '../../store/sessionStore'
import { useProfileStore } from '../../store/profileStore'
import { ScreenScaffold, Chip, PrimaryButton } from '../../components/ui'
import { ScreenHeader } from '../../components/widgets'
import { colors, type, spacing, radius, shadow } from '../../theme/tokens'
import { getAvatarSource, getAvatarTint } from '../../theme/avatars'

type Nav = NativeStackNavigationProp<RootStackParamList>

const LANGUAGES = ['English', 'हिंदी', 'தமிழ்', 'বাংলা', 'Kiswahili']

function SettingRow({ icon, label, value, onPress, tone = 'default' }: {
  icon: React.ReactNode; label: string; value?: string; onPress?: () => void; tone?: string
}) {
  const textColor = tone === 'danger' ? colors.error : colors.ink
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, { opacity: pressed && onPress ? 0.7 : 1 }]}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <Text style={[styles.settingLabel, { color: textColor, flex: 1 }]}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && (
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path d="M9 5 L16 12 L9 19" stroke={tone === 'danger' ? colors.error : colors.inkFaint}
                strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </Pressable>
  )
}

export default function ProfileTab() {
  const nav = useNavigation<Nav>()
  const { student, session, clearSession, quizResult } = useSessionStore()
  const { getActiveProfile, sessionHistory, profiles } = useProfileStore()
  const profile = getActiveProfile()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [lang, setLang] = useState(profile?.lang || 'English')

  const handleSwitchAccount = () => nav.navigate('ProfileSelect')
  const handleLeaveSession = () => {
    Alert.alert('Leave Session?', 'You will be disconnected from the current session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => clearSession() },
    ])
  }

  const totalSessions = sessionHistory.length
  const avgScore = sessionHistory.filter(s => s.quizPercentage !== undefined).length > 0
    ? Math.round(
        sessionHistory
          .filter(s => s.quizPercentage !== undefined)
          .reduce((sum, s) => sum + (s.quizPercentage || 0), 0) /
        sessionHistory.filter(s => s.quizPercentage !== undefined).length
      )
    : null

  return (
    <ScreenScaffold tint="morning" scroll={false} padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenHeader title="Profile" kicker="MY ACCOUNT" />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Hero */}
        {profile ? (
          <View style={styles.heroCard}>
            <View style={[styles.heroAvatarWrap, { backgroundColor: getAvatarTint(profile.avatar) + '22' }]}>
              {getAvatarSource(profile.avatar)
                ? <Image source={getAvatarSource(profile.avatar)!} style={styles.heroAvatarImg} resizeMode="cover" />
                : <Text style={styles.heroAvatar}>{profile.avatar}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{profile.name}</Text>
              <Text style={styles.heroSub}>Class {profile.grade} · {lang}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{profile.grade}</Text>
            </View>
          </View>
        ) : (
          <Pressable style={styles.noProfile} onPress={handleSwitchAccount}>
            <Text style={styles.noProfileText}>No profile selected. Tap to choose.</Text>
          </Pressable>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMid]}>
            <Text style={styles.statValue}>{avgScore !== null ? `${avgScore}%` : '—'}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profiles.length}</Text>
            <Text style={styles.statLabel}>Profiles</Text>
          </View>
        </View>

        {/* Active session */}
        {session && !session.topic?.includes('ended') && (
          <View style={styles.activeSessionCard}>
            <View style={styles.activeSessionDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeSessionTitle}>Active Session</Text>
              <Text style={styles.activeSessionSub}>{session.topic} · {session.code}</Text>
            </View>
            <Pressable onPress={() => nav.navigate('Lobby')} style={styles.rejoinBtn}>
              <Text style={styles.rejoinText}>Rejoin</Text>
            </Pressable>
          </View>
        )}

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LANGUAGE</Text>
          <View style={styles.langTray}>
            {LANGUAGES.map(l => (
              <Chip key={l} label={l} active={l === lang}
                    onPress={() => setLang(l)}
                    style={{ marginRight: 8, marginBottom: 8 }} />
            ))}
          </View>
        </View>

        {/* Account settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<Svg width={18} height={18} viewBox="0 0 24 24">
                <Circle cx="12" cy="8" r="4" stroke={colors.sky} strokeWidth="2" fill="none" />
                <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={colors.sky} strokeWidth="2" strokeLinecap="round" fill="none" />
              </Svg>}
              label="Switch Account"
              onPress={handleSwitchAccount}
            />
            <View style={styles.rowDivider} />
            <SettingRow
              icon={<Svg width={18} height={18} viewBox="0 0 24 24">
                <Path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke={colors.sage} strokeWidth="2" fill="none" />
                <Path d="M9 12l2 2 4-4" stroke={colors.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>}
              label="My Profile"
              value={profile?.name || '—'}
              onPress={handleSwitchAccount}
            />
            {quizResult && (
              <>
                <View style={styles.rowDivider} />
                <SettingRow
                  icon={<Svg width={18} height={18} viewBox="0 0 24 24">
                    <Rect x="3" y="3" width="18" height="18" rx="3" stroke={colors.gold} strokeWidth="2" fill="none" />
                    <Path d="M8 17v-5M12 17V9M16 17v-2" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" />
                  </Svg>}
                  label="View Current Report"
                  onPress={() => {}}
                />
              </>
            )}
          </View>
        </View>

        {/* Session */}
        {session && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SESSION</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                        stroke={colors.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>}
                label="Leave Current Session"
                tone="danger"
                onPress={handleLeaveSession}
              />
            </View>
          </View>
        )}

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>EduLens · Student App</Text>
          <Text style={styles.appInfoSub}>Offline-first · AI-powered</Text>
        </View>

      </ScrollView>
    </ScreenScaffold>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    ...shadow.soft, borderWidth: 1, borderColor: colors.line,
  },
  heroAvatar: { fontSize: 44 },
  heroAvatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  heroAvatarImg: { width: '100%', height: '100%' },
  heroName: { ...type.subhead, color: colors.ink, fontWeight: '700', fontSize: 18 },
  heroSub: { ...type.small, color: colors.inkSoft, marginTop: 2 },
  heroBadge: {
    backgroundColor: colors.skyWash, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  heroBadgeText: { ...type.caption, color: colors.skyDeep, fontWeight: '700' },
  noProfile: {
    backgroundColor: colors.paperDeep, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center',
  },
  noProfileText: { ...type.body, color: colors.inkSoft },
  statsRow: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm,
  },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.sm, alignItems: 'center',
    ...shadow.soft, borderWidth: 1, borderColor: colors.line,
  },
  statBoxMid: { borderColor: colors.skyWash, backgroundColor: colors.skyWash },
  statValue: { ...type.subhead, color: colors.ink, fontWeight: '800', fontSize: 20 },
  statLabel: { ...type.caption, color: colors.inkFaint, marginTop: 2 },
  activeSessionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8FFE8', borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: '#A0E0A0',
  },
  activeSessionDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF50', marginRight: spacing.sm,
  },
  activeSessionTitle: { ...type.smallBold, color: '#2D6A2D' },
  activeSessionSub: { ...type.small, color: '#4CAF50' },
  rejoinBtn: {
    backgroundColor: colors.sky, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  rejoinText: { ...type.smallBold, color: colors.white },
  section: { marginBottom: spacing.sm },
  sectionTitle: {
    ...type.caption, color: colors.inkFaint, marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  langTray: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md,
    padding: spacing.sm,
  },
  settingsCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    ...shadow.soft, borderWidth: 1, borderColor: colors.line,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.sm,
  },
  settingIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.paperDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { ...type.body, fontWeight: '500' },
  settingValue: { ...type.small, color: colors.inkSoft, marginRight: spacing.xs },
  rowDivider: { height: 1, backgroundColor: colors.line, marginLeft: spacing.md + 32 + spacing.sm },
  appInfo: { alignItems: 'center', marginTop: spacing.lg },
  appInfoText: { ...type.caption, color: colors.inkFaint, fontWeight: '700' },
  appInfoSub: { ...type.caption, color: colors.inkFaint, fontWeight: '400', marginTop: 2 },
})
