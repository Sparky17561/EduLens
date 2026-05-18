/**
 * EduLens Illustration Registry
 * =============================
 * Every anime-style illustration in the app is referenced through this one
 * file. To replace a placeholder with your real Gemini-generated art:
 *
 *   1. Drop your PNG into  /assets/illustrations/  using the SAME filename
 *      shown in the `file` field below.
 *   2. That's it. Nothing else changes — every screen pulls from here.
 *
 * Each entry includes an `aiPrompt` — a ready-to-paste prompt for Gemini so
 * the whole set stays in one consistent anime art style.
 *
 * GLOBAL STYLE PROMPT (prepend to every prompt for consistency):
 * ---------------------------------------------------------------
 * "Soft anime illustration in the style of a Studio Ghibli storybook.
 *  Warm dawn lighting, gentle gradient skies, painterly textures, hopeful
 *  and calm mood. Muted dawn-indigo, sunrise-coral and meadow-sage palette.
 *  Clean vector-friendly shapes, no text, no logos, gentle grain. Vertical
 *  9:16 mobile composition with generous negative space at the top."
 *
 * Until real art is added, the app renders a tasteful gradient + motif
 * placeholder (see <Illustration /> component) so the UI never looks broken.
 */

// While developing without binary assets, we keep `source` null and the
// <Illustration /> component draws a styled placeholder. When you add the
// real file, switch the line to:  source: require('../../assets/illustrations/<file>')

