import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const DB_TYPE = 'user'
const TABLE = 'conversations'
const MSG_TABLE = 'messages'

export default {
  async list(_params = {}) {
    return Db.select(DB_TYPE, TABLE, undefined, 'updated_at DESC')
  },

  async create(data: Record<string, unknown>) {
    const now = new Date().toISOString()
    return Db.insert(DB_TYPE, TABLE, {
      id: crypto.randomUUID(),
      title: data.title || '新对话',
      app_id: data.appId || '',
      app_name: data.appName || '',
      created_at: now,
      updated_at: now
    })
  },

  async delete(id: string) {
    await Db.remove(DB_TYPE, MSG_TABLE, { conversation_id: id })
    return Db.remove(DB_TYPE, TABLE, { id })
  },

  async messages(conversationId: string, _params = {}) {
    return Db.select(DB_TYPE, MSG_TABLE, { conversation_id: conversationId }, 'created_at ASC')
  },

  async send(conversationId: string, content: string, _appId: string) {
    const now = new Date().toISOString()
    const userResult = await Db.insert(DB_TYPE, MSG_TABLE, {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: now
    })
    const replyResult = await Db.insert(DB_TYPE, MSG_TABLE, {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'assistant',
      content: `收到你的消息：「${content}」\n\n这是一个模拟回复。实际部署后将连接后端 API 获取真实响应。`,
      created_at: new Date(Date.now() + 500).toISOString()
    })
    await Db.update(DB_TYPE, TABLE, { id: conversationId }, { updated_at: new Date().toISOString() })
    const messages: unknown[] = []
    if (ApiUtil.data(userResult)) messages.push(ApiUtil.data(userResult))
    if (ApiUtil.data(replyResult)) messages.push(ApiUtil.data(replyResult))
    return ApiUtil.result(0, 'Succeed!', messages)
  }
}
