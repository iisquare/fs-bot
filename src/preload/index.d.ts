import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    ipc: {
      setLoginSize: () => Promise<void>
      setNormalSize: () => Promise<void>
    }
  }
}
