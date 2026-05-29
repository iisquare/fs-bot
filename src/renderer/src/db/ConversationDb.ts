import Db from '@renderer/core/Db'
import ApiUtil from '@renderer/utils/ApiUtil'

const TABLE = 'conversations'
const MSG_TABLE = 'messages'

export default {
  async list(_params = {}) {
    return Db.select(TABLE, undefined, 'updated_at DESC')
  },

  async create(data: Record<string, unknown>) {
    return Db.insert(TABLE, {
      title: data.title || '新对话',
      app_id: data.appId || '',
      app_name: data.appName || ''
    })
  },

  async delete(id: string) {
    await Db.remove(MSG_TABLE, { conversation_id: id })
    return Db.remove(TABLE, { id })
  },

  async messages(conversationId: string, _params = {}) {
    return Db.select(MSG_TABLE, { conversation_id: conversationId }, 'created_at ASC')
  },

  async send(conversationId: string, content: string, _appId: string) {
    const now = new Date().toISOString()
    const userResult = await Db.insert(MSG_TABLE, {
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: now
    })
    const replyResult = await Db.insert(MSG_TABLE, {
      conversation_id: conversationId,
      role: 'assistant',
      content: `收到你的消息：「${content}」\n\n这是一个模拟回复。实际部署后将连接后端 API 获取真实响应。`,
      created_at: new Date(Date.now() + 500).toISOString()
    })
    await Db.update(TABLE, { id: conversationId }, {})
    const messages: unknown[] = []
    if (ApiUtil.data(userResult)) messages.push(ApiUtil.data(userResult))
    if (ApiUtil.data(replyResult)) messages.push(ApiUtil.data(replyResult))
    return ApiUtil.result(0, 'Succeed!', messages)
  }
}
