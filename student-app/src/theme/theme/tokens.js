/**
 * EduLens Design Tokens
 * ---------------------
 * Aesthetic: a soft Ghibli-storybook rendered as an app.
 * Warm dawn palette, generous whitespace, editorial spacing.
 * Every screen should feel like a quiet, hopeful anime scene.
 */

export const colors = {
  // Core surfaces — warm paper, not stark white (the "WordPress editorial" base)
  paper:       '#FBF6EE',   // app background, like aged storybook paper
  paperDeep:   '#F3E9D9',   // recessed surfaces
  card:        '#FFFFFF',   // raised cards
  cardSoft:    '#FFFDF9',   // softer card variant

  // Ink — never pure black, always a warm dark
  ink:         '#2E2A33',   // primary text
  inkSoft:     '#5E5765',   // secondary text
  inkFaint:    '#9A93A0',   // captions, hints

  // Primary — a dawn indigo/periwinkle, the "sky" of every anime scene
  sky:         '#6C7BD6',
  skyDeep:     '#4A5AB8',
  skyLight:    '#A9B4EC',
  skyWash:     '#E8EBFA',

  // Secondary — a warm sunrise coral, used for warmth and calls to action
  coral:       '#E8836B',
  coralDeep:   '#D26449',
  coralLight:  '#F6B9A8',
  coralWash:   '#FBE8E2',

  // Tertiary — a meadow sage, for "correct", growth, calm confirmation
  sage:        '#7CA982',
  sageDeep:    '#5C8A62',
  sageLight:   '#B4D2B7',
  sageWash:    '#E7F1E8',

  // Accent — soft gold, for highlights, stars, achievement
  gold:        '#E4B363',
  goldLight:   '#F2D9A8',
  goldWash:    '#FBF1DC',

  // States
  error:       '#C9586B',
  errorWash:   '#F6E2E5',

  // Utility
  line:        '#EAE0D0',   // hairline borders
  lineSoft:    '#F0E8DB',
  overlay:     'rgba(46, 42, 51, 0.55)',
  scrim:       'rgba(46, 42, 51, 0.25)',
  white:       '#FFFFFF',
};

/**
 * Named gradient stops. Each screen "type" gets its own sky wash so the
 * journey feels like moving through different times of an anime day.
 */
export const gradients = {
  dawn:     ['#F6E0D2', '#E8EBFA'],   // splash / welcome — soft sunrise
  morning:  ['#E8EBFA', '#FBF6EE'],   // capture / home — clear morning
  study:    ['#FBF1DC', '#FBF6EE'],   // lesson — warm focused light
  dusk:     ['#E0DBF2', '#F3E9D9'],   // quiz — late afternoon
  meadow:   ['#E7F1E8', '#FBF6EE'],   // success / summary — calm green
  night:    ['#3A3450', '#5A5378'],   // teacher / admin — quiet evening
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

/**
 * Typography. Two families:
 *  - 'Fraunces'  : a soft characterful serif for display / storytelling headings
 *  - 'Nunito'    : a rounded, friendly sans for body and UI — gentle, legible
 * Load these via expo-font (see App.js). Fallbacks keep dev builds working.
 */
export const fonts = {
  display:      'Fraunces_600SemiBold',
  displayBold:  'Fraunces_700Bold',
  body:         'Nunito_500Medium',
  bodyBold:     'Nunito_700Bold',
  bodyExtra:    'Nunito_800ExtraBold',
};

export const type = {
  hero:     { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 42 },
  title:    { fontFamily: fonts.display,     fontSize: 26, lineHeight: 34 },
  heading:  { fontFamily: fonts.display,     fontSize: 21, lineHeight: 28 },
  subhead:  { fontFamily: fonts.bodyExtra,   fontSize: 17, lineHeight: 24 },
  body:     { fontFamily: fonts.body,        fontSize: 16, lineHeight: 25 },
  bodyBold: { fontFamily: fonts.bodyBold,    fontSize: 16, lineHeight: 25 },
  bodyExtra:{ fontFamily: fonts.bodyExtra,   fontSize: 16, lineHeight: 25 },
  small:    { fontFamily: fonts.body,        fontSize: 14, lineHeight: 21 },
  smallBold:{ fontFamily: fonts.bodyBold,    fontSize: 14, lineHeight: 21 },
  caption:  { fontFamily: fonts.bodyBold,    fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  button:   { fontFamily: fonts.bodyExtra,   fontSize: 17, lineHeight: 22 },
};

export const shadow = {
  // Soft, warm-tinted shadows — never harsh grey
  card: {
    shadowColor: '#3E3320',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },
  soft: {
    shadowColor: '#3E3320',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  lift: {
    shadowColor: '#3E3320',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
};

export default { colors, gradients, spacing, radius, fonts, type, shadow };
