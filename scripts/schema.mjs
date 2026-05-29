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
  key                    Print derived encryption keys (passphrase + HMAC)
  export <db-path>       Dump schema from a database and output as TypeScript

Options:
  --plain                Database is not encrypted
  --system               Shorthand for --ident system
  --passphrase <hex>     Hex-encoded encryption passphrase (for SQLCipher)
  --db-secret <secret>   Derive passphrase from secret + identity
  --ident <ident>        Identity for key derivation (use with --db-secret)
  -o, --output <path>    Write output to file instead of stdout
  -h, --help             Show this help

Description:
  The 'key' command derives the SQLCipher passphrase and HMAC key from a
  database secret and identity string. These keys are used to encrypt/decrypt
  SQLite databases with SQLCipher.

  The 'export' command reads a database, extracts the schema (CREATE TABLE
  and CREATE INDEX statements from sqlite_master), and outputs them as a
  TypeScript module — a constant array of SQL strings plus a getter function.

  If --db-secret is omitted, the script falls back to the VITE_DB_SECRET
  environment variable (loaded from .env / .env.development / .env.production).

Examples:
  # Print keys for the system database
  node scripts/schema.mjs key --system --db-secret mysecret

  # Print keys for a specific device
  node scripts/schema.mjs key --ident DEV001 --db-secret mysecret

  # Export an encrypted database
  node scripts/schema.mjs export userdata/system.db --system

  # Export an unencrypted database
  node scripts/schema.mjs export data.db --plain

  # Export to a file
  node scripts/schema.mjs export data.db -o src/main/database/schema.ts
`)
  process.exit(0)
}

function parseArgs(argv) {
  const opts = {
    command: '',
    plain: false,
    system: false,
    passphrase: '',
    dbSecret: '',
    ident: '',
    output: ''
  }
  const positional = []

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') printHelp()
    else if (argv[i] === '--plain') opts.plain = true
    else if (argv[i] === '--system') opts.system = true
    else if (argv[i] === '--passphrase' && i + 1 < argv.length) opts.passphrase = argv[++i]
    else if (argv[i] === '--db-secret' && i + 1 < argv.length) opts.dbSecret = argv[++i]
    else if (argv[i] === '--ident' && i + 1 < argv.length) opts.ident = argv[++i]
    else if ((argv[i] === '-o' || argv[i] === '--output') && i + 1 < argv.length) opts.output = argv[++i]
    else if (!argv[i].startsWith('--') && !argv[i].startsWith('-')) positional.push(argv[i])
  }

  if (positional[0] === 'export' || positional[0] === 'key') {
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

// ── Key command ───────────────────────────────────────────────────

function cmdKey(ident, dbSecret) {
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
  console.error('Error: Unknown command. Use --help for usage.')
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
  cmdKey(opts.ident, opts.dbSecret)
  process.exit(0)
}

// Export command
if (opts.command === 'export') {
  if (positional.length < 1) {
    console.error('Usage: node scripts/schema.mjs export <db-path> [options]')
    process.exit(1)
  }

  const passphrase = getPassphrase(opts)
  if (!passphrase && !opts.plain) {
    console.error(
      'Warning: No passphrase or --plain specified. If the database is encrypted, this will fail.'
    )
    console.error(
      'Use --passphrase <hex>, --db-secret + --ident, or --plain for unencrypted databases.'
    )
  }

  exportSchema(resolve(positional[0]), passphrase, opts.output)
}
