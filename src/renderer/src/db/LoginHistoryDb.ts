import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const TABLE = 'login_history'

export default {
  async list() {
    const result = await Db.select(TABLE, undefined, 'updated_at DESC')
    if (!Db.succeed(result)) return result
    const serials = (result.data as Array<{ serial: string }>).map((r) => r.serial)
    return ApiUtil.result(0, 'Succeed!', serials)
  },

  async save(serial: string) {
    try {
      await Db.insert(TABLE, { serial })
    } catch {
      await Db.update(TABLE, { serial }, {})
    }
  },

  async remove(serial: string) {
    return Db.remove(TABLE, { serial })
  }
}
