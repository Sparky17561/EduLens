# EduLens

**LAN-first, AI-pluggable classroom platform**  
Teacher Electron desktop app + Student Expo mobile app + Shared Express/SQLite backend

---

## Architecture

```
EduLens/
├── packages/
│   ├── backend/          # Express + SQLite + WebSocket (runs inside Electron)
│   ├── teacher-app/      # Electron + React + TypeScript (teacher laptop)
│   └── student-app/      # React Native + Expo (student phone)
├── .env.example
└── package.json          # npm workspaces root
```

**How it works:**
- The backend starts **inside the Electron process** — no separate server needed
- Students connect over **Wi-Fi** (same local network) using the teacher's LAN IP
- AI calls go to **Ollama** (fully offline, no internet dependency)
- To switch to cloud later: replace `OllamaProvider` with `GroqProvider` in `packages/backend/src/services/aiService.ts`

---

## Prerequisites

- **Node.js 18+**
- **npm 9+**
- **Ollama** installed locally running a GGUF model
- **Expo Go** app on student phones (iOS or Android)

---

## Setup

```bash
# 1. Clone and install
cd EduLens
npm install

# 2. Configure environment
cp .env.example .env
# Make sure Ollama is running locally
```

---

## Running

### Teacher Desktop App (Electron)

```bash
cd packages/teacher-app
npm run dev
```

The Electron window opens, the backend starts automatically on port `3001`, and you see the login screen.

**Default login:** Name: anything · PIN: `1234`

### Student Mobile App (Expo)

```bash
cd packages/student-app
npx expo start
```

Scan the QR code in your terminal with **Expo Go** on the student's phone.

### Backend Standalone (for development/testing)

```bash
cd packages/backend
npm run dev
```

---

## Demo Flow (9 steps)

| # | Who | Action | Result |
|---|---|---|---|
| 1 | Teacher | Login → Start Session | QR + 6-char code appear |
| 2 | Student | Scan QR or enter code | Appears in teacher roster |
| 3 | Student | Type `/ask what is photosynthesis` | AI responds in chat |
| 4 | Teacher | Type `/generate Newton's laws` | Lesson outline appears |
| 5 | Teacher | Create 3-question quiz → Launch | Students see quiz screen |
| 6 | Student | Answer quiz → Submit | Score + homework appear |
| 7 | Teacher | Click Analytics tab | Topic chart + weak areas update |
| 8 | Teacher | Click Reports → Export | QR modal + JSON download |
| 9 | Teacher | End Session | Students see exit screen |

---

## QR Join Fallback

If QR scanning fails, students have two alternatives:
1. **Type the 6-char session code** (shown on teacher screen) + teacher IP address
2. **Paste the full join URL** from the teacher screen

The teacher's IP is shown under the QR code.

---

## AI Features

| Command | Who | What it does |
|---|---|---|
| `/ask [question]` | Student | Gets a clear AI explanation via Ollama |
| `/generate [topic]` | Teacher | Gets a structured lesson outline |
| Auto (after quiz) | System | Generates personalized homework per student |
| Auto (at report) | System | Generates analytics summary |

All AI calls use Ollama (local GGUF). If Ollama is not running, a graceful fallback message is shown and all non-AI features continue working.

---

## Swapping the AI Provider

The AI service has a single swap point:

```typescript
// packages/backend/src/services/aiService.ts

// Current: Ollama / local GGUF
export const aiProvider: AIProvider = new OllamaProvider()

// Backup: Groq (cloud)
// Uncomment GroqProvider class and use:
// export const aiProvider: AIProvider = new GroqProvider()
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OLLAMA_URL` | No | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_MODEL` | No | `edulens` | Local GGUF model to use |
| `PORT` | No | `3001` | Backend port |
| `DB_PATH` | No | `userData/edulens.db` | SQLite file path |
| `DEFAULT_TEACHER_PIN` | No | `1234` | Teacher login PIN |

---

## Building for Production

```bash
# Teacher app (Windows installer)
cd packages/teacher-app
npm run build:win

# Teacher app (macOS .dmg)
npm run build:mac
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Teacher app shell | Electron + electron-vite |
| Teacher app UI | React + TypeScript + Recharts |
| Student app | React Native + Expo |
| Backend | Express + TypeScript |
| Database | SQLite (better-sqlite3) |
| Real-time | WebSocket (ws) |
| AI (current) | Ollama / local GGUF |
| AI (backup) | Groq API (llama3-70b) |
| State | Zustand |
| QR | qrcode + qrcode.react + expo-camera |
