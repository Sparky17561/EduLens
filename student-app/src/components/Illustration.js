import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Ellipse, Rect } from 'react-native-svg';
import { colors, gradients, radius, type, spacing } from '../theme/tokens';
import { illustrations } from '../theme/illustrations';

/**
 * <Illustration />
 * ----------------
 * The single component every screen uses to show anime art.
 *
 *   <Illustration name="splash" height={320} />
 *
 * If the registered illustration has a real `source` (you've added the PNG),
 * it renders the image. Otherwise it draws a calm gradient + line-art motif
 * placeholder so the layout always looks intentional during development.
 *
 * Props:
 *   name     - key from illustrations registry (theme/illustrations.js)
 *   height   - fixed height; width fills the parent
 *   rounded  - border radius (default radius.lg)
 *   overlay  - if true, lays a soft top-to-bottom scrim for text legibility
 */
export default function Illustration({
  name,
  height = 280,
  rounded = radius.lg,
  overlay = false,
  style = null,
}) {
  const meta = illustrations[name] || illustrations.empty;
  const tint = gradients[meta.tint] || gradients.morning;

  return (
    <View style={[styles.wrap, { height, borderRadius: rounded }, style]}>
      {meta.source ? (
        <Image
          source={meta.source}
          style={[styles.fill, { borderRadius: rounded }]}
          resizeMode="cover"
        />
      ) : (
        <Placeholder meta={meta} tint={tint} rounded={rounded} />
      )}

      {overlay && (
        <LinearGradient
          colors={['transparent', 'rgba(46,42,51,0.0)', 'rgba(46,42,51,0.45)']}
          locations={[0, 0.55, 1]}
          style={[styles.fill, { borderRadius: rounded }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

/**
 * The development placeholder. A warm gradient field, a faint line-art motif
 * drawn in SVG, and a small caption so anyone reviewing the build knows
 * exactly which Gemini illustration belongs here.
 */
function Placeholder({ meta, tint, rounded }) {
  return (
    <LinearGradient
      colors={tint}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.fill, styles.placeholderInner, { borderRadius: rounded }]}
    >
      <Motif kind={meta.motif} />
      <View style={styles.tagWrap}>
        <View style={styles.tagDot} />
        <Text style={styles.tagText} numberOfLines={2}>
          {meta.label}
        </Text>
      </View>
    </LinearGradient>
  );
}

/**
 * Lightweight SVG line-art motifs. Deliberately simple and monochrome so the
 * placeholder reads as "art goes here" without competing with the real UI.
 */
function Motif({ kind }) {
  const stroke = 'rgba(46,42,51,0.30)';
  const soft = 'rgba(46,42,51,0.14)';
  const common = { width: 132, height: 132, viewBox: '0 0 100 100' };

  switch (kind) {
    case 'lantern':
      return (
        <Svg {...common}>
          <Path d="M50 14 V24" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
          <Rect x="36" y="24" width="28" height="36" rx="10" stroke={stroke} strokeWidth="2.4" fill={soft} />
          <Circle cx="50" cy="42" r="8" fill="rgba(228,179,99,0.55)" />
          <Path d="M40 60 Q50 70 60 60" stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <Path d="M30 84 H70" stroke={soft} strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case 'tree':
    case 'bloom':
      return (
        <Svg {...common}>
          <Path d="M50 86 V52" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <Circle cx="50" cy="38" r="22" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Circle cx="34" cy="46" r="13" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Circle cx="66" cy="46" r="13" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Circle cx="50" cy="34" r="5" fill="rgba(228,179,99,0.6)" />
        </Svg>
      );
    case 'window':
      return (
        <Svg {...common}>
          <Rect x="26" y="20" width="48" height="60" rx="8" stroke={stroke} strokeWidth="2.4" fill={soft} />
          <Path d="M50 20 V80 M26 50 H74" stroke={stroke} strokeWidth="2.2" />
          <Circle cx="62" cy="34" r="6" fill="rgba(228,179,99,0.55)" />
        </Svg>
      );
    case 'seed':
      return (
        <Svg {...common}>
          <Path d="M50 84 V50" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <Path d="M50 56 Q34 50 34 36 Q50 38 50 56Z" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Path d="M50 50 Q66 44 66 30 Q50 32 50 50Z" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Path d="M32 86 H68" stroke={soft} strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case 'door':
      return (
        <Svg {...common}>
          <Path d="M28 82 L28 44 Q50 22 72 44 L72 82Z" stroke={stroke} strokeWidth="2.4" fill={soft} />
          <Rect x="42" y="54" width="16" height="28" rx="8" fill="rgba(228,179,99,0.5)" />
          <Circle cx="54" cy="68" r="2.4" fill={stroke} />
        </Svg>
      );
    case 'book':
      return (
        <Svg {...common}>
          <Path d="M50 30 Q36 22 22 28 V72 Q36 66 50 74Z" stroke={stroke} strokeWidth="2.4" fill={soft} />
          <Path d="M50 30 Q64 22 78 28 V72 Q64 66 50 74Z" stroke={stroke} strokeWidth="2.4" fill={soft} />
          <Path d="M50 30 V74" stroke={stroke} strokeWidth="2.4" />
          <Circle cx="50" cy="20" r="4" fill="rgba(228,179,99,0.6)" />
        </Svg>
      );
    case 'frame':
      return (
        <Svg {...common}>
          <Rect x="24" y="28" width="52" height="44" rx="6" stroke={stroke} strokeWidth="2.4" strokeDasharray="6 6" fill="none" />
          <Circle cx="24" cy="28" r="3" fill="rgba(228,179,99,0.7)" />
          <Circle cx="76" cy="28" r="3" fill="rgba(228,179,99,0.7)" />
          <Circle cx="24" cy="72" r="3" fill="rgba(228,179,99,0.7)" />
          <Circle cx="76" cy="72" r="3" fill="rgba(228,179,99,0.7)" />
        </Svg>
      );
    case 'owl':
      return (
        <Svg {...common}>
          <Path d="M30 50 Q30 26 50 26 Q70 26 70 50 Q70 76 50 76 Q30 76 30 50Z" fill={soft} stroke={stroke} strokeWidth="2.4" />
          <Circle cx="42" cy="46" r="8" fill={colors.paper} stroke={stroke} strokeWidth="2" />
          <Circle cx="58" cy="46" r="8" fill={colors.paper} stroke={stroke} strokeWidth="2" />
          <Circle cx="42" cy="46" r="3" fill={stroke} />
          <Circle cx="58" cy="46" r="3" fill={stroke} />
          <Path d="M46 56 L50 60 L54 56" stroke={stroke} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'stones':
      return (
        <Svg {...common}>
          <Ellipse cx="28" cy="58" rx="12" ry="7" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Ellipse cx="50" cy="48" rx="12" ry="7" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Ellipse cx="72" cy="58" rx="12" ry="7" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Path d="M14 72 Q50 64 86 72" stroke={stroke} strokeWidth="2.2" fill="none" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path d="M50 22 L57 42 L78 42 L61 55 L67 76 L50 63 L33 76 L39 55 L22 42 L43 42Z"
                fill="rgba(228,179,99,0.5)" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" />
        </Svg>
      );
    case 'boat':
      return (
        <Svg {...common}>
          <Path d="M26 56 L74 56 L62 72 L38 72Z" fill={soft} stroke={stroke} strokeWidth="2.4" />
          <Path d="M50 56 L50 30 L68 50Z" fill="rgba(228,131,107,0.4)" stroke={stroke} strokeWidth="2.2" />
          <Path d="M16 78 Q50 70 84 78" stroke={stroke} strokeWidth="2.2" fill="none" />
        </Svg>
      );
    case 'hilltop':
      return (
        <Svg {...common}>
          <Circle cx="50" cy="38" r="13" fill="rgba(228,179,99,0.5)" />
          <Path d="M14 78 Q40 50 60 64 Q74 72 86 60 L86 86 L14 86Z" fill={soft} stroke={stroke} strokeWidth="2.2" />
        </Svg>
      );
    case 'plane':
      return (
        <Svg {...common}>
          <Path d="M22 50 L78 30 L52 70 L48 54Z" fill={soft} stroke={stroke} strokeWidth="2.4" strokeLinejoin="round" />
          <Path d="M48 54 L78 30" stroke={stroke} strokeWidth="2.2" />
          <Path d="M30 74 Q40 68 50 72" stroke={stroke} strokeWidth="2" strokeDasharray="4 5" fill="none" />
        </Svg>
      );
    case 'constellation':
      return (
        <Svg {...common}>
          <Path d="M28 34 L46 50 L40 72 L66 64 L74 38" stroke={stroke} strokeWidth="1.8" fill="none" />
          {[[28,34],[46,50],[40,72],[66,64],[74,38]].map(([cx,cy],i)=>(
            <Circle key={i} cx={cx} cy={cy} r="4.5" fill="rgba(228,179,99,0.7)" />
          ))}
        </Svg>
      );
    case 'fields':
      return (
        <Svg {...common}>
          {[60,52,44,36].map((y,i)=>(
            <Path key={i} d={`M${20+i*4} ${y} Q50 ${y-8} ${80-i*4} ${y}`} stroke={stroke} strokeWidth="2.4"
                  fill={i%2? 'rgba(124,169,130,0.3)':'rgba(228,179,99,0.3)'} />
          ))}
          <Path d="M16 70 H84" stroke={soft} strokeWidth="3" />
        </Svg>
      );
    case 'path':
      return (
        <Svg {...common}>
          <Path d="M50 84 Q40 60 56 44 Q70 30 50 18" stroke={stroke} strokeWidth="2.4" fill="none" strokeDasharray="5 6" />
          <Circle cx="56" cy="44" r="6" fill="rgba(228,179,99,0.6)" stroke={stroke} strokeWidth="2" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg {...common}>
          <Circle cx="58" cy="50" r="9" fill="rgba(228,179,99,0.55)" />
          <Path d="M30 50 Q44 32 44 50 Q44 68 30 50Z" fill={soft} stroke={stroke} strokeWidth="2.2" />
          <Path d="M44 50 Q32 44 30 50 Q32 56 44 50Z" fill={soft} stroke={stroke} strokeWidth="2.2" />
        </Svg>
      );
    case 'shelf':
      return (
        <Svg {...common}>
          <Path d="M22 70 H78" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <Rect x="28" y="44" width="14" height="26" rx="4" fill={soft} stroke={stroke} strokeWidth="2" />
          <Circle cx="54" cy="56" r="9" fill={soft} stroke={stroke} strokeWidth="2" />
          <Path d="M68 70 V52 Q68 44 74 44" stroke={stroke} strokeWidth="2.2" fill="none" />
        </Svg>
      );
    case 'field':
    default:
      return (
        <Svg {...common}>
          <Path d="M14 70 Q50 58 86 70" stroke={stroke} strokeWidth="2.4" fill="none" />
          <Path d="M50 70 V44" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
          <Circle cx="50" cy="38" r="8" fill={soft} stroke={stroke} strokeWidth="2.2" />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.paperDeep,
  },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  placeholderInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrap: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.coral,
    marginRight: 8,
  },
  tagText: {
    ...type.caption,
    color: colors.inkSoft,
    flex: 1,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
