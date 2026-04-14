const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell } = require('electron')
const path = require('path')
const os = require('os')

let mainWindow
let tray
let ptyProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 500,
    minHeight: 350,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Claude Chat',
    resizable: true,
    alwaysOnTop: false,
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  mainWindow.on('closed', () => {
    if (ptyProcess) ptyProcess.kill()
    mainWindow = null
  })
}

function createTray() {
  const img = nativeImage.createEmpty()
  tray = new Tray(img)
  tray.setToolTip('Claude Chat')
  const menu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: false, click: (item) => mainWindow?.setAlwaysOnTop(item.checked) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => mainWindow?.show())
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  startPty()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function startPty() {
  try {
    const pty = require('node-pty')
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
    const shellArgs = process.platform === 'win32' ? ['-NoLogo'] : []

    ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd: os.homedir(),
      env: { ...process.env, TERM: 'xterm-256color' },
    })

    ptyProcess.onData((data) => {
      mainWindow?.webContents.send('terminal:data', data)
    })

    ptyProcess.onExit(() => {
      mainWindow?.webContents.send('terminal:exit')
    })
  } catch (e) {
    console.error('node-pty failed:', e.message)
  }
}

ipcMain.on('terminal:input', (_e, data) => {
  ptyProcess?.write(data)
})

ipcMain.on('terminal:resize', (_e, { cols, rows }) => {
  ptyProcess?.resize(cols, rows)
})

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.on('window:alwaysOnTop', (_e, val) => mainWindow?.setAlwaysOnTop(val))
ipcMain.on('window:opacity', (_e, val) => mainWindow?.setOpacity(val))

ipcMain.handle('window:isAlwaysOnTop', () => mainWindow?.isAlwaysOnTop() ?? false)
