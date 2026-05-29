import Database from 'better-sqlite3-multiple-ciphers'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { SYSTEM_TABLES, USER_TABLES, TABLE_PRIMARY_KEYS } from './schema'
import {
  runMigrations,
  SYSTEM_SCHEMA_VERSION,
  USER_SCHEMA_VERSION
} from './migrations'
import { deriveHmacKey, computeTablesHash, verifyHash } from './integrity'
import { deriveKey, encryptValue, decryptValue } from './encryption'
import type { IntegrityStatus } from './types'
import { DEFAULT_CONFIG } from './types'
import { is } from '@electron-toolkit/utils'

interface DbCtx {
  db: Database.Database
  hmacKey: Buffer
  encKey: Buffer
  dbPath: string
}

export class DatabaseManager {
  private static instance: DatabaseManager

  private sys: DbCtx | null = null
  private user: DbCtx | null = null

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  get isReady(): boolean {
    return this.sys !== null && this.user !== null
  }

  // ── Init system DB (shared, called at app startup) ──

  initSystem(dbSecret: string, installPath: string): void {
    const dataDir = join(installPath, 'userdata')
    const dbPath = join(dataDir, 'system.db')
    mkdirSync(dataDir, { recursive: true })

    this.sys = this.openDb(dbPath, dbSecret, 'system', 'system', SYSTEM_TABLES)
    console.log('[DB] System database ready')
  }

  // ── Init user DB (per-user, called after login) ──

  initUser(serial: string, userId: string, dbSecret: string, installPath: string): void {
    this.closeUser()

    const userDir = join(installPath, 'userdata', String(userId))
    const dbPath = join(userDir, 'fs-bot.db')

    this.user = this.openDb(dbPath, dbSecret, serial, 'user', USER_TABLES)
    console.log('[DB] User database ready for', serial)
  }

  private openDb(
    dbPath: string,
    dbSecret: string,
    ident: string,
    dbType: 'system' | 'user',
    statements: string[]
  ): DbCtx {
    const hmacKey = deriveHmacKey(ident, dbSecret)
    const encKey = deriveKey(ident, dbSecret)

    mkdirSync(dirname(dbPath), { recursive: true })
    const existed = existsSync(dbPath)

    const db = new Database(dbPath)
    db.pragma("cipher='sqlcipher'")
    db.pragma('legacy=4')
    db.pragma(`key='${encKey.toString('hex')}'`)
    db.pragma('journal_mode = WAL')

    if (is.dev) {
      console.log(`[DB] Database: ${dbPath}`)
      console.log(`[DB] Cipher: sqlcipher | Legacy: 4 | Passphrase (hex): ${encKey.toString('hex')}`)
    }

    for (const sql of statements) {
      db.exec(sql)
    }

    const targetVersion = dbType === 'system' ? SYSTEM_SCHEMA_VERSION : USER_SCHEMA_VERSION
    runMigrations(db, dbType, targetVersion)

    const ctx: DbCtx = { db, hmacKey, encKey, dbPath }

    if (statements.some((s) => s.includes('system_config'))) {
      const isFirstRun = !existed || this.isConfigEmpty(db)
      if (isFirstRun) {
        console.log('[DB] Seeding default config')
        this.seedConfig(ctx)
      }
    }

    const hash = computeTablesHash(hmacKey, db, statements)
    const integRow = db.prepare('SELECT hash FROM _integrity WHERE id = 1').get() as
      | { hash: string }
      | undefined
    if (integRow) {
      const ok = verifyHash(integRow.hash, hash)
      if (ok) {
        console.log('[DB] Integrity check passed')
      } else {
        console.warn('[DB] Integrity check FAILED — hash mismatch')
      }
    }
    this.updateHash(db, hmacKey, hash, statements)

    return ctx
  }

  private isConfigEmpty(db: Database.Database): boolean {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM system_config').get() as { cnt: number }
    return row.cnt === 0
  }