export const illustrations = {
  splash: {
    file: 'splash_lantern.png',
    source: require('../../assets/illustrations/splash_lantern.png'),
    label: 'A child holding a glowing lantern at dawn',
    motif: 'lantern',
    tint: 'dawn',
    aiPrompt:
      'A small child in simple clothes holding a softly glowing paper lantern, ' +
      'standing on a hill at sunrise, vast pastel sky, birds in the distance. ' +
      'A sense of a journey about to begin.',
  },

  welcome: {
    file: 'welcome_two_paths.png',
    source: require('../../assets/illustrations/welcome_two_paths.png'),
    label: 'A student and a teacher under a big tree',
    motif: 'tree',
    tint: 'dawn',
    aiPrompt:
      'A friendly village teacher and a curious student standing beneath a ' +
      'huge ancient tree with floating leaves, warm morning light, an open ' +
      'book resting on a stone. Welcoming and safe.',
  },

  onboard1: {
    file: 'onboard_1.png',
    source: require('../../assets/illustrations/onboard_1.png'),
    label: 'A child photographing a glowing storybook page',
    motif: 'book',
    tint: 'dawn',
    aiPrompt: '',
  },
  onboard2: {
    file: 'onboard_2.png',
    source: require('../../assets/illustrations/onboard_2.png'),
    label: 'Words rising softly from an open book',
    motif: 'bloom',
    tint: 'morning',
    aiPrompt: '',
  },
  onboard3: {
    file: 'onboard_3.png',
    source: require('../../assets/illustrations/onboard_3.png'),
    label: 'A paper plane carrying a glowing note to a teacher',
    motif: 'plane',
    tint: 'study',
    aiPrompt: '',
  },

  profilePick: {
    file: 'profile_window.png',
    source: require('../../assets/illustrations/profile_window.png'),
    label: 'Sunlit window with floating profile lights',
    motif: 'window',
    tint: 'morning',
    aiPrompt:
      'A cozy classroom window with sunlight streaming in, soft dust motes ' +
      'glowing in the air, plants on the sill. Peaceful and inviting.',
  },

  newProfile: {
    file: 'new_profile_seed.png',
    source: require('../../assets/illustrations/new_profile_seed.png'),
    label: 'A tiny seedling sprouting in cupped hands',
    motif: 'seed',
    tint: 'meadow',
    aiPrompt:
      'Two gentle hands cupping a tiny glowing seedling with two leaves, ' +
      'soft bokeh meadow background, morning dew. New beginnings.',
  },

  pinUnlock: {
    file: 'pin_keyhouse.png',
    source: require('../../assets/illustrations/pin_keyhouse.png'),
    label: 'A small warm house with a glowing door',
    motif: 'door',
    tint: 'dawn',
    aiPrompt:
      'A small cozy cottage at dusk with one warmly glowing round door, ' +
      'fireflies around it, a stone path leading up. Coming home.',
  },

  captureHub: {
    file: 'capture_desk.png',
    source: require('../../assets/illustrations/capture_desk.png'),
    label: 'An open textbook glowing on a study desk',
    motif: 'book',
    tint: 'morning',
    aiPrompt:
      'A wooden study desk by a window with an open textbook softly glowing, ' +
      'a pencil, a leaf, gentle morning light, a teacup. Quiet focus.',
  },

  cameraHint: {
    file: 'camera_firefly.png',
    source: null,
    label: 'Fireflies forming a frame in the dark',
    motif: 'frame',
    tint: 'dusk',
    aiPrompt:
      'Cluster of soft fireflies arranging themselves into a rectangular ' +
      'frame shape in a calm twilight garden. Magical but minimal.',
  },

  aiThinking: {
    file: 'thinking_owl.png',
    source: require('../../assets/illustrations/thinking_owl.png'),
    label: 'A gentle owl reading a page by lamplight',
    motif: 'owl',
    tint: 'study',
    aiPrompt:
      'A kind, round owl wearing tiny round glasses, reading a glowing page ' +
      'under a warm desk lamp at night, soft stars in the window. Patient wisdom.',
  },

  lesson: {
    file: 'lesson_garden.png',
    source: require('../../assets/illustrations/lesson_garden.png'),
    label: 'A blooming idea-tree in a calm garden',
    motif: 'bloom',
    tint: 'study',
    aiPrompt:
      'A small tree made of softly glowing ideas and lightbulbs blossoming, ' +
      'in a serene garden with floating petals, warm afternoon light. Understanding.',
  },

  quiz: {
    file: 'quiz_steppingstones.png',
    source: require('../../assets/illustrations/quiz_steppingstones.png'),
    label: 'Stepping stones across a calm stream',
    motif: 'stones',
    tint: 'dusk',
    aiPrompt:
      'Three smooth glowing stepping stones crossing a gentle stream at ' +
      'golden hour, soft reeds, a hopeful path forward. Calm challenge.',
  },

  correct: {
    file: 'state_correct_star.png',
    source: require('../../assets/illustrations/state_correct_star.png'),
    label: 'A bright star blooming over a hill',
    motif: 'star',
    tint: 'meadow',
    aiPrompt:
      'A single warm star blossoming with light over a peaceful green hill ' +
      'at sunrise, gentle sparkles drifting up. Joyful encouragement.',
  },

  incorrect: {
    file: 'state_retry_paperboat.png',
    source: require('../../assets/illustrations/state_retry_paperboat.png'),
    label: 'A paper boat being gently set back on water',
    motif: 'boat',
    tint: 'morning',
    aiPrompt:
      'A small paper boat being gently placed back onto calm water by a ' +
      'child hand, soft ripples, reassuring soft light. Try again kindly.',
  },

  summary: {
    file: 'summary_hilltop.png',
    source: require('../../assets/illustrations/summary_hilltop.png'),
    label: 'A child resting on a hilltop at sunset',
    motif: 'hilltop',
    tint: 'meadow',
    aiPrompt:
      'A content child sitting on a grassy hilltop watching a warm sunset, ' +
      'a closed book beside them, fireflies rising. A day well spent.',
  },

  qrExport: {
    file: 'qr_paperplane.png',
    source: require('../../assets/illustrations/qr_paperplane.png'),
    label: 'A paper plane carrying a glowing letter',
    motif: 'plane',
    tint: 'morning',
    aiPrompt:
      'A folded paper plane carrying a tiny glowing envelope across a soft ' +
      'morning sky toward a distant schoolhouse. Sharing progress.',
  },

  teacherLogin: {
    file: 'teacher_lantern_desk.png',
    source: null,
    label: 'A teacher\u2019s desk with a lantern at night',
    motif: 'lantern',
    tint: 'night',
    aiPrompt:
      'A tidy teacher\u2019s desk at night lit by a single warm lantern, ' +
      'stacked notebooks, a small plant, a calm window with stars. Quiet duty.',
  },

  teacherDash: {
    file: 'teacher_constellation.png',
    source: null,
    label: 'A constellation of student-lights in a night sky',
    motif: 'constellation',
    tint: 'night',
    aiPrompt:
      'A calm night sky where soft star-lights connect into a gentle ' +
      'constellation over a quiet village school. Each star a student.',
  },

  topicMastery: {
    file: 'topic_terraced_fields.png',
    source: null,
    label: 'Terraced fields glowing at different stages',
    motif: 'fields',
    tint: 'night',
    aiPrompt:
      'Moonlit terraced hillside fields, each terrace glowing a different ' +
      'soft shade of green and gold, calm and orderly. Growth and gaps.',
  },

  studentDetail: {
    file: 'student_lantern_path.png',
    source: null,
    label: 'A single lantern marking a path on a hill',
    motif: 'path',
    tint: 'night',
    aiPrompt:
      'A single warm lantern on a winding hill path at night, gentle glow ' +
      'showing the way forward, soft stars. One learner\u2019s journey.',
  },

  scanner: {
    file: 'scanner_moth_light.png',
    source: null,
    label: 'A soft moth drawn to a gentle light',
    motif: 'scan',
    tint: 'night',
    aiPrompt:
      'A calm pale moth gently circling a soft warm light in the dark, ' +
      'minimal, peaceful, a sense of capture and connection.',
  },

  empty: {
    file: 'empty_quietfield.png',
    source: null,
    label: 'A quiet empty field at dawn',
    motif: 'field',
    tint: 'dawn',
    aiPrompt:
      'A wide quiet empty meadow at gentle dawn, a single small tree, ' +
      'lots of calm sky. Nothing here yet, but room to grow.',
  },

  settings: {
    file: 'settings_toolshelf.png',
    source: null,
    label: 'A tidy shelf of warm small objects',
    motif: 'shelf',
    tint: 'night',
    aiPrompt:
      'A small wooden shelf at night holding a lantern, a plant, a folded ' +
      'map and a key, softly lit. Calm, organized, personal.',
  },
};

/**
 * Avatar set for student profiles. Same swap rule: drop a PNG with the
 * matching filename into /assets/avatars/ to replace the placeholder.
 */
export const avatars = {
  fox:    { file: 'fox.png',    source: null, motif: 'fox',    color: '#E8836B' },
  owl:    { file: 'owl.png',    source: null, motif: 'owl',    color: '#6C7BD6' },
  deer:   { file: 'deer.png',   source: null, motif: 'deer',   color: '#E4B363' },
  rabbit: { file: 'rabbit.png', source: null, motif: 'rabbit', color: '#7CA982' },
  cat:    { file: 'cat.png',    source: null, motif: 'cat',    color: '#D26449' },
  bird:   { file: 'bird.png',   source: null, motif: 'bird',   color: '#4A5AB8' },
  bear:   { file: 'bear.png',   source: null, motif: 'bear',   color: '#5C8A62' },
  turtle: { file: 'turtle.png', source: null, motif: 'turtle', color: '#A9B4EC' },
};

export const avatarKeys = Object.keys(avatars);

export default illustrations;
