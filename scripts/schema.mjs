import { existsSync, writeFileSync } from 'fs'
import { resolve, basename, join } from 'path'
import { createHash } from 'crypto'
import dotenv from 'dotenv'
import Database from 'better-sqlite3-multiple-ciphers'

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
dotenv.config({ path: join(process.cwd(), '.env') })
dotenv.config({ path: join(process.cwd(), `.env.${mode}`) })

// ── Key derivation (must match src/main/database/encryption.ts) ──

function deriveKey(ident, dbSecret, purpose = '') {
  return createHash('sha256').update(ident + ':' + dbSecret + ':' + purpose).digest()
}

function derivePassphrase(ident, dbSecret) {
  return deriveKey(ident, dbSecret, '').toString('hex')
}

function deriveHmacKey(ident, dbSecret) {
  return deriveKey(ident, dbSecret, 'hmac')
}

// ── CLI ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`Usage: node scripts/schema.mjs <command> [options]

Commands:
  key                       Print derived encryption keys (passphrase + HMAC)
  export <db-path>          Dump schema from a database as TypeScript table definitions
  diff <old-db> <new-db>    Compare two databases and output migration SQL
  sync <system-db> <user-db> Sync live databases to schema.ts with auto-derived helpers

Options:
  --plain                   Database is not encrypted
  --system                  Use system identity (ident = 'system')
  --passphrase <hex>        Hex-encoded encryption passphrase (for SQLCipher)
  --user-passphrase <hex>   User DB passphrase (sync command, falls back to --passphrase)
  --db-secret <secret>      Derive passphrase from secret + identity
  --ident <ident>           Identity for key derivation (use with --db-secret)
  --user-ident <ident>      User DB identity (sync command, falls back to --ident)
  -o, --output <path>       Write output to file instead of stdout
  -h, --help                Show this help

Examples:
  node scripts/schema.mjs key --system --db-secret mysecret
  node scripts/schema.mjs key --ident DEV001 --db-secret mysecret
  node scripts/schema.mjs export userdata/system.db --db-secret mysecret --ident system
  node scripts/schema.mjs diff old.db new.db --passphrase abc123...
  node scripts/schema.mjs sync userdata/system.db userdata/fs-bot.db --db-secret mysecret --system --user-ident DEV001
