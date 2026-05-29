import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseManager } from './database/manager'
import type {
  DbSelectRequest,
  DbInsertRequest,
  DbUpdateRequest,
  DbDeleteRequest
} from './database/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-change', false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('window:set-login-size', () => {
  if (mainWindow) {
    mainWindow.setSize(450, 600)
    mainWindow.center()
    mainWindow.setResizable(false)
  }
})

ipcMain.handle('window:set-normal-size', () => {
  if (mainWindow) {
    mainWindow.setSize(900, 670)
    mainWindow.center()
    mainWindow.setResizable(true)
  }
})

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

let savedBounds: { x: number; y: number; width: number; height: number } | null = null

ipcMain.handle('window:toggle-pin', (_event, pin: boolean) => {
  if (!mainWindow) return

  if (pin) {
    const bounds = mainWindow.getBounds()
    savedBounds = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
    mainWindow.setAlwaysOnTop(true)
    mainWindow.setSize(400, 600)
    mainWindow.center()
  } else {
    mainWindow.setAlwaysOnTop(false)
    if (savedBounds) {
      mainWindow.setBounds(savedBounds)
      savedBounds = null
    }
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  const exePath = app.getPath('exe')
  const exeDir = dirname(exePath)
  const installDir = is.dev
    ? app.getAppPath() // 开发模式：项目根目录即安装目录
    : process.platform === 'darwin'
      ? dirname(dirname(exeDir)) // macOS 打包后：往上两级到 .app 包根
      : exeDir // Windows/Linux 打包后：exe 所在目录即安装目录

  if (is.dev) {
    const c = (code: number, s: string): string => `\x1b[${code}m${s}\x1b[0m`
    const pad = (label: string, value: string): string =>
      `  ${c(36, label.padEnd(14))}: ${c(32, value)}`

    console.log(c(90, '-- runtime info ------------------------------------------'))
    console.log(pad('runtimeDir', installDir))
    console.log(pad('__dirname', __dirname))
    console.log(pad('cwd', process.cwd()))
    console.log(c(90, '-----------------------------------------------------------'))
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Database initialization
  const db = DatabaseManager.getInstance()
  await db.initialize(installDir)

  // Database IPC handlers
  ipcMain.handle('db:select', (_event, request: DbSelectRequest) => {
    return db.select(request.table, request.where, request.orderBy)
  })

  ipcMain.handle('db:insert', (_event, request: DbInsertRequest) => {
    return db.insert(request.table, request.data)
  })

  ipcMain.handle('db:update', (_event, request: DbUpdateRequest) => {
    return db.update(request.table, request.where, request.data)
  })

  ipcMain.handle('db:delete', (_event, request: DbDeleteRequest) => {
    return db.remove(request.table, request.where)
  })

  ipcMain.handle('db:integrity-status', () => {
    return db.verifyIntegrity()
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
