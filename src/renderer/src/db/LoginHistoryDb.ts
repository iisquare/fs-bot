import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const DB_TYPE = 'system'
const TABLE = 'login_history'

export default {
  async list() {
    const result = await Db.select(DB_TYPE, TABLE, undefined, 'updated_at DESC')
    if (!Db.succeed(result)) return result
    const serials = (result.data as Array<{ serial: string }>).map((r) => r.serial)
    return ApiUtil.result(0, 'Succeed!', serials)
  },

  async save(serial: string) {
    const now = new Date().toISOString()
    return Db.upsert(DB_TYPE, TABLE, { serial, updated_at: now })
  },

  async remove(serial: string) {
    return Db.remove(DB_TYPE, TABLE, { serial })
  }
}
