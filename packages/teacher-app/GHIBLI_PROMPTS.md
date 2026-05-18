# Teacher App — Ghibli Storytelling Image Prompts

Generate each image with Gemini using the **Master Base** block followed by the per-scene block. Save the resulting PNG into `packages/teacher-app/public/story/` with the filename listed under each scene (filenames are case-sensitive). The dev server picks them up automatically on reload — until then, every screen shows a soft labelled placeholder so layout is preserved.

Aspect ratio note: the base prompt asks for 9:16 vertical (good for tall hero panels and amoeba frames on cards). If you want landscape banners for desktop headers, swap "Vertical 9:16 mobile composition" for "Horizontal 16:9 desktop composition" — keep everything else identical.

---

## MASTER BASE (paste before every scene)

```
STYLE: A soft, hand-painted anime illustration — a single frozen frame from a
Studio Ghibli / Makoto Shinkai–style film. Painterly gouache and watercolour
textures, gentle visible brushwork, soft volumetric light, a fine paper grain.
Warm, hopeful, calm, never busy or cluttered. This is a held moment of motion:
something is gently drifting, glowing, breathing, or about to move. Emotional
and atmospheric, but quiet.

GLOBAL DESIGN SYSTEM: Vertical 9:16 mobile composition. Subject palette ONLY:
warm paper cream #FBF6EE, dawn indigo #6C7BD6, sunrise coral #E8836B, meadow
sage #7CA982, soft gold #E4B363, warm near-black ink #2E2A33 — no other
colours, no neon, no pure primary red or blue, no teal, no magenta. CRITICAL
BLEND RULE: this illustration must look like a seamless part of a mobile app
screen, not a framed picture. All subject matter sits in the LOWER-MIDDLE of
the canvas. The entire TOP THIRD and all four OUTER EDGES are pure, smooth
background gradient with nothing painted on them, so the image dissolves
invisibly into the app's own background. The background gradient must use the
exact two colours specified below, blending top-to-bottom. No frame, no border,
no vignette, no card, no panel, no UI elements, no text, no letters, no
numbers, no logos, no watermark. Soft rounded forms, gentle warm shadows
(never harsh grey). Any child shown is warm and gentle with simple
non-specific features and modest everyday clothing.
```

---

## 1. Login — "First Light"

**File:** `login-first-light.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #F0E1D5 at the top transitioning smoothly down to #E5E8F4
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "First Light": In the lower-middle, a single paper lantern rests on a
wooden window-sill at the very first moment of dawn. A warm soft-gold glow blooms
from inside the lantern, and a gentle pair of moth-like wings has just landed on
the sill beside it, paused mid-breath. The window frame is barely suggested. No
hand, no person — only the lantern, the moth, and the hush before the day begins.
Coral whispers in the dawn beyond the window; soft-gold inside the lantern;
sage in the moth's wings. Quietly hopeful, the start of something.
```

---

## 2. Dashboard (empty / no session) — "The Quiet Classroom"

**File:** `dashboard-quiet-classroom.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #FBF6EE at the top transitioning smoothly down to #F0E1C8
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "The Quiet Classroom": In the lower-middle, three or four small wooden
school desks sit in a soft pool of morning light, their surfaces empty except
for a single open notebook on the nearest one. A paper aeroplane rests on the
notebook, having just landed. Sun beams drift in from off-canvas at a low warm
angle, lifting fine dust motes that glow soft-gold. No people, no chalkboard,
no walls — just the desks and the light. Coral in the desk wood, sage in a tiny
potted plant on one desk, soft-gold in the sunbeams. The room is waiting.
```

---

## 3. Chat — "The Listening Tree"

**File:** `chat-listening-tree.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #E5E8F4 at the top transitioning smoothly down to #F0E1D5
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "The Listening Tree": In the lower-middle, a kind teacher in modest
clothes sits cross-legged at the foot of a great old tree, head gently tilted
as if listening. Several small folded paper boats drift slowly through the air
toward the teacher, each one glowing faintly from within with soft-gold light —
they are the questions of unseen children, arriving one by one. The teacher's
hands are open and patient in their lap. The canopy of the tree stays low in
the frame. Coral in the teacher's scarf; sage in the tree foliage; soft-gold
inside the paper boats. Patient, attentive, warm.
```

---

## 4. Quiz Studio — "Seeds of Curiosity"

