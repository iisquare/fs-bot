export interface ConfigRow {
  key: string
  value: string
  encrypted: number
  updated_at: string
}

export interface IntegrityStatus {
  valid: boolean
  message?: string
}

export interface DbSelectRequest {
  dbType: 'system' | 'user'
  table: string
  where?: Record<string, unknown>
  orderBy?: string
}

export interface DbInsertRequest {
  dbType: 'system' | 'user'
  table: string
  data: Record<string, unknown>
}

export interface DbUpdateRequest {
  dbType: 'system' | 'user'
  table: string
  where: Record<string, unknown>
  data: Record<string, unknown>
}

export interface DbUpsertRequest {
  dbType: 'system' | 'user'
  table: string
  data: Record<string, unknown>
}

export interface DbDeleteRequest {
  dbType: 'system' | 'user'
  table: string
  where: Record<string, unknown>
}

export interface DbInitSystemRequest {
  dbSecret: string
}

export interface DbInitUserRequest {
  serial: string
  userId: string
  dbSecret: string
}

export const DEFAULT_CONFIG: Record<string, { value: string; encrypted: boolean }> = {
  autoStart: { value: 'false', encrypted: false },
  autoUpgrade: { value: 'true', encrypted: false }
}
