import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const DB_TYPE = 'user'
const TABLE = 'knowledge_bases'

export default {
  async list(_params = {}) {
    return Db.select(DB_TYPE, TABLE, undefined, 'updated_at DESC')
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
  },

  async recall(_params: { knowledgeBaseId: string; query: string; topK?: number }) {
    return ApiUtil.result(0, 'Succeed!', [])
  }
}
