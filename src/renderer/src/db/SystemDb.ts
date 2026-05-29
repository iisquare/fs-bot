import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

export default {
  async getSettings() {
    const result = await Db.select('system_config')
    if (!Db.succeed(result)) return result
    const data: Record<string, unknown> = {}
    for (const row of result.data) {
      const r = row as { key: string; value: string }
      data[r.key] = r.value
    }
    return ApiUtil.result(0, 'Succeed!', data)
  },

  async updateAutoStart(enabled: boolean) {
    return Db.update('system_config', { key: 'autoStart' }, { value: String(enabled) })
  },

  async updateAutoUpgrade(enabled: boolean) {
    return Db.update('system_config', { key: 'autoUpgrade' }, { value: String(enabled) })
  }
}
