import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import { colors, radius, type, spacing, shadow } from '../theme/tokens';
import { avatars } from '../theme/illustrations';

/* ------------------------------------------------------------------ *
 * Avatar — renders a student's chosen anime-animal avatar.
 * Uses a real PNG when present in the registry, else a soft SVG mascot.
 * ------------------------------------------------------------------ */
export function Avatar({ name = 'fox', size = 72, ring = true, style = null }) {
  const meta = avatars[name] || avatars.fox;
  return (
    <View
      style={[
        styles.avatarWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: meta.color + '22',
          borderWidth: ring ? 3 : 0,
          borderColor: meta.color + '55',
        },
        style,
      ]}
    >
      {meta.source ? (
        <Image
          source={meta.source}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <AvatarMotif kind={meta.motif} color={meta.color} size={size * 0.62} />
      )}
    </View>
  );
}

/* Simple, friendly SVG creature faces — placeholder until real avatars added. */
function AvatarMotif({ kind, color, size }) {
  const s = { width: size, height: size, viewBox: '0 0 100 100' };
  const dark = '#2E2A33';
  const earsByKind = {
    fox:    <Path d="M22 40 L30 14 L44 34Z M78 40 L70 14 L56 34Z" fill={color} />,
    cat:    <Path d="M24 38 L30 16 L46 32Z M76 38 L70 16 L54 32Z" fill={color} />,
    owl:    <Path d="M28 30 Q34 14 44 26 M72 30 Q66 14 56 26" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />,
    deer:   <Path d="M30 28 Q22 8 34 18 M70 28 Q78 8 66 18" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />,
    rabbit: <Path d="M38 30 Q30 2 42 26Z M62 30 Q70 2 58 26Z" fill={color} />,
    bird:   <Path d="M50 14 L58 26 L42 26Z" fill={color} />,
    bear:   <><Circle cx="30" cy="28" r="11" fill={color} /><Circle cx="70" cy="28" r="11" fill={color} /></>,
    turtle: <Path d="M34 30 Q50 18 66 30" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />,
  };
  return (
    <Svg {...s}>
      {earsByKind[kind] || earsByKind.fox}
      <Circle cx="50" cy="54" r="30" fill={color} />
      <Circle cx="50" cy="54" r="30" fill="rgba(255,255,255,0.18)" />
      <Circle cx="40" cy="50" r="4.5" fill={dark} />
      <Circle cx="60" cy="50" r="4.5" fill={dark} />
      <Circle cx="41.5" cy="48.5" r="1.6" fill="#fff" />
      <Circle cx="61.5" cy="48.5" r="1.6" fill="#fff" />
      <Path d="M44 64 Q50 70 56 64" stroke={dark} strokeWidth="3"
            fill="none" strokeLinecap="round" />
      <Circle cx="32" cy="60" r="5" fill="rgba(255,255,255,0.35)" />
      <Circle cx="68" cy="60" r="5" fill="rgba(255,255,255,0.35)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ *
 * ScreenHeader — consistent top bar: back arrow, title, optional right slot.
 * ------------------------------------------------------------------ */
export function ScreenHeader({ title, onBack = null, right = null, dark = false, kicker = null }) {
  const fg = dark ? colors.white : colors.ink;
  const sub = dark ? 'rgba(255,255,255,0.65)' : colors.inkFaint;
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.headerBack,
            {
              backgroundColor: dark ? 'rgba(255,255,255,0.14)' : colors.card,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M15 5 L8 12 L15 19" stroke={fg} strokeWidth="2.4"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      ) : (
        <View style={{ width: 44 }} />
      )}

      <View style={styles.headerCenter}>
        {kicker ? (
          <Text style={[type.caption, { color: sub }]}>{kicker}</Text>
        ) : null}
        <Text style={[type.subhead, { color: fg }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.headerRight}>{right || <View style={{ width: 44 }} />}</View>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * PinPad — large, child-friendly numeric / pattern entry.
 * Shows filled dots and a soft numeric keypad.
 * ------------------------------------------------------------------ */
export function PinPad({ length = 4, value = '', onChange, tone = colors.sky }) {
  const press = (n) => {
    if (value.length < length) onChange(value + n);
  };
  const back = () => onChange(value.slice(0, -1));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del'];

  return (
    <View>
      {/* dots */}
      <View style={styles.pinDots}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              i < value.length
                ? { backgroundColor: tone, borderColor: tone }
                : { backgroundColor: 'transparent', borderColor: colors.line },
            ]}
          />
        ))}
      </View>

      {/* keypad */}
      <View style={styles.keypad}>
        {keys.map((k, i) => {
          if (k === null) return <View key={i} style={styles.key} />;
          if (k === 'del') {
            return (
              <Pressable
                key={i}
                onPress={back}
                style={({ pressed }) => [styles.key, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path d="M9 5 L20 5 L20 19 L9 19 L3 12Z"
                        stroke={colors.inkSoft} strokeWidth="2" fill="none"
                        strokeLinejoin="round" />
                  <Path d="M11 9 L16 14 M16 9 L11 14"
                        stroke={colors.inkSoft} strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={i}
              onPress={() => press(k)}
              style={({ pressed }) => [
                styles.key,
                styles.keyFilled,
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
            >
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * SpeakerButton — floating audio control for the Lesson Studio.
 * ------------------------------------------------------------------ */
export function SpeakerButton({ playing, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.speaker,
        { transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d="M4 9 H8 L13 5 V19 L8 15 H4Z" fill={colors.white} />
        {playing ? (
          <>
            <Path d="M16 8 Q19 12 16 16" stroke={colors.white} strokeWidth="2"
                  fill="none" strokeLinecap="round" />
            <Path d="M18.5 6 Q23 12 18.5 18" stroke={colors.white} strokeWidth="2"
                  fill="none" strokeLinecap="round" />
          </>
        ) : (
          <Path d="M17 9 L21 15 M21 9 L17 15" stroke={colors.white}
                strokeWidth="2" strokeLinecap="round" />
        )}
      </Svg>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * Stat — a small number + label block for dashboards.
 * ------------------------------------------------------------------ */
export function Stat({ value, label, tone = colors.sky }) {
  return (
    <View style={styles.stat}>
      <Text style={[type.hero, { color: tone, fontSize: 30 }]}>{value}</Text>
      <Text style={[type.small, { color: colors.inkSoft, textAlign: 'center' }]}>
        {label}
      </Text>
    </View>
  );
}

/* MasteryBar — horizontal progress bar for topic mastery rows. */
export function MasteryBar({ pct, tone }) {
  const color =
    tone || (pct >= 70 ? colors.sage : pct >= 40 ? colors.gold : colors.coral);
  return (
    <View style={styles.masteryTrack}>
      <View
        style={[
          styles.masteryFill,
          { width: `${Math.max(6, Math.min(100, pct))}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  headerBack: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.soft,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { alignItems: 'flex-end', minWidth: 44 },

  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, marginHorizontal: 9,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    aspectRatio: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  keyFilled: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    ...shadow.soft,
  },
  keyText: { ...type.title, color: colors.ink },

  speaker: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.lift,
  },

  stat: { alignItems: 'center', flex: 1 },

  masteryTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.lineSoft,
    overflow: 'hidden',
  },
  masteryFill: { height: '100%', borderRadius: 5 },
});

export default { Avatar, ScreenHeader, PinPad, SpeakerButton, Stat, MasteryBar };
