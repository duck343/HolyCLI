const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, dialog } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')

let mainWindow
let tray
const ptyProcesses = new Map() // tabId -> ptyProcess


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900, height: 650, minWidth: 500, minHeight: 350,
    frame: false, transparent: true, backgroundColor: '#00000000',
    hasShadow: true, vibrancy: 'under-window', visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Holy CLI', resizable: true, alwaysOnTop: false,
  })
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  mainWindow.on('closed', () => {
    for (const [, proc] of ptyProcesses) proc.kill()
    ptyProcesses.clear()
    mainWindow = null
  })
}

function createTray() {
  const img = nativeImage.createEmpty()
  tray = new Tray(img)
  tray.setToolTip('Holy CLI')
  const menu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: false, click: i => mainWindow?.setAlwaysOnTop(i.checked) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => mainWindow?.show())
}

app.whenReady().then(() => { createWindow(); createTray() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

function createPty(tabId, shellType = 'powershell') {
  try {
    const pty = require('node-pty')
    let shell, shellArgs
    if (process.platform === 'win32') {
      if (shellType === 'cmd') { shell = 'cmd.exe'; shellArgs = [] }
      else if (shellType === 'gitbash') { shell = 'C:\\Program Files\\Git\\bin\\bash.exe'; shellArgs = ['--login', '-i'] }
      else if (shellType === 'wsl') { shell = 'wsl.exe'; shellArgs = [] }
      else { shell = 'powershell.exe'; shellArgs = ['-NoLogo'] }
    } else { shell = 'bash'; shellArgs = [] }
    const proc = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color', cols: 100, rows: 30,
      cwd: os.homedir(), env: { ...process.env, TERM: 'xterm-256color' },
    })
    proc.onData(data => mainWindow?.webContents.send('terminal:data', tabId, data))
    proc.onExit(() => mainWindow?.webContents.send('terminal:exit', tabId))
    ptyProcesses.set(tabId, proc)
  } catch (e) { console.error('node-pty failed:', e.message) }
}

ipcMain.on('terminal:create', (_e, tabId, shellType) => createPty(tabId, shellType))
ipcMain.on('terminal:input', (_e, tabId, data) => ptyProcesses.get(tabId)?.write(data))
ipcMain.on('terminal:resize', (_e, tabId, { cols, rows }) => ptyProcesses.get(tabId)?.resize(cols, rows))
ipcMain.on('terminal:close', (_e, tabId) => { ptyProcesses.get(tabId)?.kill(); ptyProcesses.delete(tabId) })


ipcMain.handle('context:save', (_e, { folder, content }) => {
  const file = path.join(folder, 'AI_CONTEXT.md')
  let existing = ''
  if (fs.existsSync(file)) existing = fs.readFileSync(file, 'utf8')
  const updated = existing
    ? existing.trimEnd() + '\n\n---\n\n' + content
    : content
  fs.writeFileSync(file, updated, 'utf8')

  // Write CLAUDE.md so Claude Code auto-reads context on startup
  const claudeMd = path.join(folder, 'CLAUDE.md')
  if (!fs.existsSync(claudeMd)) {
    fs.writeFileSync(claudeMd, '# Session Context\n\nAlways read `AI_CONTEXT.md` in this directory at the start of every session. It contains logs from previous sessions.\n', 'utf8')
  }

  return file
})

ipcMain.handle('context:read', (_e, folder) => {
  const file = path.join(folder, 'AI_CONTEXT.md')
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
})

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.on('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show()
})

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize() })
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.on('window:alwaysOnTop', (_e, val) => mainWindow?.setAlwaysOnTop(val))
ipcMain.on('window:opacity', (_e, val) => mainWindow?.setOpacity(val))
ipcMain.handle('window:isAlwaysOnTop', () => mainWindow?.isAlwaysOnTop() ?? false)