**File:** `quiz-seeds-of-curiosity.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #F0E1C8 at the top transitioning smoothly down to #DCE5D9
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "Seeds of Curiosity": In the lower-middle, a single gentle hand — wrist
to fingertips, no body — is opening above freshly tilled soft earth, releasing
a small handful of glowing seeds. Each seed trails a tiny soft-gold spark as it
falls. Two or three early sprouts have already pushed through the soil nearby,
their first leaves curled like question marks. Dusk light, late and warm. Coral
on the inside of the hand; sage in the tender sprouts; soft-gold in the falling
seeds. The moment just before something grows.
```

---

## 5. Analytics — "Reading the Sky"

**File:** `analytics-reading-the-sky.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #E8EBFA at the top transitioning smoothly down to #FBF6EE
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "Reading the Sky": In the lower-middle, a quiet teacher stands on a
small grassy rise at dusk, a soft cloth-bound notebook held open against their
chest, head tilted up to look at the sky. A handful of small warm constellation
points float in the lower-half of the upper region — not the very top, leaving
the sky clear — and one slender thread of soft-gold light connects three of
the stars, as if a pattern has just been understood. No telescope, no chart.
Coral in the teacher's coat; sage in the rise of grass; soft-gold in the
star-thread. Quiet recognition.
```

---

## 6. Homework — "The Path Home"

**File:** `homework-path-home.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #F6E0D2 at the top transitioning smoothly down to #DCE5D9
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "The Path Home": In the lower-middle, a small dirt path winds gently
away from the viewer through low rolling hills at the end of the day. A single
paper lantern, lit warm soft-gold, rests on a flat stone beside the path —
left for whoever is walking. A few sage-green grass blades lean toward the
lantern. No figure on the path, only the lantern marking the way. Coral in
the distant hills; sage in the grass; soft-gold in the lantern. The journey
continues quietly.
```

---

## 7. Reteach — "Returning to the Pond"

**File:** `reteach-pond-return.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #E8EBFA at the top transitioning smoothly down to #DCE5D9
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "Returning to the Pond": In the lower-middle, the still surface of a
small pond at first light. Three water lilies float on the water, the closest
one slowly opening — its petals half-unfurled, glowing soft-gold from within.
Two faint concentric ripples spread outward from the opening lily, suggesting
something has just begun. A few sage reeds lean in from the edges. No fish,
no figure, no shore visible at the top. Coral in the lily petals; sage in the
reeds; soft-gold in the lily's inner glow. A return, a re-opening.
```

---

## 8. Reports — "Pressed in Pages"

**File:** `reports-pressed-pages.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #FBF6EE at the top transitioning smoothly down to #F0E1D5
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "Pressed in Pages": In the lower-middle, a worn cloth-bound journal lies
open on a wooden table in soft afternoon light. Across the two open pages, four
or five pressed flowers and a single pressed leaf are arranged — each one a
remembered day. A length of soft cotton ribbon trails out of the journal toward
the bottom edge of the canvas. No hand, no person — just the journal and the
quiet record. Coral in the pressed flowers; sage in the pressed leaf; soft-gold
in the warm afternoon light. Memory, held.
```

---

## 9. Settings (Knowledge Base) — "The Library Shelf"

**File:** `settings-library-shelf.png`

```
[PASTE MASTER BASE PROMPT ABOVE FIRST]

BACKGROUND GRADIENT: #E5E8F4 at the top transitioning smoothly down to #FBF6EE
at the bottom. This exact gradient fills the whole canvas; the scene is painted
softly over only its lower portion.

SCENE — "The Library Shelf": In the lower-middle, a single small wooden shelf
at evening, lit by one warm lantern at its left end. On the shelf in calm order:
the lantern, a small potted sage-green plant, a folded paper map, an old brass
key, and one closed book lying flat. Everything is organised but not stiff —
the small belongings of someone who comes back here often. No room beyond the
shelf is shown, no walls. Coral in the closed book's cover; sage in the plant;
soft-gold in the lantern. Calm, organised, personal.
```

---

## Filename → Screen map (for code wiring)

| Filename | Screen | Component slot |
|---|---|---|
| `login-first-light.png` | Login | Hero panel (left half on desktop) |
| `dashboard-quiet-classroom.png` | Dashboard | Empty-state hero (no active session) |
| `chat-listening-tree.png` | Chat | Header band / sidebar accent |
| `quiz-seeds-of-curiosity.png` | QuizManager | Empty-state hero / header band |
| `analytics-reading-the-sky.png` | Analytics | Header band |
| `homework-path-home.png` | Homework | Header band |
| `reteach-pond-return.png` | Reteach | Empty-state hero |
| `reports-pressed-pages.png` | Reports | Header band |
| `settings-library-shelf.png` | Settings | Knowledge-base section header |
