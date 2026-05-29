import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const TABLE = 'skills'

export default {
  async list(_params = {}) {
    return Db.select(TABLE)
  },

  async search(query: string) {
    const result = await Db.select(TABLE)
    if (!ApiUtil.succeed(result)) return result
    const filtered = (result.data as Array<{ name: string; description: string }>).filter(
      (s) => s.name.includes(query) || s.description.includes(query)
    )
    return ApiUtil.result(0, 'Succeed!', filtered)
  },

  async install(skillId: string, version: string) {
    return Db.update(TABLE, { id: skillId }, { installed_version: version, type: 'installed' })
  },

  async publish(data: Record<string, unknown>) {
    return Db.insert(TABLE, {
      ...data,
      type: 'installed',
      installed_version: data.version || '1.0.0',
      latest_version: data.version || '1.0.0'
    })
  },

  async versions(_skillId: string) {
    return ApiUtil.result(0, 'Succeed!', ['1.0.0', '1.1.0', '1.2.0', '2.0.0'])
  }
}
