import { mockResponse, mockSkills } from '@renderer/utils/MockUtil'

const installed = [...mockSkills.installed]
const marketplace = [...mockSkills.marketplace]

export default {
  async list(_params = {}, _tips?: any) {
    return mockResponse(installed)
  },
  async search(query: string, _tips?: any) {
    const result = marketplace.filter(
      (s) =>
        s.name.includes(query) || s.description.includes(query)
    )
    return mockResponse(result)
  },
  async install(skillId: string, version: string, _tips?: any) {
    const skill = marketplace.find((s) => s.id === skillId)
    if (skill) {
      installed.push({ ...skill, installedVersion: version })
    }
    return mockResponse(null)
  },
  async publish(data: any = {}, _tips?: any) {
    const skill = {
      id: `s${Date.now()}`,
      ...data,
      latestVersion: data.version || '1.0.0'
    }
    installed.push(skill)
    return mockResponse({ id: skill.id })
  },
  async versions(_skillId: string, _tips?: any) {
    return mockResponse(['1.0.0', '1.1.0', '1.2.0', '2.0.0'])
  }
}
