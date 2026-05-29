import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const DB_TYPE = 'user'
const TABLE = 'skills'

export default {
  async list(_params = {}) {
    return Db.select(DB_TYPE, TABLE)
  },

  async search(query: string) {
    const result = await Db.select(DB_TYPE, TABLE)
    if (!ApiUtil.succeed(result)) return result
    const filtered = (result.data as Array<{ name: string; description: string }>).filter(
      (s) => s.name.includes(query) || s.description.includes(query)
    )
    return ApiUtil.result(0, 'Succeed!', filtered)
  },

  async install(skillId: string, version: string) {
    const now = new Date().toISOString()
    return Db.update(DB_TYPE, TABLE, { id: skillId }, { installed_version: version, type: 'installed', updated_at: now })
  },

  async publish(data: Record<string, unknown>) {
    const now = new Date().toISOString()
    return Db.insert(DB_TYPE, TABLE, {
      id: crypto.randomUUID(),
      ...data,
      type: 'installed',
      installed_version: data.version || '1.0.0',
      latest_version: data.version || '1.0.0',
      created_at: now,
      updated_at: now
    })
  },

  async versions(_skillId: string) {
    return ApiUtil.result(0, 'Succeed!', ['1.0.0', '1.1.0', '1.2.0', '2.0.0'])
  }
}