`)
  process.exit(0)
}

function parseArgs(argv) {
  const opts = { command: '', plain: false, system: false, passphrase: '', userPassphrase: '', dbSecret: '', ident: '', userIdent: '', output: '' }
  const positional = []

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') printHelp()
    else if (argv[i] === '--plain') opts.plain = true
    else if (argv[i] === '--system') opts.system = true
    else if (argv[i] === '--passphrase' && i + 1 < argv.length) opts.passphrase = argv[++i]
    else if (argv[i] === '--user-passphrase' && i + 1 < argv.length) opts.userPassphrase = argv[++i]
    else if (argv[i] === '--db-secret' && i + 1 < argv.length) opts.dbSecret = argv[++i]
    else if (argv[i] === '--ident' && i + 1 < argv.length) opts.ident = argv[++i]
    else if (argv[i] === '--user-ident' && i + 1 < argv.length) opts.userIdent = argv[++i]
    else if ((argv[i] === '-o' || argv[i] === '--output') && i + 1 < argv.length) opts.output = argv[++i]
    else if (!argv[i].startsWith('--') && !argv[i].startsWith('-')) positional.push(argv[i])
  }

  if (positional[0] === 'export' || positional[0] === 'diff' || positional[0] === 'key' || positional[0] === 'sync') {
    opts.command = positional[0]
    positional.shift()
  }

  return { opts, positional }
}

// ── DB helpers ───────────────────────────────────────────────────

function getPassphrase(opts) {
  if (opts.plain) return null
  if (opts.passphrase) return opts.passphrase
  if (opts.dbSecret && opts.ident) {
    return derivePassphrase(opts.ident, opts.dbSecret)
  }
  return null
}

function openDb(dbPath, passphrase) {
  const absPath = resolve(dbPath)
  if (!existsSync(absPath)) {
    console.error(`Error: Database not found: ${absPath}`)
    process.exit(1)
  }

  if (passphrase) {
    const db = new Database(absPath)
    db.pragma("cipher='sqlcipher'")
    db.pragma('legacy=4')
    db.pragma(`key='${passphrase}'`)
    try {
      db.prepare("SELECT COUNT(*) FROM sqlite_master").get()
    } catch (e) {
      console.error('Error: Failed to open encrypted database — wrong passphrase or corrupted file')
      console.error(e.message)
      process.exit(1)
    }
    return db
  }

  return new Database(absPath)
}

function dumpSchema(db) {
  const stmts = []

  const tableRows = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY name"
  ).all()

  for (const row of tableRows) {
    stmts.push(row.sql)
  }

  const indexRows = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all()

  for (const row of indexRows) {
    stmts.push(row.sql)
  }

  return stmts
}

// ── Helpers ───────────────────────────────────────────────────────

function extractTableName(sql) {
  const m = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)
  return m ? m[1] : null
}

function deriveHelpers(systemStmts, userStmts) {
  const allStmts = [...systemStmts, ...userStmts]
  const systemNames = systemStmts.map(extractTableName).filter(Boolean)
  const userNames = userStmts.map(extractTableName).filter(Boolean)
  const allNames = [...systemNames, ...userNames]

  const allowedTables = allNames.filter((t) => t !== '_integrity' && t !== 'schema_version')

  const autoIdTables = allStmts
    .filter((s) => /\bid\s+TEXT\s+PRIMARY\s+KEY\b/i.test(s))
    .map(extractTableName)
    .filter(Boolean)

  const updatedAtTables = allStmts
    .filter((s) => /\bupdated_at\b/i.test(s))
    .map(extractTableName)
    .filter(Boolean)

  const pkMap = {}
  for (const stmt of allStmts) {
    const name = extractTableName(stmt)
    if (!name) continue
    const pkMatch = stmt.match(/(\w+)\s+(?:TEXT|INTEGER|REAL|BLOB)\s+PRIMARY\s+KEY/i)
    if (pkMatch && pkMatch[1] !== 'id') {
      pkMap[name] = [pkMatch[1]]
    }
  }

  const systemMetaSet = new Set(systemNames.filter((t) => t !== '_integrity' && t !== 'schema_version'))

  return { allowedTables, autoIdTables, updatedAtTables, pkMap, systemNames, userNames, systemMetaSet }
}

// ── Schema export ────────────────────────────────────────────────

function formatAsTsType(statement) {
  const escaped = statement.replace(/`/g, '\\`')
  return '  `' + escaped + '`'
}

function exportSchema(dbPath, passphrase, outputPath) {
  const db = openDb(dbPath, passphrase)
  const stmts = dumpSchema(db)
  db.close()

  const dbName = basename(dbPath, '.db')
  const varName = dbName.toUpperCase().replace(/[^A-Z0-9]+/g, '_') + '_TABLES'
  const lines = []

  lines.push(`const ${varName} = [`)
  for (const stmt of stmts) {
    lines.push(formatAsTsType(stmt) + ',')
  }
  lines.push(']')
  lines.push('')
  const funcName = 'get' + dbName.charAt(0).toUpperCase() + dbName.slice(1) + 'TableStatements'
  lines.push(`export function ${funcName}(): string[] {`)
  lines.push(`  return ${varName}`)
  lines.push('}')

  const output = lines.join('\n')

  if (outputPath) {
    writeFileSync(outputPath, output + '\n', 'utf-8')
    console.log(`Schema written to: ${outputPath}`)
  } else {
    console.log(output)
  }
}

// ── Schema diff ──────────────────────────────────────────────────

function parseTable(sql) {
  const nameMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)
  if (!nameMatch) return null
  const name = nameMatch[1]

  const bodyMatch = sql.match(/\(([\s\S]+)\)/i)
  if (!bodyMatch) return null
  const body = bodyMatch[1]

  const columns = []
  const tokens = splitColumns(body)
  for (const token of tokens) {
    const col = parseColumnDef(token)
    if (col) columns.push(col)
  }

  return { name, columns, indexes: [] }
}

