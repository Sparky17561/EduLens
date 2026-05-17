import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database

export function getDb(): Database.Database {
  return db
}

export function initDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath || process.env.DB_PATH || path.join(process.cwd(), 'data', 'edulens.db')

  // Ensure directory exists
  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(resolvedPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables(db)
  seedDefaultTeacher(db)

  console.log(`[DB] SQLite initialized at: ${resolvedPath}`)
  return db
}

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'student')),
      pin TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'General',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'ended')),
      session_code TEXT NOT NULL UNIQUE,
      qr_data TEXT,
      host_ip TEXT,
      port INTEGER DEFAULT 3001,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS session_members (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      left_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(session_id) REFERENCES sessions(id),
      FOREIGN KEY(student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'student', 'ai')),
      content TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'chat' CHECK(message_type IN ('chat', 'ask', 'generate', 'system')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'General',
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_reports (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      quiz_id TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      weak_topics_json TEXT NOT NULL DEFAULT '[]',
      strong_topics_json TEXT NOT NULL DEFAULT '[]',
      topic_breakdown_json TEXT NOT NULL DEFAULT '{}',
      homework_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS homework_tasks (
      id TEXT PRIMARY KEY,
      student_report_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(student_report_id) REFERENCES student_reports(id)
    );

    CREATE TABLE IF NOT EXISTS analytics_summary (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      total_students INTEGER NOT NULL DEFAULT 0,
      avg_score REAL NOT NULL DEFAULT 0,
      topic_breakdown_json TEXT NOT NULL DEFAULT '{}',
      weak_students_json TEXT NOT NULL DEFAULT '[]',
      strong_students_json TEXT NOT NULL DEFAULT '[]',
      ai_summary TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );
  `)
}

function seedDefaultTeacher(db: Database.Database) {
  const existing = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('teacher')
  if (!existing) {
    db.prepare(`
      INSERT INTO users (id, name, role, pin) VALUES (?, ?, ?, ?)
    `).run('teacher-default', 'Teacher', 'teacher', process.env.DEFAULT_TEACHER_PIN || '1234')
    console.log('[DB] Default teacher seeded (PIN: 1234)')
  }
}
