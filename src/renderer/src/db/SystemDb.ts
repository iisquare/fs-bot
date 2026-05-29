import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const DB_TYPE = 'system'
const TABLE = 'system_config'

export default {
  async getSettings() {
    const result = await Db.select(DB_TYPE, TABLE)
    if (!Db.succeed(result)) return result
    const data: Record<string, unknown> = {}
    for (const row of result.data) {
      const r = row as { key: string; value: string }
      data[r.key] = r.value
    }
    return ApiUtil.result(0, 'Succeed!', data)
  },

  async updateAutoStart(enabled: boolean) {
    const now = new Date().toISOString()
    return Db.update(DB_TYPE, TABLE, { key: 'autoStart' }, { value: String(enabled), updated_at: now })
  },

  async updateAutoUpgrade(enabled: boolean) {
    const now = new Date().toISOString()
    return Db.update(DB_TYPE, TABLE, { key: 'autoUpgrade' }, { value: String(enabled), updated_at: now })
  }
}