function parseColumnDef(token) {
  const trimmed = token.trim()
  if (/^(PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CONSTRAINT|CHECK)\b/i.test(trimmed)) return null

  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return null

  const colName = parts[0]
  const colType = parts[1]
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

function extractDefault(colDef) {
  const match = colDef.match(/DEFAULT\s+([^\s,]+)/i)
  if (!match) return null
  let val = match[1]
  val = val.replace(/[,)]$/, '')
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1)
  }
  return val
}

function splitColumns(body) {
  const result = []
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
  if (current.trim()) result.push(current)
  return result
}

function parseIndex(sql) {
  const match = sql.match(
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/i
  )
  if (!match) return null
  return {
    name: match[2],
    table: match[3],
    columns: match[4].split(',').map((c) => c.trim()),
    unique: !!match[1]
  }
}

function parseTables(statements) {
  const tables = []
  for (const sql of statements) {
    if (/^CREATE\s+TABLE/i.test(sql.trim())) {
      const t = parseTable(sql.trim())
      if (t) tables.push(t)
    }
  }
  for (const sql of statements) {
    if (/^CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(sql.trim())) {
      const idx = parseIndex(sql.trim())
      if (idx) {
        const table = tables.find((t) => t.name === idx.table)
        if (table) table.indexes.push(idx)
      }
    }
  }
  return tables
}

function columnsEqual(a, b) {
  return (
    a.type.toUpperCase() === b.type.toUpperCase() &&
    a.nullable === b.nullable &&
    a.primaryKey === b.primaryKey &&
    a.unique === b.unique &&
    a.defaultValue === b.defaultValue
  )
}

function diffSchemas(oldStmts, newStmts) {
  const oldTables = parseTables(oldStmts)
  const newTables = parseTables(newStmts)
  const statements = []
  const summary = []

  const oldMap = new Map(oldTables.map((t) => [t.name, t]))
  const newMap = new Map(newTables.map((t) => [t.name, t]))

  for (const [name] of newMap) {
    if (!oldMap.has(name)) {
      const createSql = newStmts.find((s) => s.includes('CREATE TABLE') && s.includes(name))
      if (createSql) {
        statements.push(createSql)
        summary.push('+ CREATE TABLE ' + name)
      }
    }
  }

  for (const [name] of oldMap) {
    if (!newMap.has(name)) {
      summary.push('⚠ Table "' + name + '" removed (manual DROP TABLE if needed)')
    }
  }

  for (const [name, next] of newMap) {
    const old = oldMap.get(name)
    if (!old) continue

    const oldColMap = new Map(old.columns.map((c) => [c.name, c]))
    const nextColMap = new Map(next.columns.map((c) => [c.name, c]))

    for (const [colName, nextCol] of nextColMap) {
      if (!oldColMap.has(colName)) {
        const parts = [`ALTER TABLE ${name} ADD COLUMN ${colName} ${nextCol.type}`]
        if (!nextCol.nullable) parts.push('NOT NULL')
        if (nextCol.defaultValue !== null) {
          const isNumeric = /^\d+(\.\d+)?$/.test(nextCol.defaultValue)
          const val =
            isNumeric || nextCol.defaultValue === 'CURRENT_TIMESTAMP'
              ? nextCol.defaultValue
              : `'${nextCol.defaultValue}'`
          parts.push('DEFAULT ' + val)
        }
        if (nextCol.unique) parts.push('UNIQUE')
        statements.push(parts.join(' '))
        summary.push('+ ALTER TABLE ' + name + ' ADD COLUMN ' + colName)
      } else {
        const oldCol = oldColMap.get(colName)
        if (!columnsEqual(oldCol, nextCol)) {
          summary.push('⚠ ' + name + '.' + colName + ' changed — manual migration needed')
        }
      }
    }

    for (const [colName] of oldColMap) {
      if (!nextColMap.has(colName)) {
        summary.push('⚠ Column ' + name + '.' + colName + ' removed (manual DROP)')
      }
    }

    const oldIdxMap = new Map(old.indexes.map((i) => [i.name, i]))
    const nextIdxMap = new Map(next.indexes.map((i) => [i.name, i]))

    for (const [idxName, idx] of nextIdxMap) {
      if (!oldIdxMap.has(idxName)) {
        const unique = idx.unique ? 'UNIQUE ' : ''
        statements.push(
          `CREATE ${unique}INDEX IF NOT EXISTS ${idxName} ON ${idx.table} (${idx.columns.join(', ')})`
        )
        summary.push('+ CREATE INDEX ' + idxName + ' ON ' + idx.table)
      }
    }

    for (const [idxName] of oldIdxMap) {
      if (!nextIdxMap.has(idxName)) {
        statements.push('DROP INDEX IF EXISTS ' + idxName)
        summary.push('- DROP INDEX ' + idxName)
      }
    }
  }

  return { statements, summary }
}

