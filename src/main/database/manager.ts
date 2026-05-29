import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import { getCreateTableStatements, isAllowedTable, hasAutoId, hasUpdatedAt } from './schema'
import { deriveHmacKey, computeTablesHash, verifyHash } from './integrity'
import { deriveEncryptionKey, encryptValue, decryptValue } from './encryption'
import type { IntegrityStatus } from './types'
import { DEFAULT_CONFIG } from './types'

export class DatabaseManager {
  private static instance: DatabaseManager

  private SQL: SqlJsStatic | null = null
  private db: SqlJsDatabase | null = null
  private hmacKey: Buffer | null = null
  private encryptionKey: Buffer | null = null
  private dbPath: string = ''

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  async initialize(installPath: string, dbFilename = 'fs-bot.db'): Promise<void> {
    this.dbPath = join(installPath, dbFilename)
    this.hmacKey = deriveHmacKey(installPath)
    this.encryptionKey = deriveEncryptionKey(installPath)

    mkdirSync(installPath, { recursive: true })

    this.SQL = await initSqlJs()

    if (existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath)
      this.db = new this.SQL.Database(buffer)
    } else {
      this.db = new this.SQL.Database()
    }

    const statements = getCreateTableStatements()
    for (const sql of statements) {
      this.db.run(sql)
    }
    this.save()

    const isFirstRun = this.isFirstRun()
    if (isFirstRun) {
      console.log('[DB] First run detected - seeding default config')
      this.seedDefaults()
    }

