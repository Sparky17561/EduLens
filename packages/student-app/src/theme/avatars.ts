import { ImageSourcePropType } from 'react-native'

export type AvatarId =
  | 'fox' | 'owl' | 'deer' | 'rabbit'
  | 'cat' | 'bird' | 'bear' | 'turtle'

export const AVATAR_OPTIONS: { id: AvatarId; source: ImageSourcePropType; color: string }[] = [
  { id: 'fox',    source: require('../../assets/avatars/fox.png'),    color: '#E8836B' },
  { id: 'owl',    source: require('../../assets/avatars/owl.png'),    color: '#6C7BD6' },
  { id: 'deer',   source: require('../../assets/avatars/deer.png'),   color: '#E4B363' },
  { id: 'rabbit', source: require('../../assets/avatars/rabbit.png'), color: '#7CA982' },
  { id: 'cat',    source: require('../../assets/avatars/cat.png'),    color: '#D26449' },
  { id: 'bird',   source: require('../../assets/avatars/bird.png'),   color: '#4A5AB8' },
  { id: 'bear',   source: require('../../assets/avatars/bear.png'),   color: '#5C8A62' },
  { id: 'turtle', source: require('../../assets/avatars/turtle.png'), color: '#A9B4EC' },
]

const SOURCE_MAP: Record<string, ImageSourcePropType> =
  Object.fromEntries(AVATAR_OPTIONS.map(a => [a.id, a.source]))

const COLOR_MAP: Record<string, string> =
  Object.fromEntries(AVATAR_OPTIONS.map(a => [a.id, a.color]))

export const DEFAULT_AVATAR: AvatarId = 'fox'

export function getAvatarSource(key?: string | null): ImageSourcePropType | null {
  if (!key) return null
  return SOURCE_MAP[key] ?? null
}

export function getAvatarTint(key?: string | null): string {
  if (!key) return '#E8836B'
  return COLOR_MAP[key] ?? '#E8836B'
}
