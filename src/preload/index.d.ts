import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    ipc: {
      setLoginSize: () => Promise<void>
      setNormalSize: () => Promise<void>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
      onMaximizeChange: (callback: (isMaximized: boolean) => void) => void
      togglePin: (pin: boolean) => Promise<void>
    }
  }
}
