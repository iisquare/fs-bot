import ApiUtil from '@renderer/utils/ApiUtil'

export default {
  async initSystem(dbSecret: string) {
    return window.ipc.db.initSystem(dbSecret)
  },

  async initUser(serial: string, userId: string, dbSecret: string) {
    return window.ipc.db.initUser(serial, userId, dbSecret)
  },

  async select(dbType: 'system' | 'user', table: string, where?: Record<string, unknown>, orderBy?: string) {
    return window.ipc.db.select(dbType, table, where, orderBy)
  },

  async insert(dbType: 'system' | 'user', table: string, data: Record<string, unknown>) {
    return window.ipc.db.insert(dbType, table, data)
  },

  async upsert(dbType: 'system' | 'user', table: string, data: Record<string, unknown>) {
    return window.ipc.db.upsert(dbType, table, data)
  },

  async update(dbType: 'system' | 'user', table: string, where: Record<string, unknown>, data: Record<string, unknown>) {
    return window.ipc.db.update(dbType, table, where, data)
  },

  async remove(dbType: 'system' | 'user', table: string, where: Record<string, unknown>) {
    return window.ipc.db.delete(dbType, table, where)
  },

  async getIntegrityStatus() {
    return window.ipc.db.getIntegrityStatus()
  },

  succeed: ApiUtil.succeed,
  code: ApiUtil.code,
  message: ApiUtil.message,
  data: ApiUtil.data
}
