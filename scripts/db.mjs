import { createHash } from 'crypto'
import { join } from 'path'
import dotenv from 'dotenv'

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
dotenv.config({ path: join(process.cwd(), '.env') })
dotenv.config({ path: join(process.cwd(), `.env.${mode}`) })

function derivePassphrase(ident, dbSecret) {
  return createHash('sha256').update(ident + ':' + dbSecret + ':').digest('hex')
}

function parseArgs(argv) {
  const opts = {
    mode: 'user',
    serial: '',
    userId: '',
    dbSecret: ''
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--system') {
      opts.mode = 'system'
    } else if (argv[i] === '--serial' && i + 1 < argv.length) {
      opts.serial = argv[++i]
    } else if (argv[i] === '--user-id' && i + 1 < argv.length) {
      opts.userId = argv[++i]
    } else if (argv[i] === '--db-secret' && i + 1 < argv.length) {
      opts.dbSecret = argv[++i]
    }
  }
  return opts
}

const opts = parseArgs(process.argv.slice(2))

if (!opts.dbSecret && process.env['VITE_DB_SECRET']) {
  opts.dbSecret = process.env['VITE_DB_SECRET']
}
if (!opts.dbSecret) {
  console.error('--db-secret is required (or set VITE_DB_SECRET env var)')
  process.exit(1)
}

let passphrase

if (opts.mode === 'system') {
  passphrase = derivePassphrase('system', opts.dbSecret)
} else {
  if (!opts.serial) {
    console.error('--serial is required for user key (or use --system)')
    process.exit(1)
  }
  if (!opts.userId) {
    console.error('--user-id is required for user key')
    process.exit(1)
  }
  passphrase = derivePassphrase(opts.serial, opts.dbSecret)
}

console.log(passphrase)
