import { mockResponse } from '@renderer/utils/MockUtil'

// Simple SVG captcha as base64 data URI
const mockSvg =
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
  <rect width="120" height="40" fill="#f0f2f5" rx="4"/>
  <text x="15" y="28" font-family="Arial" font-size="22" fill="#409eff" font-weight="bold">AB3D</text>
  <line x1="5" y1="12" x2="95" y2="10" stroke="#c0c4cc" stroke-width="0.5"/>
  <line x1="10" y1="30" x2="110" y2="25" stroke="#dcdfe6" stroke-width="0.5"/>
  <circle cx="100" cy="15" r="2" fill="#e6a23c"/>
  <circle cx="80" cy="35" r="1.5" fill="#67c23a"/>
</svg>`
  )

export default {
  async generate(_param?: any, _tips?: any) {
    return mockResponse({
      uuid: 'mock-captcha-uuid-' + Date.now(),
      base64: mockSvg,
      retry: 0
    })
  }
}
