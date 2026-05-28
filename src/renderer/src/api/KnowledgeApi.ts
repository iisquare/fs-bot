import { mockResponse, mockKnowledgeBases, mockRecallResults } from '@renderer/utils/MockUtil'

let kbs = [...mockKnowledgeBases]
let nextId = kbs.length + 1

export default {
  async list(_params = {}, _tips?: any) {
    return mockResponse(kbs)
  },
  async create(data: any = {}, _tips?: any) {
    const kb = {
      id: `k${nextId++}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    kbs.push(kb)
    return mockResponse({ id: kb.id })
  },
  async update(id: string, data: any = {}, _tips?: any) {
    const idx = kbs.findIndex((k) => k.id === id)
    if (idx !== -1) {
      kbs[idx] = { ...kbs[idx], ...data, updatedAt: new Date().toISOString() }
    }
    return mockResponse(null)
  },
  async delete(id: string, _tips?: any) {
    kbs = kbs.filter((k) => k.id !== id)
    return mockResponse(null)
  },
  async recall(_params: { knowledgeBaseId: string; query: string; topK?: number }, _tips?: any) {
    return mockResponse(mockRecallResults)
  }
}
