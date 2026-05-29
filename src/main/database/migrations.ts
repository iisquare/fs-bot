import type Database from 'better-sqlite3-multiple-ciphers'

/**
 * Current schema versions that the application expects.
 * These must be bumped whenever you add a new migration entry below.
 */
export const SYSTEM_SCHEMA_VERSION = 1
export const USER_SCHEMA_VERSION = 1

type MigrationFn = (db: Database.Database) => void

// ── System DB migrations ──
//
// Add entries here when the system DB schema changes.
// Example:
//   2: (db) => {
//     db.exec(`ALTER TABLE system_config ADD COLUMN description TEXT DEFAULT ''`)
//   },

const SYSTEM_MIGRATIONS: Record<number, MigrationFn> = {}

// ── User DB migrations ──
//
// Add entries here when the user DB schema changes.
// Example:
//   2: (db) => {
//     db.exec(`ALTER TABLE apps ADD COLUMN tags TEXT DEFAULT ''`)
//     db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)`)
//   },

const USER_MIGRATIONS: Record<number, MigrationFn> = {}

// ── Runner ──

/**
 * Run all pending migrations for the given DB type.
 *
 * Rules:
 *  - Migrations are applied sequentially from (current + 1) up to targetVersion.
 *  - If the DB version is already >= targetVersion, nothing runs.
 *  - If the DB version is greater than targetVersion (downgrade), an error is thrown.
 *  - Each successful migration step updates schema_version immediately.
 */
export function runMigrations(
  db: Database.Database,
  dbType: 'system' | 'user',
  targetVersion: number
): void {
  const migrations = dbType === 'system' ? SYSTEM_MIGRATIONS : USER_MIGRATIONS
  const current = getCurrentVersion(db)

  if (current > targetVersion) {
    throw new Error(
      `[DB] ${dbType} DB version (v${current}) is newer than app version (v${targetVersion}). ` +
        `Downgrade is not supported. Please upgrade the application.`
    )
  }

  for (let v = current + 1; v <= targetVersion; v++) {
    const migrate = migrations[v]
    if (migrate) {
      console.log(`[DB] Running ${dbType} migration v${v}`)
      migrate(db)
    }
    setVersion(db, v)
    console.log(`[DB] ${dbType} schema version updated to v${v}`)
  }
}

function getCurrentVersion(db: Database.Database): number {
  const row = db
    .prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
    .get() as { version: number } | undefined
  return row?.version ?? 0
}

function setVersion(db: Database.Database, version: number): void {
  db.prepare(
    `INSERT INTO schema_version (version, updated_at) VALUES (?, datetime('now'))
     ON CONFLICT(version) DO UPDATE SET updated_at = excluded.updated_at`
  ).run(version)
}
