import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { startServer } from 'edulens-backend'

let mainWindow: BrowserWindow | null = null
let serverPort = 3001

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0d0f17',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../../resources/icon.png')
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  // Start the embedded backend server
  try {
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'edulens.db')
    const result = startServer({ port: 3001, dbPath })
    serverPort = result.port
    console.log(`[Electron] Backend started on port ${serverPort}`)
  } catch (err) {
    console.error('[Electron] Failed to start backend:', err)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: expose server port to renderer
ipcMain.handle('get-server-port', () => serverPort)
ipcMain.handle('open-external', (_event, url: string) => shell.openExternal(url))