  private seedConfig(ctx: DbCtx): void {
    const insert = ctx.db.prepare(
      'INSERT OR REPLACE INTO system_config (key, value, encrypted) VALUES (?, ?, ?)'
    )
    for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
      insert.run(key, def.value, def.encrypted ? 1 : 0)
    }
  }

  // ── Resolve DB context ──

  private ctx(dbType: 'system' | 'user'): DbCtx {
    if (dbType === 'system') {
      if (!this.sys) throw new Error('System database not initialized')
      return this.sys
    }
    if (!this.user) throw new Error('User database not initialized')
    return this.user
  }

  // ── Generic CRUD ──

  select(
    dbType: 'system' | 'user',
    table: string,
    where?: Record<string, unknown>,
    orderBy?: string
  ): { code: number; message: string; data: unknown[] } {
    const { db } = this.ctx(dbType)
    const { sql, params } = this.buildSelect(table, where, orderBy)
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
    return { code: 0, message: 'Succeed!', data: rows }
  }

  insert(
    dbType: 'system' | 'user',
    table: string,
    data: Record<string, unknown>
  ): { code: number; message: string; data: unknown } {
    const { db } = this.ctx(dbType)
    const row = { ...data }
    const columns = Object.keys(row)
    const placeholders = columns.map(() => '?').join(', ')
    const values = columns.map((c) => row[c])

    db.prepare(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    ).run(...values)
    this.afterWrite(dbType)
    return { code: 0, message: 'Succeed!', data: { id: row['id'] ?? null } }
  }

  update(
    dbType: 'system' | 'user',
    table: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): { code: number; message: string; data: null } {
    const { db } = this.ctx(dbType)
    const { sql, params } = this.buildUpdate(table, where, data)
    db.prepare(sql).run(...params)
    this.afterWrite(dbType)
    return { code: 0, message: 'Succeed!', data: null }
  }

  upsert(
    dbType: 'system' | 'user',
    table: string,
    data: Record<string, unknown>
  ): { code: number; message: string; data: unknown } {
    const { db } = this.ctx(dbType)
    const row = { ...data }
    const pkCols = TABLE_PRIMARY_KEYS[table] ?? ['id']
    const columns = Object.keys(row)
    const placeholders = columns.map(() => '?').join(', ')
    const values = columns.map((c) => row[c])

    const conflictTarget = pkCols.join(', ')
    const updateCols = columns.filter((c) => !pkCols.includes(c))
    const setClause =
      updateCols.length > 0
        ? ` DO UPDATE SET ${updateCols.map((c) => `${c} = excluded.${c}`).join(', ')}`
        : ''

    db.prepare(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(${conflictTarget})${setClause}`
    ).run(...values)
    this.afterWrite(dbType)
    return { code: 0, message: 'Succeed!', data: { id: row['id'] ?? null } }
  }

  remove(
    dbType: 'system' | 'user',
    table: string,
    where: Record<string, unknown>
  ): { code: number; message: string; data: null } {
    const { db } = this.ctx(dbType)
    const { sql, params } = this.buildDelete(table, where)
    db.prepare(sql).run(...params)
    this.afterWrite(dbType)
    return { code: 0, message: 'Succeed!', data: null }
  }

  // ── System config helpers ──

  getConfig(key: string): string | null {
    if (!this.sys) return null
    const stmt = this.sys.db.prepare('SELECT value, encrypted FROM system_config WHERE key = ?')
    const row = stmt.get(key) as { value: string; encrypted: number } | undefined
    if (!row) return null
    return row.encrypted ? decryptValue(row.value, this.sys.encKey) : row.value
  }

  setConfig(key: string, value: string, encrypt = false): void {
    if (!this.sys) return
    const storedValue = encrypt ? encryptValue(value, this.sys.encKey) : value
    const now = new Date().toISOString()
    this.upsert('system', 'system_config', {
      key,
      value: storedValue,
      encrypted: encrypt ? 1 : 0,
      updated_at: now
    })
  }

  getAllConfig(): Record<string, string> {
    if (!this.sys) return {}
    const rows = this.sys.db.prepare(
      'SELECT key, value, encrypted FROM system_config'
    ).all() as Array<{ key: string; value: string; encrypted: number }>
    const entries: Record<string, string> = {}
    for (const r of rows) {
      entries[r.key] = r.encrypted ? decryptValue(r.value, this.sys.encKey) : r.value
    }
    return entries
  }

  // ── Integrity ──

  verifyIntegrity(): IntegrityStatus {
    if (this.sys) {
      const ok = this.checkIntegrity(this.sys, SYSTEM_TABLES)
      if (!ok.valid) return ok
    }
    if (this.user) {
      const ok = this.checkIntegrity(this.user, USER_TABLES)
      if (!ok.valid) return ok
    }
    return { valid: true }
  }

  private checkIntegrity(ctx: DbCtx, statements: string[]): IntegrityStatus {
    const hash = computeTablesHash(ctx.hmacKey, ctx.db, statements)
    const integRow = ctx.db.prepare('SELECT hash FROM _integrity WHERE id = 1').get() as
      | { hash: string }
      | undefined
    if (!integRow) {
      return { valid: false, message: 'Integrity record missing' }
    }
    return verifyHash(integRow.hash, hash)
      ? { valid: true }
      : { valid: false, message: 'Data hash mismatch' }
  }

  private afterWrite(dbType: 'system' | 'user'): void {
    const ctx = this.ctx(dbType)
    const statements = dbType === 'system' ? SYSTEM_TABLES : USER_TABLES
    const hash = computeTablesHash(ctx.hmacKey, ctx.db, statements)
    this.updateHash(ctx.db, ctx.hmacKey, hash, statements)
  }

  private updateHash(
    db: Database.Database,
    _hmacKey: Buffer,
    hash: string,
    _statements: string[]
  ): void {
    db.prepare(
      `INSERT INTO _integrity (id, hash, updated_at)
       VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET hash = excluded.hash, updated_at = excluded.updated_at`
    ).run(hash)
  }

  // ── Close ──

  closeUser(): void {
    if (this.user) {
      this.user.db.close()
      this.user = null
    }
  }

  close(): void {
    this.closeUser()
    if (this.sys) {
      this.sys.db.close()
      this.sys = null
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

  private buildUpdate(
    table: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): { sql: string; params: unknown[] } {
    const setClauses: string[] = []
    const setParams: unknown[] = []
    for (const [col, val] of Object.entries(data)) {
      setClauses.push(`${col} = ?`)
      setParams.push(val)
    }
    const whereClauses: string[] = []
    const whereParams: unknown[] = []
    for (const [col, val] of Object.entries(where)) {
      whereClauses.push(`${col} = ?`)
      whereParams.push(val)
    }
    return {
      sql: `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`,
      params: [...setParams, ...whereParams]
    }
  }

  private buildDelete(
    table: string,
    where: Record<string, unknown>
  ): { sql: string; params: unknown[] } {
    const whereClauses: string[] = []
    const whereParams: unknown[] = []
    for (const [col, val] of Object.entries(where)) {
      whereClauses.push(`${col} = ?`)
      whereParams.push(val)
    }
    return {
      sql: `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')}`,
      params: whereParams
    }
  }
}
