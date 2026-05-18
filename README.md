<img src="https://img.shields.io/badge/platform-Electron%20%7C%20Expo-blue?style=flat-square" /> <img src="https://img.shields.io/badge/AI-Ollama%20%7C%20Groq-orange?style=flat-square" /> <img src="https://img.shields.io/badge/offline--first-SQLite-green?style=flat-square" /> <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" />

# EduLens

> An offline-first, AI-powered classroom platform that runs entirely on a teacher's laptop — no cloud required. Students join over local Wi-Fi, ask AI questions, take adaptive quizzes, and receive personalised homework — all without an internet connection.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Student App Flow](#student-app-flow)
- [Teacher Dashboard Flow](#teacher-dashboard-flow)
- [Chat Command Reference](#chat-command-reference)
- [AI & RAG System](#ai--rag-system)
- [Sync & Offline Support](#sync--offline-support)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

---

## Overview

EduLens bridges the gap between classroom teaching and personalised learning in low-connectivity environments. A single teacher laptop acts as the hub — running the backend, AI model, and serving all students over LAN. Students need only an Android or iOS phone running Expo Go.

**Key design goals:**
- **Zero cloud dependency** — fully functional with Ollama running locally
- **Offline-resilient** — students queue messages and sync when reconnected
- **Privacy-first** — all student data stays on-device or on the teacher's machine
- **Inclusive** — multilingual UI (English, Hindi, Tamil, Bengali, Kiswahili), voice TTS output

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

AI inference runs on the teacher's machine via **Ollama** (local, private). A **Groq** API key can be configured as an optional cloud fallback for stronger models.

---

## Features

### Teacher Dashboard
| Feature | Description |
|---|---|
| **Session Management** | Start/end sessions with a topic; generates a QR code and LAN join URL instantly |
| **Live Student Roster** | Real-time list of connected students with quiz submission status |
| **Quiz Studio** | AI-generated multi-format quiz (MCQ, true/false, short answer, fill-in-the-blank, matching); manual editing supported |
| **AI Chat** | 12+ slash commands with confidence scoring and RAG citations |
| **Knowledge Base** | Upload PDF textbooks; AI answers are grounded in your curriculum |
| **Analytics** | Per-topic class performance, weak-area heatmap, student rankings |
| **Reteach Loop** | Auto-generates remedial lesson plans from weak-topic analytics |
| **Reports** | Per-student and class-wide reports; export to JSON, PDF, or QR bundle |
| **Student QR Scanner** | Scan a student's report QR code to instantly receive their full data |
| **Past Sessions** | Browsable history of all ended sessions with click-through to reports |
| **Sync** | One-click session bundle export and restore; LAN peer sync |

### Student Mobile App
| Feature | Description |
|---|---|
| **Onboarding & Profiles** | Animated splash → onboarding carousel → multi-profile selector with 4-digit PIN unlock |
| **Session Join** | Scan teacher's QR code or enter a 6-character session code |
| **AI Tutor Chat** | Ask questions in natural language; AI responds with curriculum-grounded answers and citations |
| **Voice TTS** | Tap any AI message to hear it read aloud in the selected language |
| **Live Quiz** | Adaptive multi-format quiz launched by the teacher; popup notification when ready |
| **Personalised Homework** | AI-generated homework based on individual quiz weak spots |
| **Report Card** | Score breakdown, topic performance bars, weak/strong area summary, homework recap |
| **QR Report Export** | Generate a QR code from your report; teacher scans to receive data instantly |
| **Past Sessions** | Full history of all sessions with scores, durations, and topic breakdowns |
| **Offline Mode** | Chat messages queue locally and sync automatically on reconnect |
| **Bottom Navigation** | Home · Sessions · Report · Profile — persistent tab bar with Ghibli-aesthetic design |

---

## Screenshots

| Teacher Dashboard | Quiz Studio | Student Home |
|:---:|:---:|:---:|
| _screenshot_ | _screenshot_ | _screenshot_ |

| Student Report | QR Export | Past Sessions |
|:---:|:---:|:---:|
| _screenshot_ | _screenshot_ | _screenshot_ |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Workspaces support required |
| [Ollama](https://ollama.com) | Latest | Must be running locally |
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

# 4. Install student app dependencies (isolated from workspace)
cd packages/student-app
npm install
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

# ── AI (Cloud Fallback — optional) ───────────────────────
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# ── Server ────────────────────────────────────────────────
PORT=3001
DB_PATH=                        # leave blank for ./data/edulens.db

# ── Auth ──────────────────────────────────────────────────
DEFAULT_TEACHER_PIN=1234
```

> **Note:** The backend loads `.env` from `packages/backend/`. If you run the backend from the repo root it will not find the file — always run from the `packages/backend/` directory or use the Electron app.

---

## Running the Project

### Teacher App (Electron)

```bash
cd packages/teacher-app
npm run dev
```

Login with PIN `1234` (or whatever you set in `DEFAULT_TEACHER_PIN`).

The Electron shell automatically starts the backend server on port 3001 and opens the React UI.

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

## Student App Flow

```
Splash (2.6 s)
  └─ First launch?
        ├─ Yes → Onboarding (3-slide carousel) → ProfileSelect
        └─ No  → ProfileSelect
               └─ New profile → NewProfile → PinUnlock (create) → MainTabs
               └─ Existing    → PinUnlock (enter)              → MainTabs

MainTabs (bottom navigation)
  ├─ 🏠 Home       — QR scan or code entry to join a session
  ├─ 🕐 Sessions   — Past session history with scores and duration
  ├─ 📋 Report     — Per-session drill-down: scores, topic breakdown, QR export
  └─ 👤 Profile    — Account info, language, leave session, switch profile

In-session screens (accessed from Home tab):
  Lobby → Chat ↔ Quiz → Results → Homework → Flashcards
```

---

## Teacher Dashboard Flow

```
Login (PIN)
  └─ Dashboard
        ├─ No active session → Start Session (topic + optional knowledge base)
        │                   → Past sessions grid
        └─ Active session   → Live roster + analytics
                            → Quiz Studio → AI Generate → Launch
                            → Chat (slash commands)
                            → End Session
  └─ Reports → Select session → Student reports
             → Scan Student QR (camera) → instant report view
  └─ Analytics → Topic heatmap, class trends
  └─ Settings  → Upload PDF knowledge base
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

All AI responses include a **confidence indicator** (High / Likely / Uncertain) to reduce hallucinations.

---

## AI & RAG System

### Local inference (primary)
- **Ollama** runs on the teacher's machine; all inference is local and private
- Model: `gemma2:2b` by default — swap for any Ollama-compatible model
- Embedding model: `nomic-embed-text` for semantic chunk retrieval

### Cloud fallback (optional)
- **Groq** with `llama-3.3-70b-versatile` when `GROQ_API_KEY` is set
- Falls back automatically if Ollama is unavailable

### RAG pipeline
1. Teacher uploads a PDF in Settings → text is chunked (512-token windows with overlap)
2. Chunks are embedded and stored in SQLite with source/chapter/page metadata
3. On `/ask` or `/cite`, top-k chunks are retrieved by TF-IDF + cosine similarity
4. Retrieved context is injected into the prompt alongside the question
5. Citations (book, chapter, page) are returned with the answer and rendered in-app

### Homework generation
After a student submits a quiz, the backend:
1. Scores all answers server-side (prevents cheating)
2. Classifies topics as weak (<60%) or strong (≥60%)
3. Sends wrong-answer data to AI for misconception analysis
4. Generates personalised homework: concept recap, revision tasks, follow-up questions, practice challenges
5. Broadcasts `homework_ready` to the student via WebSocket

---

## Sync & Offline Support

### Student offline queue
- Messages typed when disconnected are stored in `AsyncStorage`
- On reconnect, the queue replays in order (chat messages, AI commands)
- Sync status is visible in the Lobby screen

### Session bundle sync (teacher)
- **Export:** serialises the entire session (messages, quiz attempts, reports, analytics) to a JSON bundle
- **Import:** restore a past session from bundle on a different machine
- **Peer sync:** `POST /sync/run` exchanges deltas with another EduLens instance on the LAN

### Flashcard persistence
- Flashcards are generated from the session topic at session start and saved to the database
- Students who join mid-session fetch them via `GET /session/:id` instead of relying on the WebSocket event

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Teacher UI** | Electron 28, React 18, TypeScript | Desktop shell + embedded server |
| **Student UI** | Expo SDK 54, React Native 0.81, TypeScript | Expo Go compatible |
| **Backend** | Express 4, better-sqlite3, ws | Embedded in Electron |
| **State** | Zustand + AsyncStorage (mobile) | Persist middleware |
| **AI (local)** | Ollama (`gemma2:2b`) | Runs on teacher laptop |
| **AI (cloud)** | Groq (`llama-3.3-70b-versatile`) | Optional fallback |
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

# Start all packages in parallel (from repo root)
npm run dev  # if configured in root package.json
```

**Branch naming:** `feat/`, `fix/`, `chore/`  
**Commit style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

---

<p align="center">
  Built with ❤️ for classrooms everywhere — works without internet, works without excuses.
</p>
