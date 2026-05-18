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

    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      chunk_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      synced_at TEXT NOT NULL DEFAULT (datetime('now')),
      record_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'success'
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      session_id TEXT,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','syncing','synced','failed')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_snapshots (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      session_id TEXT,
      payload_json TEXT NOT NULL,
      synced_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rag_chunks (
      id TEXT PRIMARY KEY,
      kb_id TEXT NOT NULL,
      text TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '',
      chapter TEXT NOT NULL DEFAULT 'General',
      page INTEGER NOT NULL DEFAULT 1,
      vector_json TEXT NOT NULL DEFAULT '[]',
      tokens_json TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY(kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS misconceptions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      student_id TEXT,
      student_name TEXT,
      topic TEXT NOT NULL,
      category TEXT NOT NULL,
      pattern TEXT NOT NULL,
      explanation TEXT NOT NULL,
      suggestion TEXT NOT NULL,
      wrong_answer TEXT,
      correct_answer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS reteach_plans (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      lesson_summary TEXT NOT NULL,
      concept_explanation TEXT NOT NULL,
      exercises_json TEXT NOT NULL DEFAULT '[]',
      examples_json TEXT NOT NULL DEFAULT '[]',
      homework_json TEXT NOT NULL DEFAULT '{}',
      quiz_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','assigned','archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );
  `)

  migrateSchema(db)
}

function migrateSchema(db: Database.Database) {
  // Expand message_type for new chat commands (SQLite: recreate constraint via loose storage)
  try {
    db.exec(`ALTER TABLE student_reports ADD COLUMN homework_status TEXT NOT NULL DEFAULT 'pending'`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE knowledge_bases ADD COLUMN source_count INTEGER NOT NULL DEFAULT 1`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE analytics_summary ADD COLUMN strong_topics_json TEXT NOT NULL DEFAULT '[]'`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'mcq'`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN bloom_level TEXT NOT NULL DEFAULT 'Understand'`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN extra_json TEXT NOT NULL DEFAULT '{}'`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE knowledge_bases ADD COLUMN file_size INTEGER NOT NULL DEFAULT 0`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE knowledge_bases ADD COLUMN page_count INTEGER NOT NULL DEFAULT 0`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN meta_json TEXT NOT NULL DEFAULT '{}'`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE rag_chunks ADD COLUMN embedding_json TEXT`)
  } catch { /* column exists */ }
  try {
    db.exec(`ALTER TABLE sessions ADD COLUMN flashcards_json TEXT`)
  } catch { /* column exists */ }
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
