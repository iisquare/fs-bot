import { mockResponse, mockTools } from '@renderer/utils/MockUtil'

const tools = {
  mcp: [...mockTools.mcp],
  custom: [...mockTools.custom],
  builtin: [...mockTools.builtin]
}
let nextId = 10

export default {
  async list(params: any = {}, _tips?: any) {
    const type = params.type
    if (type && tools[type as keyof typeof tools]) {
      return mockResponse(tools[type as keyof typeof tools])
    }
    return mockResponse([...tools.mcp, ...tools.custom, ...tools.builtin])
  },
  async create(data: any = {}, _tips?: any) {
    const type = data.type || 'custom'
    const tool = { id: `t${nextId++}`, ...data }
    if (tools[type as keyof typeof tools]) {
      tools[type as keyof typeof tools].push(tool)
    }
    return mockResponse({ id: tool.id })
  },
  async update(id: string, data: any = {}, _tips?: any) {
    for (const key of Object.keys(tools)) {
      const idx = tools[key as keyof typeof tools].findIndex((t: any) => t.id === id)
      if (idx !== -1) {
        tools[key as keyof typeof tools][idx] = {
          ...tools[key as keyof typeof tools][idx],
          ...data
        }
        break
      }
    }
    return mockResponse(null)
  },
  async delete(id: string, _tips?: any) {
    for (const key of Object.keys(tools)) {
      const arr = tools[key as keyof typeof tools]
      const idx = arr.findIndex((t: any) => t.id === id)
      if (idx !== -1) {
        arr.splice(idx, 1)
        break
      }
    }
    return mockResponse(null)
  }
}
