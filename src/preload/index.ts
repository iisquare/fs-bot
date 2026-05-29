import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const ipc = {
  setLoginSize: () => ipcRenderer.invoke('window:set-login-size'),
  setNormalSize: () => ipcRenderer.invoke('window:set-normal-size'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximize-change', (_, isMaximized) => callback(isMaximized))
  },
  togglePin: (pin: boolean) => ipcRenderer.invoke('window:toggle-pin', pin),
  db: {
    initSystem: (dbSecret: string) =>
      ipcRenderer.invoke('db:init-system', { dbSecret }),
    initUser: (serial: string, userId: string, dbSecret: string) =>
      ipcRenderer.invoke('db:init-user', { serial, userId, dbSecret }),
    select: (dbType: 'system' | 'user', table: string, where?: Record<string, unknown>, orderBy?: string) =>
      ipcRenderer.invoke('db:select', { dbType, table, where, orderBy }),
    insert: (dbType: 'system' | 'user', table: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:insert', { dbType, table, data }),
    update: (dbType: 'system' | 'user', table: string, where: Record<string, unknown>, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:update', { dbType, table, where, data }),
    upsert: (dbType: 'system' | 'user', table: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:upsert', { dbType, table, data }),
    delete: (dbType: 'system' | 'user', table: string, where: Record<string, unknown>) =>
      ipcRenderer.invoke('db:delete', { dbType, table, where }),
    getIntegrityStatus: () => ipcRenderer.invoke('db:integrity-status')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ipc', ipc)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.ipc = ipc
}
