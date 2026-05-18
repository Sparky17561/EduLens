import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useProfileStore } from '../store/profileStore'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'
import { AVATAR_OPTIONS, DEFAULT_AVATAR, getAvatarSource, getAvatarTint } from '../theme/avatars'

type Nav = NativeStackNavigationProp<RootStackParamList, 'NewProfile'>

const GRADES = ['6', '7', '8', '9', '10']
const LANGS  = ['English', 'हिंदी', 'தமிழ்', 'বাংলা', 'Kiswahili']

export default function NewProfileScreen() {
  const nav = useNavigation<Nav>()
  const { addProfile } = useProfileStore()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR)
  const [grade, setGrade] = useState('7')
  const [lang, setLang] = useState('English')

  const handleContinue = () => {
    if (name.trim().length < 2) {
      Alert.alert('Enter Your Name', 'Please enter at least 2 characters.')
      return
    }
    const profileId = `local-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    nav.navigate('PinUnlock', {
      mode: 'create',
      profileId,
      profileData: { id: profileId, name: name.trim(), avatar, grade, lang, pin: '' }
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.kicker}>NEW LEARNER</Text>
      <Text style={styles.headline}>Create a Profile</Text>

      {/* Live preview */}
      <View style={styles.preview}>
        <View style={[styles.previewAvatarWrap, { backgroundColor: getAvatarTint(avatar) + '22' }]}>
          {getAvatarSource(avatar)
            ? <Image source={getAvatarSource(avatar)!} style={styles.previewAvatarImg} resizeMode="cover" />
            : <Text style={styles.previewAvatarEmoji}>{avatar}</Text>}
        </View>
        <Text style={styles.previewName}>{name || 'Your Name'}</Text>
        <Text style={styles.previewGrade}>Class {grade} · {lang}</Text>
      </View>

      {/* Name */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>WHAT IS YOUR NAME?</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={t => setName(t.slice(0, 20))}
          placeholder="Enter your name..."
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="words"
        />
      </View>

      {/* Avatar */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>PICK YOUR AVATAR</Text>
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map(opt => (
            <Pressable
              key={opt.id}
              onPress={() => setAvatar(opt.id)}
              style={[
                styles.avatarBtn,
                { backgroundColor: opt.color + '1A' },
                avatar === opt.id && [styles.avatarBtnActive, { borderColor: opt.color }],
              ]}
            >
              <Image source={opt.source} style={styles.avatarImg} resizeMode="cover" />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Grade */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>YOUR CLASS</Text>
        <View style={styles.chipRow}>
          {GRADES.map(g => (
            <Pressable
              key={g}
              onPress={() => setGrade(g)}
              style={[styles.chip, grade === g && styles.chipActive]}
            >
              <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>Class {g}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Language */}
      <View style={styles.fieldCard}>
        <Text style={styles.fieldLabel}>PREFERRED LANGUAGE</Text>
        <View style={styles.chipRow}>
          {LANGS.map(l => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[styles.chip, lang === l && styles.chipActive]}
            >
              <Text style={[styles.chipText, lang === l && styles.chipTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.85 : 1 }, name.trim().length < 2 && styles.continueBtnDisabled]}
        onPress={handleContinue}
        disabled={name.trim().length < 2}
      >
        <Text style={styles.continueBtnText}>Set Your Secret PIN →</Text>
      </Pressable>

      <Text style={styles.note}>Your profile is saved only on this device. Nothing is sent anywhere.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FFF4' },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  backBtn: { marginTop: 52, marginBottom: 16 },
  backText: { ...type.bodyBold, color: colors.coral },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: colors.coralDeep, marginBottom: 6 },
  headline: { fontFamily: type.hero?.fontFamily, fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  preview: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewAvatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  previewAvatarImg: { width: '100%', height: '100%' },
  previewAvatarEmoji: { fontSize: 48 },
  previewName: { ...type.subhead, fontWeight: '700', color: colors.ink },
  previewGrade: { ...type.small, color: colors.inkSoft, marginTop: 4 },
  fieldCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
    borderWidth: 1, borderColor: colors.line,
  },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.coralDeep, marginBottom: 10 },
  input: {
    ...type.body, fontSize: 16, color: colors.ink,
    padding: 10, backgroundColor: colors.paper,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
  },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarBtn: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  avatarBtnActive: { borderColor: colors.coral },
  avatarImg: { width: '100%', height: '100%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1.5, borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  chipText: { ...type.smallBold, color: colors.inkSoft },
  chipTextActive: { color: colors.white },
  continueBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: { ...type.subhead, color: colors.white, fontWeight: '700' },
  note: { ...type.small, color: colors.inkFaint, textAlign: 'center' },
})
