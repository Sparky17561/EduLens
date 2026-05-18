import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  colors, gradients, spacing, radius, type, shadow,
} from '../theme/tokens';

/* ------------------------------------------------------------------ *
 * ScreenScaffold
 * The shared page frame. A soft gradient sky behind every screen,
 * a safe-area aware body, and an optional scroll container.
 * ------------------------------------------------------------------ */
export function ScreenScaffold({
  children,
  tint = 'morning',
  scroll = true,
  padded = true,
  footer = null,
  dark = false,
}) {
  const Body = scroll ? ScrollView : View;
  return (
    <View style={styles.scaffold}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={gradients[tint] || gradients.morning}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GrainOverlay />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.webCenter}>
          <Body
            style={styles.body}
            contentContainerStyle={[
              scroll && styles.scrollContent,
              padded && { paddingHorizontal: spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </Body>
          {footer && (
            <View style={[styles.footer, padded && { paddingHorizontal: spacing.lg }]}>
              {footer}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

/* A faint dotted texture for storybook-paper depth. */
function GrainOverlay() {
  return (
    <View pointerEvents="none" style={styles.grain}>
      {Array.from({ length: 7 }).map((_, r) => (
        <View key={r} style={styles.grainRow}>
          {Array.from({ length: 5 }).map((__, c) => (
            <View key={c} style={styles.grainDot} />
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * PrimaryButton — the big, friendly, child-first action button.
 * Variants: coral (default), sky, sage, ghost.
 * ------------------------------------------------------------------ */
export function PrimaryButton({
  label, onPress, variant = 'coral', icon = null, size = 'lg', style = null, disabled = false,
}) {
  const palette = {
    coral: { bg: colors.coral, deep: colors.coralDeep, text: colors.white },
    sky:   { bg: colors.sky,   deep: colors.skyDeep,   text: colors.white },
    sage:  { bg: colors.sage,  deep: colors.sageDeep,  text: colors.white },
    gold:  { bg: colors.gold,  deep: '#C9963F',        text: colors.ink   },
  }[variant] || { bg: colors.coral, deep: colors.coralDeep, text: colors.white };

  const h = size === 'lg' ? 64 : size === 'md' ? 54 : 46;

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.ghostBtn,
          { height: h, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
          style,
        ]}
      >
        {icon}
        <Text style={[type.button, { color: colors.inkSoft, marginLeft: icon ? 8 : 0 }]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      <View style={[styles.btnShadowWrap, { borderRadius: radius.lg }]}>
        {/* deep base gives the button a soft 3D "pill" lip */}
        <View style={[styles.btnBase, { backgroundColor: palette.deep, height: h }]} />
        <LinearGradient
          colors={[palette.bg, palette.deep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.btnFace, { height: h }]}
        >
          {icon}
          <Text
            style={[
              type.button,
              { color: palette.text, marginLeft: icon ? 10 : 0 },
            ]}
          >
            {label}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * Card — raised white storybook card with soft warm shadow.
 * ------------------------------------------------------------------ */
export function Card({ children = null, style = null, soft = false, onPress = null, tone = null }) {
  const bg = tone || (soft ? colors.cardSoft : colors.card);
  const inner = (
    <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

/* ------------------------------------------------------------------ *
 * Badge — small status pill. Used for the "Works Offline" indicator,
 * grade tags, counts, etc.
 * ------------------------------------------------------------------ */
export function Badge({ label, tone = 'sage', icon = null, style = null }) {
  const palette = {
    sage:  { bg: colors.sageWash,  fg: colors.sageDeep },
    sky:   { bg: colors.skyWash,   fg: colors.skyDeep },
    coral: { bg: colors.coralWash, fg: colors.coralDeep },
    gold:  { bg: colors.goldWash,  fg: '#A87A2C' },
    ink:   { bg: 'rgba(255,255,255,0.7)', fg: colors.inkSoft },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      {icon}
      <Text style={[type.caption, { color: palette.fg, marginLeft: icon ? 6 : 0 }]}>
        {label}
      </Text>
    </View>
  );
}

/* OfflineBadge — the recurring "Works Offline" indicator with a leaf dot. */
export function OfflineBadge({ style = null }) {
  return (
    <View style={[styles.offline, style]}>
      <View style={styles.offlineDot} />
      <Text style={[type.caption, { color: colors.sageDeep }]}>WORKS OFFLINE</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Chip — tappable selector pill (language picker, options).
 * ------------------------------------------------------------------ */
export function Chip({ label, active, onPress, icon = null, style = null }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        { opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          type.smallBold,
          { color: active ? colors.white : colors.inkSoft, marginLeft: icon ? 6 : 0 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * SectionTitle — editorial "WordPress blog" style heading with a
 * small kicker label above it.
 * ------------------------------------------------------------------ */
export function SectionTitle({ kicker = null, title, align = 'left', style = null }) {
  return (
    <View style={[{ alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}>
      {kicker ? (
        <View style={styles.kickerRow}>
          <View style={styles.kickerLine} />
          <Text style={styles.kicker}>{kicker}</Text>
        </View>
      ) : null}
      <Text
        style={[
          type.title,
          { color: colors.ink, textAlign: align },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * IconButton — circular soft button for back / close / actions.
 * ------------------------------------------------------------------ */
export function IconButton({ onPress, children, tone = 'paper', style = null }) {
  const bg = tone === 'paper' ? colors.card : 'rgba(255,255,255,0.18)';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: bg, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/* BackArrow — tiny reusable SVG glyph. */
export function BackArrow({ color = colors.ink }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M15 5 L8 12 L15 19" stroke={color} strokeWidth="2.4"
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ProgressDots — step indicator (used in onboarding & quiz). */
export function ProgressDots({ total, index, tone = colors.coral }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === index
              ? { backgroundColor: tone, width: 22 }
              : { backgroundColor: colors.line },
          ]}
        />
      ))}
    </View>
  );
}

/* Divider — a hairline with an optional centered motif. */
export function Divider({ label }) {
  if (!label) return <View style={styles.divider} />;
  return (
    <View style={styles.dividerLabeled}>
      <View style={styles.dividerLine} />
      <Text style={[type.caption, { color: colors.inkFaint, marginHorizontal: 12 }]}>
        {label}
      </Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  scaffold: { flex: 1, backgroundColor: colors.paper },
  safe: { flex: 1, alignItems: 'center' },
  webCenter: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 720 : undefined,
    alignSelf: 'center',
  },
  body: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  footer: {
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xs : spacing.md,
  },

  grain: { ...StyleSheet.absoluteFillObject, opacity: 0.5, justifyContent: 'space-around' },
  grainRow: { flexDirection: 'row', justifyContent: 'space-around' },
  grainDot: {
    width: 2, height: 2, borderRadius: 1,
    backgroundColor: 'rgba(46,42,51,0.05)',
  },

  btnShadowWrap: { ...shadow.card },
  btnBase: {
    position: 'absolute', left: 0, right: 0, bottom: -3,
    borderRadius: radius.lg,
  },
  btnFace: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: spacing.lg,
  },

  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sageWash,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  offlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.sage, marginRight: 7,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.sky,
    borderColor: colors.skyDeep,
  },

  kickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  kickerLine: {
    width: 22, height: 2.5, borderRadius: 2,
    backgroundColor: colors.coral, marginRight: 8,
  },
  kicker: {
    ...type.caption,
    color: colors.coralDeep,
    textTransform: 'uppercase',
  },

  iconBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.soft,
  },

  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    height: 7, width: 7, borderRadius: 4, marginHorizontal: 3,
  },

  divider: {
    height: 1, backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  dividerLabeled: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
});

export default {
  ScreenScaffold, PrimaryButton, Card, Badge, OfflineBadge,
  Chip, SectionTitle, IconButton, BackArrow, ProgressDots, Divider,
};
