import type Database from 'better-sqlite3-multiple-ciphers'

// ── Parsed schema types ──

export interface ColumnDef {
  name: string
  type: string
  nullable: boolean
  defaultValue: string | null
  primaryKey: boolean
  unique: boolean
}

export interface IndexDef {
  name: string
  table: string
  columns: string[]
  unique: boolean
}

export interface TableDef {
  name: string
  columns: ColumnDef[]
  indexes: IndexDef[]
}

export interface SchemaDiff {
  /** Columns present in newDef but not in oldDef */
  addedColumns: ColumnDef[]
  /** Columns present in oldDef but not in newDef */
  removedColumns: string[]
  /** Columns whose type or constraints changed */
  changedColumns: Array<{ name: string; old: ColumnDef; next: ColumnDef }>
  /** Indexes present in newDef but not in oldDef */
  addedIndexes: IndexDef[]
  /** Indexes present in oldDef but not in newDef */
  removedIndexes: string[]
  /** Tables present in newDef but not in oldDef */
  addedTables: TableDef[]
}

export interface DiffResult {
  /** SQL statements to migrate from old schema to new schema */
  statements: string[]
  /** Human-readable summary of changes */
  summary: string[]
}

// ── Parsers ──

/**
 * Parse a "CREATE TABLE IF NOT EXISTS name (...)"  statement into a TableDef.
 */
export function parseTable(sql: string): TableDef {
  const nameMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)
  if (!nameMatch) {
    throw new Error(`Failed to parse table name from: ${sql.slice(0, 80)}`)
  }
  const name = nameMatch[1]!

  // Extract column definitions between the outer parentheses
  const bodyMatch = sql.match(/\(([\s\S]+)\)/i)
  if (!bodyMatch) {
    throw new Error(`Failed to parse table body for ${name}`)
  }
  const body = bodyMatch[1]!

  const columns: ColumnDef[] = []
  const tokens = splitColumns(body)

  for (const token of tokens) {
    const col = parseColumnDef(token)
    if (col) {
      columns.push(col)
    }
    // skip table-level constraints (PRIMARY KEY (...), UNIQUE (...), FOREIGN KEY)
  }

  return { name, columns, indexes: [] }
}

/**
 * Parse a "CREATE INDEX ..." or "CREATE UNIQUE INDEX ..." statement into an IndexDef.
 */
export function parseIndex(sql: string): IndexDef | null {
  const match = sql.match(
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/i
  )
  if (!match) return null
  const unique = !!match[1]
  const name = match[2]!
  const table = match[3]!
  const columns = match[4]!.split(',').map((c) => c.trim())
  return { name, table, columns, unique }
}

/**
 * Parse column definitions from an array of CREATE TABLE statements.
 */
export function parseTables(statements: string[]): TableDef[] {
  const tables: TableDef[] = []

  for (const sql of statements) {
    const trimmed = sql.trim()
    if (/^CREATE\s+TABLE/i.test(trimmed)) {
      tables.push(parseTable(trimmed))
    }
  }

  // Parse indexes and associate them with tables
  for (const sql of statements) {
    const trimmed = sql.trim()
    if (/^CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(trimmed)) {
      const idx = parseIndex(trimmed)
      if (idx) {
        const table = tables.find((t) => t.name === idx.table)
        if (table) {
          table.indexes.push(idx)
        }
      }
    }
  }

  return tables
}

// ── Diff engine ──

/**
 * Compare two sets of table definitions and produce migration statements.
 *
 * @param oldStatements - CREATE TABLE / INDEX statements for the old schema
 * @param newStatements - CREATE TABLE / INDEX statements for the new schema
 * @returns SQL statements to migrate from old to new, plus a human-readable summary
 */
export function diffSchemas(oldStatements: string[], newStatements: string[]): DiffResult {
  const oldTables = parseTables(oldStatements)
  const newTables = parseTables(newStatements)

  const statements: string[] = []
  const summary: string[] = []

  const oldMap = new Map(oldTables.map((t) => [t.name, t]))
  const newMap = new Map(newTables.map((t) => [t.name, t]))

  // Detect added tables
  for (const [name] of newMap) {
    if (!oldMap.has(name)) {
      const createSql = newStatements.find((s) => s.includes(`CREATE TABLE`) && s.includes(name))
      if (createSql) {
        statements.push(createSql)
        summary.push(`+ CREATE TABLE ${name}`)
      }
    }
  }

  // Detect removed tables (SQLite doesn't auto-drop — we warn only)
  for (const [name] of oldMap) {
    if (!newMap.has(name)) {
      summary.push(`⚠ Table "${name}" was removed (manual DROP TABLE if needed)`)
    }
  }

  // Compare columns and indexes for existing tables
  for (const [name, next] of newMap) {
    const old = oldMap.get(name)
    if (!old) continue // already handled as new table above

    // Column diff
    const oldColMap = new Map(old.columns.map((c) => [c.name, c]))
    const nextColMap = new Map(next.columns.map((c) => [c.name, c]))

    for (const [colName, nextCol] of nextColMap) {
      if (!oldColMap.has(colName)) {
        statements.push(buildAddColumn(name, nextCol))
        summary.push(`+ ALTER TABLE ${name} ADD COLUMN ${colName}`)
      } else {
        const oldCol = oldColMap.get(colName)!
        if (!columnsEqual(oldCol, nextCol)) {
          summary.push(
            `⚠ ${name}.${colName} type/constraint changed (SQLite ALTER COLUMN not supported — manual migration needed)`
          )
        }
      }
    }

    for (const [colName] of oldColMap) {
      if (!nextColMap.has(colName)) {
        summary.push(`⚠ Column "${name}.${colName}" removed (manual ALTER TABLE DROP COLUMN if needed)`)
      }
    }

    // Index diff
    const oldIdxMap = new Map(old.indexes.map((i) => [i.name, i]))
    const nextIdxMap = new Map(next.indexes.map((i) => [i.name, i]))

    for (const [idxName, idx] of nextIdxMap) {
      if (!oldIdxMap.has(idxName)) {
        statements.push(buildCreateIndex(idx))
        summary.push(`+ CREATE INDEX ${idxName} ON ${idx.table}`)
      }
    }

    for (const [idxName] of oldIdxMap) {
      if (!nextIdxMap.has(idxName)) {
        statements.push(`DROP INDEX IF EXISTS ${idxName}`)
        summary.push(`- DROP INDEX ${idxName}`)
      }
    }
  }

  return { statements, summary }
}