function diffDatabases(oldPath, newPath, passphrase, outputPath) {
  const oldDb = openDb(oldPath, passphrase)
  const oldSchema = dumpSchema(oldDb)
  oldDb.close()

  const newDb = openDb(newPath, passphrase)
  const newSchema = dumpSchema(newDb)
  newDb.close()

  const { statements, summary } = diffSchemas(oldSchema, newSchema)

  const lines = ['── Schema Diff ──']
  for (const line of summary) {
    lines.push(line)
  }
  if (statements.length > 0) {
    lines.push('')
    lines.push('── Migration SQL ──')
    for (const sql of statements) {
      lines.push(sql + ';')
    }
  } else if (summary.length === 0) {
    lines.push('(no differences found)')
  }

  const output = lines.join('\n')

  if (outputPath) {
    writeFileSync(outputPath, output + '\n', 'utf-8')
    console.log('Diff written to: ' + outputPath)
  } else {
    console.log(output)
  }
}

// ── Schema sync ──────────────────────────────────────────────────

function syncSchema(systemDbPath, userDbPath, sysPass, userPass, outputPath) {
  const systemStmts = systemDbPath ? dumpSchema(openDb(systemDbPath, sysPass)) : []
  const userStmts = userDbPath ? dumpSchema(openDb(userDbPath, userPass)) : []
  const helpers = deriveHelpers(systemStmts, userStmts)

  const outputPathResolved = outputPath || resolve('src/main/database/schema.ts')
  const lines = []

  lines.push('const SYSTEM_TABLES = [')
  for (const stmt of systemStmts) {
    lines.push(formatAsTsType(stmt) + ',')
  }
  lines.push(']')
  lines.push('')

  lines.push('const USER_TABLES = [')
  for (const stmt of userStmts) {
    lines.push(formatAsTsType(stmt) + ',')
  }
  lines.push(']')
  lines.push('')

  lines.push('export function getSystemTableStatements(): string[] {')
  lines.push('  return SYSTEM_TABLES')
  lines.push('}')
  lines.push('')
  lines.push('export function getUserTableStatements(): string[] {')
  lines.push('  return USER_TABLES')
  lines.push('}')
  lines.push('')

  lines.push('const ALLOWED_TABLES = new Set([')
  for (const t of helpers.allowedTables) {
    lines.push(`  '${t}',`)
  }
  lines.push('])')
  lines.push('')

  lines.push('const TABLES_WITH_AUTO_ID = new Set([')
  for (const t of helpers.autoIdTables) {
    lines.push(`  '${t}',`)
  }
  lines.push('])')
  lines.push('')

  lines.push('const TABLES_WITH_UPDATED_AT = new Set([')
  for (const t of helpers.updatedAtTables) {
    lines.push(`  '${t}',`)
  }
  lines.push('])')
  lines.push('')

  lines.push('export function isAllowedTable(table: string): boolean {')
  lines.push('  return ALLOWED_TABLES.has(table)')
  lines.push('}')
  lines.push('')
  lines.push('export function hasAutoId(table: string): boolean {')
  lines.push('  return TABLES_WITH_AUTO_ID.has(table)')
  lines.push('}')
  lines.push('')
  lines.push('export function hasUpdatedAt(table: string): boolean {')
  lines.push('  return TABLES_WITH_UPDATED_AT.has(table)')
  lines.push('}')
  lines.push('')

  const sysMeta = [...helpers.systemMetaSet]
  lines.push('export function isSystemTable(table: string): boolean {')
  if (sysMeta.length === 0) {
    lines.push('  return false')
  } else {
    lines.push(`  return ${sysMeta.map((t) => `table === '${t}'`).join(' || ')}`)
  }
  lines.push('}')
  lines.push('')

  const pkEntries = Object.entries(helpers.pkMap)
  lines.push('const TABLE_PRIMARY_KEYS: Record<string, string[]> = {')
  for (const [table, pks] of pkEntries) {
    lines.push(`  ${table}: [${pks.map((p) => `'${p}'`).join(', ')}],`)
  }
  lines.push('}')
  lines.push('')
  lines.push('export function getPrimaryKeys(table: string): string[] {')
  lines.push("  return TABLE_PRIMARY_KEYS[table] ?? ['id']")
  lines.push('}')

  const output = lines.join('\n')
  writeFileSync(outputPathResolved, output + '\n', 'utf-8')
  console.log(`Schema synced to: ${outputPathResolved}`)
}

