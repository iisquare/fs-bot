import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, basename } from 'path'
import { createHash } from 'crypto'
import initSqlJs from 'sql.js'

// ── CLI ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`Usage: node scripts/schema.mjs <command> [options]

Commands:
  export <db-path>       Dump schema from a database as TypeScript table definitions
  diff <old-db> <new-db> Compare two databases and output migration SQL

Options:
  --plain                Database is not encrypted (required; encrypted dbs not supported by this script)
  -o, --output <path>    Write output to file instead of stdout

Examples:
  node scripts/schema.mjs export userdata/system.db --plain
  node scripts/schema.mjs diff old.db new.db --plain
  node scripts/schema.mjs export test.db --plain -o schema.ts
`)
  process.exit(0)
}

function parseArgs(argv) {
  const opts = { command: '', plain: false, output: '' }
  const positional = []

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') printHelp()
    else if (argv[i] === '--plain') opts.plain = true
    else if ((argv[i] === '-o' || argv[i] === '--output') && i + 1 < argv.length) opts.output = argv[++i]
    else if (!argv[i].startsWith('--') && !argv[i].startsWith('-')) positional.push(argv[i])
  }

  if (positional[0] === 'export' || positional[0] === 'diff') {
    opts.command = positional[0]
    positional.shift()
  }

  return { opts, positional }
}

// ── DB helpers ───────────────────────────────────────────────────

function openDb(dbPath) {
  if (!existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`)
    process.exit(1)
  }
  const buffer = readFileSync(dbPath)
  const db = new SQL.Database(buffer)
  return db
}

function dumpSchema(db) {
  const stmts = []
  const tablesResult = db.exec(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY name"
  )
  if (tablesResult.length > 0) {
    for (const row of tablesResult[0].values) {
      stmts.push(row[0])
    }
  }
  const indexResult = db.exec(
    "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name"
  )
  if (indexResult.length > 0) {
    for (const row of indexResult[0].values) {
      stmts.push(row[0])
    }
  }
  return stmts
}

// ── Schema export ────────────────────────────────────────────────

function formatAsTsType(statement) {
  const escaped = statement.replace(/`/g, '\\`')
  return '  `' + escaped + '`'
}

function exportSchema(dbPath, outputPath) {
  const db = openDb(dbPath)
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

function diffDatabases(oldPath, newPath, outputPath) {
  const oldDb = openDb(oldPath)
  const oldSchema = dumpSchema(oldDb)
  oldDb.close()

  const newDb = openDb(newPath)
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

// ── Main ─────────────────────────────────────────────────────────

const { opts, positional } = parseArgs(process.argv.slice(2))

const SQL = await initSqlJs()

if (opts.command === 'export') {
  if (positional.length < 1) {
    console.error('Usage: node scripts/schema.mjs export <db-path> [options]')
    process.exit(1)
  }
  exportSchema(resolve(positional[0]), opts.output)
} else if (opts.command === 'diff') {
  if (positional.length < 2) {
    console.error('Usage: node scripts/schema.mjs diff <old-db> <new-db> [options]')
    process.exit(1)
  }
  diffDatabases(resolve(positional[0]), resolve(positional[1]), opts.output)
} else {
  console.error('Unknown command: ' + (opts.command || '(none)'))
  console.error('Use --help for usage')
  process.exit(1)
}