/**
 * Run schema diff against a live database and print the migration SQL.
 *
 * Usage (from a dev script or REPL):
 *   printDiff(oldStatements, newStatements)
 */
export function printDiff(oldStatements: string[], newStatements: string[]): void {
  const { statements, summary } = diffSchemas(oldStatements, newStatements)

  console.log('── Schema Diff Summary ──')
  for (const line of summary) {
    console.log(line)
  }
  if (statements.length > 0) {
    console.log('\n── Migration SQL ──')
    for (const sql of statements) {
      console.log(sql + ';')
    }
  }
}

/**
 * utility: read the schema_version from a live DB
 */
export function readLiveVersion(db: Database.Database): number {
  const row = db
    .prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
    .get() as { version: number } | undefined
  return row?.version ?? 0
}

/**
 * utility: dump the current schema of a live DB as CREATE TABLE statements
 * so you can diff against the code definitions.
 */
export function dumpLiveSchema(db: Database.Database): string[] {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string }>

  const statements: string[] = []
  for (const { name } of tables) {
    const row = db
      .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name = ?`)
      .get(name) as { sql: string } | undefined
    if (row?.sql) {
      statements.push(row.sql)
    }
    // Also fetch indexes
    const indexes = db
      .prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name = ? AND sql IS NOT NULL`)
      .all(name) as Array<{ sql: string }>
    for (const idx of indexes) {
      statements.push(idx.sql)
    }
  }
  return statements
}

// ── Internal helpers ──

function parseColumnDef(token: string): ColumnDef | null {
  const trimmed = token.trim()

  // Skip table-level constraints
  if (
    /^(PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CONSTRAINT|CHECK)\b/i.test(trimmed)
  ) {
    return null
  }

  // Split into tokens: "name TYPE CONSTRAINTS..."
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return null

  const colName = parts[0]!
  const colType = parts[1]!
  const upper = trimmed.toUpperCase()

  return {
    name: colName,
    type: colType,
    nullable: !upper.includes('NOT NULL'),
    defaultValue: extractDefault(trimmed),
    primaryKey: upper.includes('PRIMARY KEY'),
    unique: upper.includes('UNIQUE')
  }
}

function extractDefault(colDef: string): string | null {
  const match = colDef.match(/DEFAULT\s+([^\s,]+)/i)
  if (!match) return null
  let val = match[1]!
  // strip trailing commas / parens
  val = val.replace(/[,)]$/, '')
  // strip surrounding quotes
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1)
  }
  return val
}

function splitColumns(body: string): string[] {
  const result: string[] = []
  let depth = 0
  let current = ''

  for (const ch of body) {
    if (ch === '(') depth++
    else if (ch === ')') depth--

    if (ch === ',' && depth === 0) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) {
    result.push(current)
  }
  return result
}

function columnsEqual(a: ColumnDef, b: ColumnDef): boolean {
  return (
    a.type.toUpperCase() === b.type.toUpperCase() &&
    a.nullable === b.nullable &&
    a.primaryKey === b.primaryKey &&
    a.unique === b.unique &&
    a.defaultValue === b.defaultValue
  )
}

function buildAddColumn(table: string, col: ColumnDef): string {
  const parts: string[] = [`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`]
  if (!col.nullable) parts.push('NOT NULL')
  if (col.defaultValue !== null) {
    const isNumeric = /^\d+(\.\d+)?$/.test(col.defaultValue)
    const val = isNumeric || col.defaultValue === 'CURRENT_TIMESTAMP'
      ? col.defaultValue
      : `'${col.defaultValue}'`
    parts.push(`DEFAULT ${val}`)
  }
  if (col.unique) parts.push('UNIQUE')
  return parts.join(' ')
}

function buildCreateIndex(idx: IndexDef): string {
  const unique = idx.unique ? 'UNIQUE ' : ''
  return `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} (${idx.columns.join(', ')})`
}