// ── Key command ───────────────────────────────────────────────────

function cmdKey(dbSecret, ident) {
  const passphrase = derivePassphrase(ident, dbSecret)
  const hmacKey = deriveHmacKey(ident, dbSecret)

  console.log(`Identity:   ${ident}`)
  console.log(`DB Secret:  ${dbSecret}`)
  console.log('── Keys (hex) ──')
  console.log(`Passphrase: ${passphrase}`)
  console.log(`HMAC Key:   ${hmacKey.toString('hex')}`)
  console.log('')
  console.log('── SQLCipher pragma ──')
  console.log(`PRAGMA key = "x'${passphrase}'";`)
}

// ── Main ─────────────────────────────────────────────────────────

const { opts, positional } = parseArgs(process.argv.slice(2))

if (!opts.command) {
  console.error('Error: Unknown command (use --help for usage)')
  process.exit(1)
}

// Resolve --system to --ident
if (opts.system && !opts.ident) {
  opts.ident = 'system'
}

// Resolve dbSecret from env
if (!opts.dbSecret && process.env['VITE_DB_SECRET']) {
  opts.dbSecret = process.env['VITE_DB_SECRET']
}

// Key command — no database needed
if (opts.command === 'key') {
  if (!opts.dbSecret) {
    console.error('Error: --db-secret is required (or set VITE_DB_SECRET env var)')
    process.exit(1)
  }
  if (!opts.ident) {
    console.error('Error: --ident or --system is required')
    process.exit(1)
  }
  cmdKey(opts.dbSecret, opts.ident)
  process.exit(0)
}

// Sync command — two databases → schema.ts
if (opts.command === 'sync') {
  if (positional.length < 2) {
    console.error('Usage: node scripts/schema.mjs sync <system-db> <user-db> [options]')
    process.exit(1)
  }
  const sysPass = getPassphrase(opts)
  const userPass = getPassphrase({
    ...opts,
    passphrase: opts.userPassphrase || opts.passphrase,
    ident: opts.userIdent || opts.ident
  })
  syncSchema(resolve(positional[0]), resolve(positional[1]), sysPass, userPass, opts.output)
  process.exit(0)
}

// Warn if database might be encrypted but no passphrase provided
const passphrase = getPassphrase(opts)
if (!passphrase && !opts.plain) {
  console.error(
    'Warning: No passphrase or --plain specified. If the database is encrypted, this will fail.'
  )
  console.error(
    'Use --passphrase <hex>, --db-secret + --ident, or --plain for unencrypted databases.'
  )
}

if (opts.command === 'export') {
  if (positional.length < 1) {
    console.error('Usage: node scripts/schema.mjs export <db-path> [options]')
    process.exit(1)
  }
  exportSchema(resolve(positional[0]), passphrase, opts.output)
} else if (opts.command === 'diff') {
  if (positional.length < 2) {
    console.error('Usage: node scripts/schema.mjs diff <old-db> <new-db> [options]')
    process.exit(1)
  }
  diffDatabases(resolve(positional[0]), resolve(positional[1]), passphrase, opts.output)
}
