import { mockResponse, mockSettings } from '@renderer/utils/MockUtil'

let settings = { ...mockSettings }

export default {
  async getSettings(_tips?: any) {
    return mockResponse(settings)
  },
  async updateAutoStart(enabled: boolean, _tips?: any) {
    settings.autoStart = enabled
    return mockResponse(null)
  },
  async updateAutoUpgrade(enabled: boolean, _tips?: any) {
    settings.autoUpgrade = enabled
    return mockResponse(null)
  }
}
