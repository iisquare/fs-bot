import { createHmac, createHash, timingSafeEqual } from 'crypto'
import type Database from 'better-sqlite3-multiple-ciphers'

export function deriveHmacKey(ident: string, dbSecret: string): Buffer {
  return createHash('sha256')
    .update(ident + ':' + dbSecret + ':hmac')
    .digest()
}

export function computeTablesHash(key: Buffer, db: Database.Database, statements: string[]): string {
  // Extract table names from CREATE TABLE statements
  const tablePattern = /CREATE TABLE IF NOT EXISTS (\w+)/
  const tables = statements
    .map((s) => s.match(tablePattern)?.[1])
    .filter((t): t is string => !!t && t !== '_integrity' && t !== 'schema_version')

  const parts: string[] = []
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM "${table}" ORDER BY 1`).all() as Record<string, unknown>[]
    const serialized = rows.map((r) => JSON.stringify(r)).join(';')
    parts.push(`${table}:${serialized}`)
  }
  const message = parts.join('|')
  return createHmac('sha256', key).update(message).digest('hex')
}

export function verifyHash(storedHash: string, computedHash: string): boolean {
  if (storedHash.length !== computedHash.length) return false
  return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'))
}
