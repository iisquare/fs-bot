import { createHmac, createHash, timingSafeEqual } from 'crypto'
import type Database from 'sql.js'

const HMAC_SALT = 'fs-bot-hmac-salt-v1'

export function deriveHmacKey(installPath: string): Buffer {
  const seed = createHash('sha256').update(installPath + HMAC_SALT).digest()
  return createHash('sha256').update(seed).digest()
}

export function computeTablesHash(key: Buffer, db: Database.Database): string {
  const tables = ['system_config', 'apps', 'conversations', 'messages', 'knowledge_bases', 'tools', 'skills']
  const parts: string[] = []
  for (const table of tables) {
    const stmt = db.prepare(`SELECT * FROM ${table} ORDER BY 1`)
    const rows: string[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject() as Record<string, unknown>
      rows.push(JSON.stringify(row))
    }
    stmt.free()
    parts.push(`${table}:${rows.join(';')}`)
  }
  const message = parts.join('|')
  return createHmac('sha256', key).update(message).digest('hex')
}

export function verifyHash(storedHash: string, computedHash: string): boolean {
  if (storedHash.length !== computedHash.length) return false
  return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'))
}
