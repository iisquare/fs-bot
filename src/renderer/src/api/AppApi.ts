import { mockResponse, mockApps } from '@renderer/utils/MockUtil'

let apps = [...mockApps]
let nextId = apps.length + 1

export default {
  async list(_params = {}, _tips?: any) {
    return mockResponse(apps)
  },
  async create(data: any = {}, _tips?: any) {
    const app = {
      id: `${nextId++}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    apps.push(app)
    return mockResponse({ id: app.id })
  },
  async update(id: string, data: any = {}, _tips?: any) {
    const idx = apps.findIndex((a) => a.id === id)
    if (idx !== -1) {
      apps[idx] = { ...apps[idx], ...data, updatedAt: new Date().toISOString() }
    }
    return mockResponse(null)
  },
  async delete(id: string, _tips?: any) {
    apps = apps.filter((a) => a.id !== id)
    return mockResponse(null)
  }
}
