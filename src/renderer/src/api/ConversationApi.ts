import { mockResponse, mockConversations, mockMessages } from '@renderer/utils/MockUtil'

let conversations = [...mockConversations]
let nextId = conversations.length + 1

export default {
  async list(_params = {}, _tips?: any) {
    return mockResponse(conversations)
  },
  async create(data: any = {}, _tips?: any) {
    const conv = {
      id: `c${nextId++}`,
      title: data.title || '新对话',
      appId: data.appId || '',
      appName: data.appName || '',
      updatedAt: new Date().toISOString()
    }
    conversations.unshift(conv)
    return mockResponse({ id: conv.id })
  },
  async delete(id: string, _tips?: any) {
    conversations = conversations.filter((c) => c.id !== id)
    return mockResponse(null)
  },
  async messages(conversationId: string, _params = {}, _tips?: any) {
    const msgs = mockMessages[conversationId] || []
    return mockResponse(msgs)
  },
  async send(conversationId: string, content: string, _appId: string, _tips?: any) {
    const userMsg = {
      id: `m${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }
    const replyMsg = {
      id: `m${Date.now() + 1}`,
      role: 'assistant',
      content: `收到你的消息：「${content}」\n\n这是一个模拟回复。实际部署后将连接后端 API 获取真实响应。`,
      createdAt: new Date(Date.now() + 500).toISOString()
    }
    if (!mockMessages[conversationId]) {
      mockMessages[conversationId] = []
    }
    mockMessages[conversationId].push(userMsg, replyMsg)
    return mockResponse([userMsg, replyMsg])
  }
}
