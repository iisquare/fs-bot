import { mockResponse, mockUserInfo } from '@renderer/utils/MockUtil'

let userInfo = { ...mockUserInfo }

export default {
  async login(body: any, _tips?: any) {
    // Accept any serial/password for mock login
    userInfo = {
      ...mockUserInfo,
      serial: body.serial || mockUserInfo.serial,
      token: mockUserInfo.token
    }
    return mockResponse(userInfo)
  },
  async logout(_body?: any, _tips?: any) {
    userInfo = { ...mockUserInfo }
    return mockResponse(null)
  },
  async info(_body?: any, _tips?: any) {
    return mockResponse(userInfo)
  }
}
