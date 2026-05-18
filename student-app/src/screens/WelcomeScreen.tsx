import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { ScreenScaffold, OfflineBadge, Chip } from '../components/ui'
import { ScreenHeader } from '../components/widgets'
import Illustration from '../components/Illustration'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>

const LANGUAGES = ['English', 'हिंदी', 'தமிழ்', 'বাংলা', 'Kiswahili']

export default function WelcomeScreen() {
  const nav = useNavigation<Nav>()
  const { setStudent } = useSessionStore()
  const [name, setName] = useState('')
  const [lang, setLang] = useState('English')
  const [showLangs, setShowLangs] = useState(false)

  const validateName = () => {
    if (!name.trim()) {
      Alert.alert('Enter Your Name', 'Please fill in your name before choosing a role card.')
      return false
    }
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
    <ScreenScaffold tint="dawn">
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* top bar: brand + language */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.mark}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Circle cx="12" cy="12" r="9" stroke={colors.white} strokeWidth="2.4" fill="none" />
                <Circle cx="12" cy="12" r="3.2" fill={colors.white} />
              </Svg>
            </View>
            <Text style={styles.brand}>EduLens</Text>
          </View>
          <Pressable style={styles.langChip} onPress={() => setShowLangs((s) => !s)}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Circle cx="12" cy="12" r="9" stroke={colors.skyDeep} strokeWidth="2" fill="none" />
              <Path d="M3 12 H21 M12 3 Q17 8 12 21 Q7 8 12 3"
                    stroke={colors.skyDeep} strokeWidth="1.6" fill="none" />
            </Svg>
            <Text style={styles.langChipText}>{lang}</Text>
          </Pressable>
        </View>

        {showLangs && (
          <View style={styles.langTray}>
            {LANGUAGES.map((l) => (
              <Chip
                key={l}
                label={l}
                active={l === lang}
                onPress={() => { setLang(l); setShowLangs(false) }}
                style={{ marginRight: 8, marginBottom: 8 }}
              />
            ))}
          </View>
        )}

        {/* hero Ghibli illustration */}
        <View style={styles.hero}>
          <Illustration name="welcome" height={200} rounded={radius.lg} />
        </View>

        {/* editorial headline */}
        <ScreenHeader title="" kicker="WELCOME TO EDULENS" />
        <Text style={styles.headline}>
          Every page holds a{'\n'}story waiting to be understood
        </Text>
        
        {/* Name entry field inside storybook cards */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>WHAT IS YOUR NAME?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name..."
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="words"
          />
        </View>

        {/* role cards */}
        <RoleCard
          title="Scan QR Code to Join"
          desc="Point camera at your teacher's session screen"
          tone={colors.coral}
          wash={colors.paperDeep}
          onPress={handleQR}
          glyph={
            <Path d="M4 8 V4 H8 M16 4 H20 V8 M20 16 V20 H16 M8 20 H4 V16"
                  stroke={colors.inkSoft} strokeWidth="2.2"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
          }
        />
        <RoleCard
          title="Enter Session Code"
          desc="Type the 6-character room code from the board"
          tone={colors.sky}
          wash={colors.paperDeep}
          onPress={handleCode}
          glyph={
            <Path d="M5 20 Q5 13 12 13 Q19 13 19 20"
                  stroke={colors.inkSoft} strokeWidth="2.2"
                  fill="none" strokeLinecap="round" />
          }
        />

        <OfflineBadge style={{ alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.lg }} />
      </ScrollView>
    </ScreenScaffold>
  )
}

function RoleCard({ title, desc, onPress, tone, wash, glyph }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.role,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.roleIcon, { backgroundColor: wash }]}>
        <Svg width={28} height={28} viewBox="0 0 24 24">{glyph}</Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDesc}>{desc}</Text>
      </View>
      <View style={[styles.roleArrow, { backgroundColor: tone }]}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d="M9 5 L16 12 L9 19" stroke={colors.white} strokeWidth="2.6"
                fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  mark: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  brand: { fontFamily: type.heading.fontFamily, fontSize: 20, color: colors.ink, fontWeight: '700' },
  langChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  langChipText: {
    ...type.smallBold, color: colors.skyDeep, marginLeft: 6,
  },
  langTray: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  hero: { marginTop: spacing.xs, marginBottom: spacing.md, alignItems: 'center' },
  headline: {
    fontFamily: type.hero.fontFamily,
    fontSize: 26, lineHeight: 32,
    color: colors.ink,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  inputLabel: {
    ...type.caption,
    color: colors.coralDeep,
    marginBottom: 8,
  },
  input: {
    ...type.body,
    fontSize: 16,
    color: colors.ink,
    padding: 10,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  roleIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleTitle: { ...type.subhead, color: colors.ink },
  roleDesc: { ...type.small, color: colors.inkSoft, marginTop: 2 },
  roleArrow: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
})
