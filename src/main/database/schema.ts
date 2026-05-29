const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    encrypted INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    system_prompt TEXT DEFAULT '',
    enabled_knowledge_bases TEXT DEFAULT '[]',
    enabled_plugins TEXT DEFAULT '[]',
    enabled_skills TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    app_id TEXT DEFAULT '',
    app_name TEXT DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS knowledge_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    segment_delimiter TEXT DEFAULT '',
    segment_length INTEGER DEFAULT 2000,
    chunk_length INTEGER DEFAULT 500,
    overlap INTEGER DEFAULT 50,
    recall_count INTEGER DEFAULT 20,
    score_threshold REAL DEFAULT 0.5,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'custom',
    description TEXT DEFAULT '',
    config TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'installed',
    description TEXT DEFAULT '',
    installed_version TEXT DEFAULT '',
    latest_version TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS _integrity (
    id INTEGER PRIMARY KEY,
    hash TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`
]

export function getCreateTableStatements(): string[] {
  return SCHEMA_STATEMENTS
}

const ALLOWED_TABLES = new Set([
  'system_config',
  'apps',
  'conversations',
  'messages',
  'knowledge_bases',
  'tools',
  'skills'
])

const TABLES_WITH_AUTO_ID = new Set([
  'apps',
  'conversations',
  'messages',
  'knowledge_bases',
  'tools',
  'skills'
])

const TABLES_WITH_UPDATED_AT = new Set([
  'system_config',
  'apps',
  'conversations',
  'knowledge_bases',
  'tools',
  'skills'
])

export function isAllowedTable(table: string): boolean {
  return ALLOWED_TABLES.has(table)
}

export function hasAutoId(table: string): boolean {
  return TABLES_WITH_AUTO_ID.has(table)
}

export function hasUpdatedAt(table: string): boolean {
  return TABLES_WITH_UPDATED_AT.has(table)
}
