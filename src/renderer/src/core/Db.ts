import ApiUtil from '@renderer/utils/ApiUtil'

export default {
  async initSystem(dbSecret: string) {
    return window.ipc.db.initSystem(dbSecret)
  },

  async initUser(serial: string, userId: string, dbSecret: string) {
    return window.ipc.db.initUser(serial, userId, dbSecret)
  },

  async select(table: string, where?: Record<string, unknown>, orderBy?: string) {
    return window.ipc.db.select(table, where, orderBy)
  },

  async insert(table: string, data: Record<string, unknown>) {
    return window.ipc.db.insert(table, data)
  },

  async update(table: string, where: Record<string, unknown>, data: Record<string, unknown>) {
    return window.ipc.db.update(table, where, data)
  },

  async remove(table: string, where: Record<string, unknown>) {
    return window.ipc.db.delete(table, where)
  },

  async getIntegrityStatus() {
    return window.ipc.db.getIntegrityStatus()
  },

  succeed: ApiUtil.succeed,
  code: ApiUtil.code,
  message: ApiUtil.message,
  data: ApiUtil.data
}
