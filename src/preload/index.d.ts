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
      db: {
        select: (
          table: string,
          where?: Record<string, unknown>,
          orderBy?: string
        ) => Promise<{ code: number; message: string; data: unknown[] }>
        insert: (
          table: string,
          data: Record<string, unknown>
        ) => Promise<{ code: number; message: string; data: unknown }>
        update: (
          table: string,
          where: Record<string, unknown>,
          data: Record<string, unknown>
        ) => Promise<{ code: number; message: string; data: null }>
        delete: (
          table: string,
          where: Record<string, unknown>
        ) => Promise<{ code: number; message: string; data: null }>
        getIntegrityStatus: () => Promise<{ valid: boolean; message?: string }>
      }
    }
  }
}
