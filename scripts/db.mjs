import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { createHash } from 'crypto'

function parseArgs(argv) {
  const opts = {
    mode: 'user',
    serial: '',
    userId: '',
    dbSecret: '',
    keyDir: process.cwd()
  }
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--import') {
      opts.mode = 'import'
    } else if (argv[i] === '--system') {
      opts.mode = 'system'
    } else if (argv[i] === '--serial' && i + 1 < argv.length) {
      opts.serial = argv[++i]
    } else if (argv[i] === '--user-id' && i + 1 < argv.length) {
      opts.userId = argv[++i]
    } else if (argv[i] === '--db-secret' && i + 1 < argv.length) {
      opts.dbSecret = argv[++i]
    } else if (argv[i] === '--key-dir' && i + 1 < argv.length) {
      opts.keyDir = resolve(argv[++i])
    } else if (!argv[i].startsWith('--')) {
      positional.push(argv[i])
    }
  }
  // Re-parse: positional[0] after flag detection could be 'import'
  const importIndex = argv.indexOf('--import')
  return { opts, positional, importMode: importIndex !== -1 }
}

function derivePassphrase(ident, dbSecret) {
  return createHash('sha256').update(ident + ':' + dbSecret + ':').digest('hex')
}

const { opts, positional, importMode } = parseArgs(process.argv.slice(2))

if (!opts.dbSecret && process.env['VITE_DB_SECRET']) {
  opts.dbSecret = process.env['VITE_DB_SECRET']
}
if (!opts.dbSecret) {
  console.error('--db-secret is required (or set VITE_DB_SECRET env var)')
  process.exit(1)
}

let dbPath, passphrase

if (opts.mode === 'system' || (importMode && opts.mode === 'system')) {
  passphrase = derivePassphrase('system', opts.dbSecret)
  dbPath = join(opts.keyDir, 'userdata', 'system.db')
} else {
  if (!opts.serial) {
    console.error('--serial is required for user database (or use --system for system.db)')
    process.exit(1)
  }
  if (!opts.userId) {
    console.error('--user-id is required for user database')
    process.exit(1)
  }
  passphrase = derivePassphrase(opts.serial, opts.dbSecret)
  dbPath = join(opts.keyDir, 'userdata', opts.userId, 'fs-bot.db')
}

let Database
try {
  Database = (await import('better-sqlite3-multiple-ciphers')).default
} catch {
  console.error(
    'better-sqlite3-multiple-ciphers is not available for plain Node.js.'
  )
  console.error(
    'Please use the export/import feature from within the running Electron app,'
  )
  console.error(
    'or install sqlcipher CLI tools (https://www.zetetic.net/sqlcipher/download/).'
  )
  process.exit(1)
}

if (importMode) {
  const srcPath = resolve(positional[0])
  if (!srcPath || !existsSync(srcPath)) {
    console.error('Source file not found:', srcPath || '(not specified)')
    console.error('Usage: pnpm db:import --serial <s> --user-id <id> <source.db>')
    console.error('   or: pnpm db:import-system --serial <s> --user-id <id> <source.db>')
    process.exit(1)
  }
  const plain = readFileSync(srcPath)
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.key(Buffer.from(passphrase, 'hex'))
  db.exec('PRAGMA journal_mode = DELETE')
  const memDb = new Database(':memory:')
  memDb.exec(Buffer.from(plain))
  const tables = memDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name)
  for (const table of tables) {
    const rows = memDb.prepare(`SELECT * FROM "${table}"`).all()
    if (!rows.length) continue
    const cols = Object.keys(rows[0])
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    )
    const insertAll = db.transaction((items) => {
      for (const item of items) {
        stmt.run(...cols.map((c) => item[c]))
      }
    })
    insertAll(rows)
  }
  memDb.close()
  db.close()
  console.log(`Imported to: ${dbPath}`)
  console.log(`  Source size: ${(plain.length / 1024).toFixed(1)} KB`)
} else {
  if (!existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`)
    console.error('Usage (user): pnpm db:export --serial <s> --user-id <id>')
    console.error('Usage (system): pnpm db:export-system')
    process.exit(1)
  }
  const destPath = resolve(positional[0] || join(process.cwd(), 'fs-bot-export.db'))
  copyFileSync(dbPath, destPath)
  const db = new Database(destPath)
  db.key(Buffer.from(passphrase, 'hex'))
  db.pragma("rekey = ''")
  db.close()

  const rawSize = (readFileSync(dbPath).length / 1024).toFixed(1)
  const expSize = (readFileSync(destPath).length / 1024).toFixed(1)
  console.log(`Database exported to: ${destPath}`)
  console.log(`  Source size: ${rawSize} KB`)
  console.log(`  Export size: ${expSize} KB`)
}
