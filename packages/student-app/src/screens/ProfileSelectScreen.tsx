import React from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useProfileStore, Profile } from '../store/profileStore'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'
import { getAvatarSource, getAvatarTint } from '../theme/avatars'

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProfileSelect'>

export default function ProfileSelectScreen() {
  const nav = useNavigation<Nav>()
  const { profiles, setActiveProfile } = useProfileStore()

  const handleSelect = (profile: Profile) => {
    setActiveProfile(profile.id)
    nav.navigate('PinUnlock', { mode: 'enter', profileId: profile.id })
  }

  const handleNew = () => {
    nav.navigate('NewProfile')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>CHOOSE YOUR PROFILE</Text>
        <Text style={styles.headline}>Who is learning today?</Text>
        <Text style={styles.sub}>Each learner has their own space and progress</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {profiles.map(profile => (
          <Pressable
            key={profile.id}
            style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            onPress={() => handleSelect(profile)}
          >
            <View style={[styles.avatarWrap, { backgroundColor: getAvatarTint(profile.avatar) + '22' }]}>
              {getAvatarSource(profile.avatar)
                ? <Image source={getAvatarSource(profile.avatar)!} style={styles.avatarImg} resizeMode="cover" />
                : <Text style={styles.avatar}>{profile.avatar}</Text>}
            </View>
            <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>Class {profile.grade}</Text>
            </View>
          </Pressable>
        ))}

        {/* New Learner card */}
        <Pressable
          style={({ pressed }) => [styles.card, styles.newCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          onPress={handleNew}
        >
          <View style={[styles.avatarWrap, styles.newAvatarWrap]}>
            <Text style={styles.plusIcon}>＋</Text>
          </View>
          <Text style={[styles.name, { color: colors.coralDeep }]}>New Learner</Text>
          <Text style={styles.createText}>Create a profile</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const CARD_W = 148

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  kicker: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2,
    color: colors.coralDeep, marginBottom: 8,
  },
  headline: {
    fontFamily: type.hero?.fontFamily,
    fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 6,
  },
  sub: { ...type.small, color: colors.inkSoft },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  newCard: {
    borderStyle: 'dashed',
    borderColor: colors.coral,
    backgroundColor: '#FFF3EE',
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFF3EE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  newAvatarWrap: { backgroundColor: '#FFE8DC' },
  avatar: { fontSize: 34 },
  avatarImg: { width: '100%', height: '100%' },
  plusIcon: { fontSize: 28, color: colors.coral, fontWeight: '300' },
  name: { ...type.subhead, color: colors.ink, textAlign: 'center', marginBottom: 6 },
  gradeBadge: {
    backgroundColor: '#E8F4FF',
    borderRadius: radius.pill,
    paddingVertical: 2, paddingHorizontal: 10,
  },
  gradeText: { fontSize: 11, fontWeight: '600', color: colors.skyDeep },
  createText: { ...type.small, color: colors.coralDeep },
})
