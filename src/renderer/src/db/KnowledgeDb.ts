import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const TABLE = 'knowledge_bases'

export default {
  async list(_params = {}) {
    return Db.select(TABLE, undefined, 'updated_at DESC')
  },

  async create(data: Record<string, unknown>) {
    return Db.insert(TABLE, data)
  },

  async update(id: string, data: Record<string, unknown>) {
    return Db.update(TABLE, { id }, data)
  },

  async delete(id: string) {
    return Db.remove(TABLE, { id })
  },

  async recall(_params: { knowledgeBaseId: string; query: string; topK?: number }) {
    return ApiUtil.result(0, 'Succeed!', [])
  }
}
