import Db from '@renderer/core/Db'

const DB_TYPE = 'user'
const TABLE = 'tools'

export default {
  async list(params: { type?: string } = {}) {
    if (params.type) {
      return Db.select(DB_TYPE, TABLE, { type: params.type }, 'name ASC')
    }
    return Db.select(DB_TYPE, TABLE, undefined, 'type, name ASC')
  },

  async create(data: Record<string, unknown>) {
    const now = new Date().toISOString()
    return Db.insert(DB_TYPE, TABLE, {
      id: crypto.randomUUID(),
      ...data,
      created_at: now,
      updated_at: now
    })
  },

  async update(id: string, data: Record<string, unknown>) {
    const row: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
    return Db.update(DB_TYPE, TABLE, { id }, row)
  },

  async delete(id: string) {
    return Db.remove(DB_TYPE, TABLE, { id })
  }
}
