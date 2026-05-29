import Db from '@renderer/core/Db'

const TABLE = 'tools'

export default {
  async list(params: { type?: string } = {}) {
    if (params.type) {
      return Db.select(TABLE, { type: params.type }, 'name ASC')
    }
    return Db.select(TABLE, undefined, 'type, name ASC')
  },

  async create(data: Record<string, unknown>) {
    return Db.insert(TABLE, data)
  },

  async update(id: string, data: Record<string, unknown>) {
    return Db.update(TABLE, { id }, data)
  },

  async delete(id: string) {
    return Db.remove(TABLE, { id })
  }
}