    const status = this.verifyIntegrity()
    if (status.valid) {
      console.log('[DB] Integrity check passed')
    } else {
      console.warn('[DB] Integrity check FAILED —', status.message)
    }
  }

  private save(): void {
    const data = this.db!.export()
    writeFileSync(this.dbPath, Buffer.from(data))
  }

  private isFirstRun(): boolean {
    const results = this.db!.exec('SELECT COUNT(*) as cnt FROM system_config')
    if (!results.length) return true
    return results[0].values[0][0] === 0
  }

  private seedDefaults(): void {
    for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
      this.db!.run(
        'INSERT OR REPLACE INTO system_config (key, value, encrypted) VALUES (?, ?, ?)',
        [key, def.value, def.encrypted ? 1 : 0]
      )
    }
    this.updateIntegrity()
  }

  // ── Generic CRUD ──

  select(
    table: string,
    where?: Record<string, unknown>,
    orderBy?: string
  ): { code: number; message: string; data: unknown[] } {
    if (!isAllowedTable(table)) {
      return { code: 500, message: `Table "${table}" is not allowed`, data: [] }
    }
    const { sql, params } = this.buildSelect(table, where, orderBy)
    const stmt = this.db!.prepare(sql)
    if (params.length) stmt.bind(params)
    const rows: Record<string, unknown>[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as Record<string, unknown>)
    }
    stmt.free()
    return { code: 0, message: 'Succeed!', data: rows }
  }

  insert(
    table: string,
    data: Record<string, unknown>
  ): { code: number; message: string; data: unknown } {
    if (!isAllowedTable(table)) {
      return { code: 500, message: `Table "${table}" is not allowed`, data: null }
    }
    const row = { ...data }
    if (hasAutoId(table) && !row['id']) {
      row['id'] = randomUUID()
    }
    const now = new Date().toISOString()
    if (hasUpdatedAt(table)) {
      row['updated_at'] = now
    }
    if (table === 'messages' || table === 'conversations') {
      if (!row['created_at']) row['created_at'] = now
    }

    // Handle encrypted fields for system_config
    if (table === 'system_config' && row['encrypted'] && this.encryptionKey) {
      row['value'] = encryptValue(row['value'] as string, this.encryptionKey)
    }

    const columns = Object.keys(row)
    const placeholders = columns.map(() => '?').join(', ')
    const values = columns.map((c) => row[c])

    this.db!.run(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )
    this.updateIntegrity()
    return { code: 0, message: 'Succeed!', data: { id: row['id'] ?? null } }
  }

  update(
    table: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): { code: number; message: string; data: null } {
    if (!isAllowedTable(table)) {
      return { code: 500, message: `Table "${table}" is not allowed`, data: null }
    }
    const row = { ...data }
    if (hasUpdatedAt(table)) {
      row['updated_at'] = new Date().toISOString()
    }

    if (table === 'system_config' && row['encrypted'] && this.encryptionKey) {
      row['value'] = encryptValue(row['value'] as string, this.encryptionKey)
    }

    const setClauses: string[] = []
    const setParams: unknown[] = []
    for (const [col, val] of Object.entries(row)) {
      setClauses.push(`${col} = ?`)
      setParams.push(val)
    }

    const whereClauses: string[] = []
    const whereParams: unknown[] = []
    for (const [col, val] of Object.entries(where)) {
      whereClauses.push(`${col} = ?`)
      whereParams.push(val)
    }

    this.db!.run(
      `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`,
      [...setParams, ...whereParams]
    )
    this.updateIntegrity()
    return { code: 0, message: 'Succeed!', data: null }
  }

  remove(
    table: string,
    where: Record<string, unknown>
  ): { code: number; message: string; data: null } {
    if (!isAllowedTable(table)) {
      return { code: 500, message: `Table "${table}" is not allowed`, data: null }
    }
    const whereClauses: string[] = []
    const whereParams: unknown[] = []
    for (const [col, val] of Object.entries(where)) {
      whereClauses.push(`${col} = ?`)
      whereParams.push(val)
    }
    this.db!.run(`DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`, whereParams)
    this.updateIntegrity()
    return { code: 0, message: 'Succeed!', data: null }
  }

  // ── System config helpers (with decryption) ──

  getConfig(key: string): string | null {
    const result = this.select('system_config', { key })
    if (!result.data.length) return null
    const row = result.data[0] as { value: string; encrypted: number }
    if (row.encrypted && this.encryptionKey) {
      return decryptValue(row.value, this.encryptionKey)
    }
    return row.value
  }

  setConfig(key: string, value: string, encrypt = false): void {
    if (this.getConfig(key) !== null) {
      const storedValue = encrypt ? encryptValue(value, this.encryptionKey!) : value
      this.update('system_config', { key }, { value: storedValue, encrypted: encrypt ? 1 : 0 })
    } else {
      this.insert('system_config', { key, value, encrypted: encrypt ? 1 : 0 })
    }
  }

  getAllConfig(): Record<string, string> {
    const result = this.select('system_config')
    const entries: Record<string, string> = {}
    for (const row of result.data) {
      const r = row as { key: string; value: string; encrypted: number }
      entries[r.key] = r.encrypted && this.encryptionKey ? decryptValue(r.value, this.encryptionKey) : r.value
    }
    return entries
  }

  // ── Integrity ──

  verifyIntegrity(): IntegrityStatus {
    if (!this.hmacKey || !this.db) {
      return { valid: false, message: 'Database not initialized' }
    }
    const computedHash = computeTablesHash(this.hmacKey, this.db)
    const integResults = this.db.exec('SELECT hash FROM _integrity WHERE id = 1')
    if (!integResults.length || !integResults[0].values.length) {
      return { valid: false, message: 'Integrity record missing — re-seeding required' }
    }
    const storedHash = integResults[0].values[0][0] as string
    return verifyHash(storedHash, computedHash)
      ? { valid: true }
      : { valid: false, message: 'Data hash mismatch — database may have been tampered' }
  }

  repairIntegrity(): void {
    console.warn('[DB] Repairing integrity — resetting to defaults')
    for (const table of ['messages', 'conversations', 'apps', 'knowledge_bases', 'tools', 'skills']) {
      this.db!.run(`DELETE FROM ${table}`)
    }
    this.db!.run('DELETE FROM system_config')
    this.db!.run('DELETE FROM _integrity')
    this.seedDefaults()
  }

  private updateIntegrity(): void {
    const hash = computeTablesHash(this.hmacKey!, this.db!)
    this.db!.run(
      `INSERT INTO _integrity (id, hash, updated_at)
       VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET hash = excluded.hash, updated_at = excluded.updated_at`,
      [hash]
    )
    this.save()
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  // ── Internal helpers ──

  private buildSelect(
    table: string,
    where?: Record<string, unknown>,
    orderBy?: string
  ): { sql: string; params: unknown[] } {
    let sql = `SELECT * FROM ${table}`
    const params: unknown[] = []
    if (where && Object.keys(where).length > 0) {
      const clauses = Object.keys(where).map((col) => `${col} = ?`)
      sql += ` WHERE ${clauses.join(' AND ')}`
      params.push(...Object.values(where))
    }
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`
    }
    return { sql, params }
  }
}
