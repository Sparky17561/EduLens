<img src="https://img.shields.io/badge/platform-Electron%20%7C%20Expo-blue?style=flat-square" /> <img src="https://img.shields.io/badge/AI-Ollama%20%7C%20Groq-orange?style=flat-square" /> <img src="https://img.shields.io/badge/offline--first-SQLite-green?style=flat-square" /> <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" />

# EduLens

> An offline-first, AI-powered classroom platform that runs entirely on a teacher's laptop — no cloud required. Students join over local Wi-Fi, ask AI questions, take adaptive quizzes, and receive personalised homework — all without an internet connection.

<p align="center">
  <img src="screenshots/Screenshot 2026-05-19 152759.png" width="900" alt="EduLens Teacher Dashboard — live session with student joined" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deploying to Render](#deploying-to-render)
- [Student App Flow](#student-app-flow)
- [Teacher Dashboard Flow](#teacher-dashboard-flow)
- [Chat Command Reference](#chat-command-reference)
- [AI & RAG System](#ai--rag-system)
- [Sync & Offline Support](#sync--offline-support)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

---

## Overview

EduLens bridges the gap between classroom teaching and personalised learning in low-connectivity environments. A single teacher laptop acts as the hub — running the backend, AI model, and serving all students over LAN. Students need only an Android or iOS phone with Expo Go installed.

**Key design goals:**
- **Zero cloud dependency** — fully functional with Ollama running locally
- **Offline-resilient** — students queue messages and sync when reconnected
- **Privacy-first** — all student data stays on-device or on the teacher's machine
- **Inclusive** — multilingual UI (English, Hindi, Tamil, Bengali, Kiswahili) with voice TTS output

---

## Screenshots

### Teacher App (Electron Desktop)

#### Session Management

| Start a Session | Live Session QR | Student Joined |
|:---:|:---:|:---:|
| <img src="screenshots/Screenshot 2026-05-19 152742.png" width="290" alt="Start Session"> | <img src="screenshots/Screenshot 2026-05-19 152428.png" width="290" alt="Session QR Code"> | <img src="screenshots/Screenshot 2026-05-19 152759.png" width="290" alt="Student Online"> |

*Left: Start a session — enter a topic, attach an optional PDF knowledge base, see past sessions grid. Centre: The session goes live instantly — students scan the QR code or type the 6-character code. Right: Dashboard updates in real-time as students join.*

---

#### AI Chat with RAG

<p align="center">
  <img src="screenshots/Screenshot 2026-05-19 152419.png" width="900" alt="Teacher Chat — slash commands and RAG citations" />
</p>

*The teacher chat panel offers 15+ slash commands as clickable chips. AI answers are grounded in the uploaded PDF textbook, with page citations shown inline.*

<p align="center">
  <img src="screenshots/Screenshot 2026-05-19 151137.png" width="900" alt="RAG citation detail — book name and page number" />
</p>

*Close-up of a RAG-grounded answer: source book, chapter, and page number are cited alongside the AI response.*

---

#### Quiz Studio

| AI Quiz Generator | Generated Questions | Class Scores Live |
|:---:|:---:|:---:|
| <img src="screenshots/Screenshot 2026-05-19 152435.png" width="290" alt="Quiz Studio Generator"> | <img src="screenshots/Screenshot 2026-05-19 152815.png" width="290" alt="Generated Questions"> | <img src="screenshots/Screenshot 2026-05-19 152845.png" width="290" alt="Live Class Scores"> |

*Left: Configure topic, difficulty, Bloom's taxonomy level, question count, and types (MCQ / Short Answer / True-False / Match / Fill-Blanks). Centre: Edit generated questions before launching. Right: Dashboard updates with student scores the moment quizzes are submitted.*

---

#### Analytics, Misconceptions & Homework

<p align="center">
  <img src="screenshots/Screenshot 2026-05-19 152854.png" width="900" alt="Analytics — topic performance and class heatmap" />
</p>

<p align="center">
  <img src="screenshots/Screenshot 2026-05-19 152857.png" width="900" alt="Analytics — detected misconceptions and AI summary" />
</p>

*Analytics page shows per-topic performance bars, a class heatmap by student × topic, auto-detected misconceptions from wrong answers, and an AI-generated summary with actionable next steps.*

<p align="center">
  <img src="screenshots/Screenshot 2026-05-19 152904.png" width="900" alt="Homework — AI-generated per-student remedial plan" />
</p>

*The Homework page shows each student's AI-generated personalised assignment: concept recap, follow-up questions, revision tasks, knowledge challenge, and suggested discussion topics.*

---

#### Reports & Knowledge Base

| Session Reports | Knowledge Base & Cloud Sync |
|:---:|:---:|
| <img src="screenshots/Screenshot 2026-05-19 152920.png" width="440" alt="Reports"> | <img src="screenshots/Screenshot 2026-05-19 152509.png" width="440" alt="Knowledge Base"> |

*Left: Full session report with per-student score breakdown, actionable insights, and export options (JSON / PDF / QR Bundle). Right: Upload PDF textbooks to ground AI answers; manage stored knowledge bases and push session bundles to the cloud.*

---

### Student App (React Native · Expo Go)

#### Joining a Session

| Home Screen | QR Scanner | Class Lobby |
|:---:|:---:|:---:|
| <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.29.jpeg" width="210" alt="Home — join session"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.29 (2).jpeg" width="210" alt="QR Scanner"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.26.jpeg" width="210" alt="Class Lobby"> |

*Left: Home tab — scan the teacher's QR code or type the 6-character session code. Centre: Live QR scanner aligned to the teacher's screen. Right: Lobby shows connection status, session topic, and tiles for Chat, Flashcards, Quiz Results, and Report Card.*

---

#### AI Tutor Chat

<p align="center">
  <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.26 (1).jpeg" width="360" alt="Student Chat — AI answer with RAG citations" />
</p>

*Students ask questions in plain language or use slash commands. AI answers include RAG citations (book name + page). Language chips (EN / HI) switch TTS voice output.*

---

#### Flashcards

| Question Side | Answer Revealed |
|:---:|:---:|
| <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.28.jpeg" width="300" alt="Flashcard question"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.28 (1).jpeg" width="300" alt="Flashcard answer"> |

*AI-generated revision flashcards persist offline. Tap to flip; mark "Got it!" to track mastery progress.*

---

#### Quiz Flow

| Quiz Notification | Quiz Results |
|:---:|:---:|
| <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.30.jpeg" width="300" alt="Quiz Time popup"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.30 (1).jpeg" width="300" alt="Quiz Results"> |

*A full-screen modal pops up the moment the teacher launches the quiz — no page refresh needed. Results show grade, topic performance bars, and quick links to homework and the full report.*

---

#### Report Card & Homework

| Session Report | My Homework | Report List |
|:---:|:---:|:---:|
| <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.31.jpeg" width="210" alt="Session Report"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.31 (1).jpeg" width="210" alt="My Homework"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.32 (1).jpeg" width="210" alt="Report List"> |

*Left: Full academic report card with score, grade, topic breakdown, mastered/review areas, and homework recap. Centre: Personalised homework — concept recap, self-check questions, revision checklist, knowledge challenge, and teacher discussion prompts. Right: Report list with expandable cards and QR-share for the teacher.*

---

#### Sessions History & Profile

| Past Sessions | Profile & Language |
|:---:|:---:|
| <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.32 (2).jpeg" width="300" alt="Past Sessions"> | <img src="screenshots/WhatsApp Image 2026-05-19 at 15.32.32 (3).jpeg" width="300" alt="Profile"> |

*Left: Sessions tab — full history of attended classes with date, session code, and duration. Right: Profile tab — animal avatar, session count, active session rejoin button, and language selector.*

---

## Architecture

```
EduLens/
├── packages/
│   ├── backend/          # Express + SQLite + WebSocket server
│   │   ├── src/
│   │   │   ├── routes/   # REST: session, chat, quiz, report, ai, sync
│   │   │   ├── services/ # AI, RAG, homework, misconception, flashcards
│   │   │   ├── websocket/# Real-time teacher↔student bridge
│   │   │   └── db/       # SQLite schema & migrations
│   │   └── .env
│   │
│   ├── teacher-app/      # Electron + React (runs on teacher's laptop)
│   │   └── src/
│   │       ├── pages/    # Dashboard, Quiz, Chat, Analytics, Reports…
│   │       └── store/    # Zustand app state
│   │
│   └── student-app/      # React Native + Expo 54 (student phones)
│       └── src/
│           ├── navigation/   # Stack + bottom tab navigator
│           ├── screens/      # Onboarding, Home, Chat, Quiz, Report…
│           ├── store/        # Zustand session + profile stores
│           └── hooks/        # WebSocket, sync hooks
│
├── .env.example
└── package.json          # npm workspaces root
```

**Data flow:**

```
[Teacher Laptop]
  Electron shell
  └─ React UI (teacher-app)
  └─ Express + SQLite + WS server (backend)
        │  LAN WebSocket / HTTP
        ▼
[Student Phones]
  Expo Go
  └─ React Native UI (student-app)
```

AI inference runs on the teacher's machine via **Ollama** (local, private). A **Groq** API key can be configured as an optional cloud fallback — and is used as the primary provider when deploying to Render.

---

## Features

### Teacher Dashboard
| Feature | Description |
|---|---|
| **Session Management** | Start/end sessions with a topic; generates a QR code and LAN join URL instantly |
| **Live Student Roster** | Real-time list of connected students with quiz submission status and scores |
| **Quiz Studio** | AI-generated multi-format quiz (MCQ, true/false, short answer, fill-in-the-blank, matching); manually editable before launch |
| **AI Chat** | 15+ slash commands with confidence scoring and RAG citations |
| **Knowledge Base** | Upload PDF textbooks; AI answers grounded in your curriculum |
| **Analytics** | Per-topic class performance, weak-area heatmap, auto-detected misconceptions, AI summary |
| **Reteach Loop** | Auto-generates remedial lesson plans from weak-topic analytics; pushes to students via WebSocket |
| **Reports** | Per-student and class-wide reports; export to JSON, PDF, or QR bundle |
| **Student QR Scanner** | Scan a student's report QR code to instantly receive their full data |
| **Past Sessions** | Browsable history of all ended sessions with click-through to reports |
| **Sync** | One-click session bundle export and restore; LAN peer sync; optional cloud push |

### Student Mobile App
| Feature | Description |
|---|---|
| **Onboarding & Profiles** | Animated splash → onboarding carousel → multi-profile selector with 4-digit PIN unlock |
| **Session Join** | Scan teacher's QR code or enter the 6-character session code |
| **AI Tutor Chat** | Ask questions in natural language; AI responds with curriculum-grounded answers and RAG citations |
| **Voice TTS** | Tap any AI message to hear it read aloud in the selected language |
| **Flashcards** | Offline-ready flip-card deck generated from session topic; "Got it!" mastery tracking |
| **Live Quiz** | Adaptive multi-format quiz launched by the teacher; popup notification when ready |
| **Personalised Homework** | AI-generated homework based on individual quiz weak spots |
| **Report Card** | Score breakdown, topic performance bars, weak/strong area summary, homework recap |
| **QR Report Export** | Generate a QR code from your report; teacher scans to receive data instantly |
| **Past Sessions** | Full history of all sessions with codes, dates, and durations |
| **Offline Mode** | Chat messages queue locally and sync automatically on reconnect |
| **Multilingual** | English, हिंदी, தமிழ், বাংলা, Kiswahili — TTS voice follows your selected language |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Workspaces support required |
| [Ollama](https://ollama.com) | Latest | For local AI inference |
| Expo Go | SDK 54 | Installed on student phones |
| Android / iOS | Android 8+ / iOS 14+ | For student devices |

### Pull the AI model

```bash
ollama pull gemma2:2b
# or for better quality (requires more RAM):
ollama pull llama3.2:3b
```

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/edulens.git
cd EduLens

# 2. Install all workspace dependencies
npm install

# 3. Copy and configure environment
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env — see Environment Variables below

# 4. Build the backend
cd packages/backend
npx tsc
cd ../..
```

---

## Environment Variables

Create `packages/backend/.env`:

```env
# ── AI (Local) ────────────────────────────────────────────
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b          # any model you have pulled
OLLAMA_EMBED_MODEL=nomic-embed-text

# ── AI (Cloud Fallback — optional locally, required on Render) ──
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# ── Server ────────────────────────────────────────────────
PORT=3001
DB_PATH=                        # leave blank for ./data/edulens.db

# ── Auth ──────────────────────────────────────────────────
DEFAULT_TEACHER_PIN=1234
```

> **Note:** The backend loads `.env` from `packages/backend/`. When using the Electron teacher app, environment is loaded automatically. For standalone development, run from `packages/backend/`.

---

## Running Locally

### Teacher App (Electron)

```bash
cd packages/teacher-app
npm run dev
```

Login with PIN `1234` (or whatever you set in `DEFAULT_TEACHER_PIN`). The Electron shell starts the backend on port 3001 automatically.

### Student App (Expo)

```bash
cd packages/student-app
npx expo start
```

- Scan the Expo QR with **Expo Go** on a student phone
- Ensure the phone is on the **same Wi-Fi network** as the teacher laptop
- The first launch shows an onboarding flow → profile creation → PIN setup

### Backend (Standalone — for development)

```bash
cd packages/backend
npm run dev
```

Health check: `GET http://localhost:3001/health`

---

## Deploying to Render

You can host the EduLens backend on [Render](https://render.com) so students connect over the internet instead of LAN — useful for remote or hybrid classrooms.

> **WebSocket note:** Persistent WebSocket connections require a paid Render plan (Starter $7/month or above). The free tier may drop long-lived connections.

> **AI note:** Ollama cannot run on Render. Set `GROQ_API_KEY` as your primary AI provider — all inference routes through Groq's cloud API instead.

### Step 1 — Push your repo to GitHub

```bash
git remote add origin https://github.com/your-org/edulens.git
git push -u origin main
```

### Step 2 — Create a new Web Service on Render

1. Log in at [render.com](https://render.com)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `edulens-backend` |
| **Runtime** | Node |
| **Root Directory** | `packages/backend` |
| **Build Command** | `npm install && npx tsc` |
| **Start Command** | `node dist/index.js` |
| **Instance Type** | Starter (for WebSocket support) |

### Step 3 — Add a Persistent Disk for SQLite

SQLite is file-based — without a persistent disk, all data is lost on every deploy or restart.

1. In your Render service → **Disks** → **Add Disk**
2. Configure:

| Setting | Value |
|---|---|
| **Name** | `edulens-data` |
| **Mount Path** | `/data` |
| **Size** | 1 GB |

### Step 4 — Set Environment Variables

In Render → **Environment** → add each variable:

```
NODE_ENV=production
PORT=10000
DB_PATH=/data/edulens.db
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DEFAULT_TEACHER_PIN=1234
OLLAMA_URL=
```

> Get a free Groq API key at [console.groq.com](https://console.groq.com). The free tier is generous enough for classroom use.

### Step 5 — Update the Student App Server URL

In [packages/student-app/src/api/client.ts](packages/student-app/src/api/client.ts), change the base URL from the LAN address to your Render URL:

```ts
const BASE_URL = 'https://edulens-backend.onrender.com'
```

Then rebuild and redistribute the student APK (or update the Expo config).

### Step 6 — Deploy

Render auto-deploys on every push to `main`. Watch the build logs in the Render dashboard. A successful deploy shows:

```
[server] EduLens backend running on port 10000
[WS] WebSocket server initialized
```

### Step 7 — Verify

```bash
curl https://edulens-backend.onrender.com/health
# → {"status":"ok","db":"connected"}
```

### Render Deployment Summary

```
render.com
└─ Web Service: edulens-backend
      Root: packages/backend
      Build: npm install && npx tsc
      Start: node dist/index.js
      Disk:  /data (1 GB) → DB_PATH=/data/edulens.db
      Env:   GROQ_API_KEY, DEFAULT_TEACHER_PIN, PORT=10000
```

---

## Student App Flow

```
Splash (2.6 s)
  └─ First launch?
        ├─ Yes → Onboarding (3-slide carousel) → ProfileSelect
        └─ No  → ProfileSelect
               └─ New profile  → NewProfile → PinUnlock (create) → MainTabs
               └─ Existing     → PinUnlock (enter)               → MainTabs

MainTabs (bottom navigation)
  ├─ Home      — QR scan or code entry to join a session
  ├─ Sessions  — Past session history with codes, dates, durations
  ├─ Report    — Per-session drill-down: scores, topic breakdown, QR export
  └─ Profile   — Account info, language, active session rejoin, switch profile

In-session screens (accessed from Home tab):
  Lobby → Chat ↔ Flashcards ↔ Quiz → Results → Homework → Report
```

---

## Teacher Dashboard Flow

```
Login (PIN)
  └─ Dashboard
        ├─ No active session → Start Session (topic + optional knowledge base)
        │                   → Past sessions grid → click to view report
        └─ Active session   → Live roster + class health metrics
                            → Quiz Studio → AI Generate → Edit → Launch
                            → Chat (slash commands, RAG answers)
                            → Analytics (heatmap, misconceptions)
                            → Homework (per-student AI plans)
                            → Reteach (assign remedial plans to students)
                            → End Session
  └─ Reports   → Select session → per-student reports → export JSON/PDF/Bundle
               → Scan Student QR (camera) → instant report view
  └─ Analytics → Topic heatmap, class trends, misconception detection
  └─ Knowledge → Upload PDF knowledge base; manage stored bases; cloud sync
```

---

## Chat Command Reference

All commands work in both the teacher and student chat interfaces.

| Command | Description | Example |
|---|---|---|
| `/ask [question]` | Curriculum-grounded answer with RAG citations | `/ask what is osmosis` |
| `/explain [topic]` | Deep conceptual explanation | `/explain photosynthesis` |
| `/hint [topic]` | Guided hint without revealing the answer | `/hint Newton's laws` |
| `/cite [question]` | Answer with explicit source citations | `/cite water cycle` |
| `/summarize [topic]` | Concise topic summary | `/summarize chapter 5` |
| `/diagnose [confusion]` | Identify and address misconceptions | `/diagnose why current flows` |
| `/rephrase` | Simplify the previous AI response | `/rephrase` |
| `/generate [topic]` | Full lesson outline (teacher) | `/generate fractions` |
| `/flashcards [topic]` | Generate Q&A flashcard deck | `/flashcards periodic table` |
| `/quizme [topic]` | Launch a mini 5-question AI quiz | `/quizme photosynthesis` |
| `/teachme [topic]` | Structured step-by-step lesson | `/teachme differentiation` |
| `/examples [topic]` | Real-world examples and analogies | `/examples gravity` |
| `/compare [A] vs [B]` | Side-by-side concept comparison | `/compare mitosis vs meiosis` |
| `/practice [topic]` | Practice problems with solutions | `/practice quadratic equations` |
| `/define [term]` | Precise definition with context | `/define entropy` |

All AI responses include a **confidence indicator** (High / Likely / Uncertain) to help students and teachers gauge answer reliability.

---

## AI & RAG System

### Local inference (primary)
- **Ollama** runs on the teacher's machine; all inference is local and private
- Model: `gemma2:2b` by default — swap for any Ollama-compatible model
- Embedding model: `nomic-embed-text` for semantic chunk retrieval

### Cloud fallback / Render primary
- **Groq** with `llama-3.3-70b-versatile` when `GROQ_API_KEY` is set
- Falls back automatically if Ollama is unavailable; used as primary on Render

### RAG pipeline
1. Teacher uploads a PDF in the Knowledge page → text is chunked (512-token windows with overlap)
2. Chunks are embedded and stored in SQLite with source / chapter / page metadata
3. On `/ask` or `/cite`, top-k chunks are retrieved by TF-IDF + cosine similarity
4. Retrieved context is injected into the prompt alongside the question
5. Citations (book name, chapter, page) are returned with the answer and rendered in-app

### Homework generation
After a student submits a quiz, the backend:
1. Scores all answers server-side
2. Classifies topics as weak (<60%) or strong (≥60%)
3. Sends wrong-answer data to AI for misconception analysis
4. Generates personalised homework: concept recap, self-check questions, revision checklist, knowledge challenge, and teacher discussion prompts
5. Broadcasts `homework_ready` to the student via WebSocket

### Reteach pipeline
When the teacher clicks Assign Reteach in the Analytics page:
1. AI generates a full remedial lesson plan for the weakest topic
2. The plan is stored in the database with `status = assigned`
3. A `reteach_assigned` WebSocket event is broadcast to all students in the session
4. Students see the plan as a chat message and can access the full lesson

---

## Sync & Offline Support

### Student offline queue
- Messages typed when disconnected are stored in `AsyncStorage`
- On reconnect, the queue replays in order
- Sync status is visible in the Lobby screen

### Session bundle sync (teacher)
- **Export:** serialises the entire session (messages, quiz attempts, reports, analytics) to a JSON bundle
- **Import:** restore a past session from bundle on a different machine
- **Peer sync:** `POST /sync/run` exchanges deltas with another EduLens instance on the LAN
- **Cloud push:** `Push session to cloud` uploads the bundle to a configured `SYNC_CLOUD_URL`

### Flashcard persistence
- Flashcards are generated from the session topic at session start and saved to the database
- Students who join mid-session fetch them via `GET /session/:id` instead of relying on the WebSocket event

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Teacher UI** | Electron 29, React 18, TypeScript | Desktop shell + embedded server |
| **Student UI** | Expo SDK 54, React Native 0.81, TypeScript | Expo Go compatible |
| **Backend** | Express 4, better-sqlite3, ws | Embedded in Electron; deployable standalone |
| **State** | Zustand + AsyncStorage (mobile) | Persist middleware |
| **AI (local)** | Ollama (`gemma2:2b`) | Runs on teacher laptop |
| **AI (cloud)** | Groq (`llama-3.3-70b-versatile`) | Optional fallback / Render primary |
| **RAG** | Custom TF-IDF + cosine, SQLite | PDF chunks with metadata |
| **Charts** | Recharts (web), custom SVG (mobile) | |
| **QR** | `qrcode` (backend), `react-native-qrcode-svg` (mobile), `qrcode.react` (web) | |
| **Navigation** | React Navigation 6 (stack + bottom tabs) | |
| **Design** | Custom Ghibli/storybook tokens — Fraunces + Nunito fonts, dawn palette | |

---

## Contributing

```bash
# Run type checks
cd packages/student-app && npx tsc --noEmit
cd packages/backend     && npx tsc --noEmit
cd packages/teacher-app && npx tsc --noEmit
```

**Branch naming:** `feat/`, `fix/`, `chore/`
**Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

---

<p align="center">
  Built with ❤️ for classrooms everywhere — works without internet, works without excuses.
</p>
