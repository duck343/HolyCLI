const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, dialog } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.setAppUserModelId('com.holycli.app')

let mainWindow
let splash
let splashReadyAt = 0
let tray
const ptyProcesses = new Map() // tabId -> ptyProcess

// Require node-pty once at startup so it's ready when needed
let pty
try { pty = require('node-pty') } catch (e) { console.error('node-pty failed to load:', e.message) }

// Pre-spawn the default shell immediately so it's ready when the renderer asks
let preSpawnedPty = null
function preSpawn() {
  if (!pty) return
  try {
    preSpawnedPty = pty.spawn('powershell.exe', ['-NoLogo', '-NoProfile'], {
      name: 'xterm-256color', cols: 100, rows: 30,
      cwd: os.homedir(), env: { ...process.env, TERM: 'xterm-256color' },
    })
  } catch (e) { console.error('pre-spawn failed:', e.message) }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900, height: 650, minWidth: 500, minHeight: 350,
    frame: false, backgroundColor: '#0a0814',
    hasShadow: true, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    title: 'Holy CLI', resizable: true, alwaysOnTop: false,
  })
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  mainWindow.once('ready-to-show', () => {
    const MIN_SPLASH_MS = 1500
    const elapsed = splashReadyAt ? Date.now() - splashReadyAt : MIN_SPLASH_MS
    const delay = Math.max(0, MIN_SPLASH_MS - elapsed)
    setTimeout(() => {
      mainWindow.show()
      if (splash && !splash.isDestroyed()) { splash.close(); splash = null }
    }, delay)
  })
  mainWindow.on('close', e => {
    e.preventDefault()
    if (!mainWindow.isVisible()) {
      mainWindow.setPosition(16, 16)
      mainWindow.show()
    }
    mainWindow.webContents.send('window:close-requested')
  })
  mainWindow.on('closed', () => {
    for (const [, proc] of ptyProcesses) proc.kill()
    ptyProcesses.clear()
    mainWindow = null
  })
}

function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.ico'))
  tray = new Tray(img)
  tray.setToolTip('Holy CLI')
  const menu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Always on Top', type: 'checkbox', checked: false, click: i => mainWindow?.setAlwaysOnTop(i.checked) },
    { type: 'separator' },
    { label: 'Quit', click: () => mainWindow?.close() },
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => mainWindow?.show())
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)

  // Splash — show immediately so it appears as fast as possible
  splash = new BrowserWindow({
    width: 300, height: 220, frame: false, backgroundColor: '#0a0814',
    alwaysOnTop: true, resizable: false, center: true, skipTaskbar: true,
    show: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })
  splash.loadFile(path.join(__dirname, 'splash.html'))
  splashReadyAt = Date.now()

  preSpawn()
  createWindow()
  createTray()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

function createPty(tabId, shellType = 'powershell') {
  if (!pty) return
  try {
    let proc
    if (shellType === 'powershell' && preSpawnedPty) {
      proc = preSpawnedPty
      preSpawnedPty = null
    } else {
      let shell, shellArgs
      if (process.platform === 'win32') {
        if (shellType === 'cmd') { shell = 'cmd.exe'; shellArgs = [] }
        else if (shellType === 'gitbash') { shell = 'C:\\Program Files\\Git\\bin\\bash.exe'; shellArgs = ['--login', '-i'] }
        else if (shellType === 'wsl') { shell = 'wsl.exe'; shellArgs = [] }
        else { shell = 'powershell.exe'; shellArgs = ['-NoLogo', '-NoProfile'] }
      } else { shell = 'bash'; shellArgs = [] }
      proc = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color', cols: 100, rows: 30,
        cwd: os.homedir(), env: { ...process.env, TERM: 'xterm-256color' },
      })
    }
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

ipcMain.handle('dialog:confirm', async (_e, message) => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question', title: 'Holy CLI',
    buttons: ['Yes', 'Cancel'], defaultId: 1, cancelId: 1,
    message,
  })
  return response === 0
})

ipcMain.on('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) new Notification({ title, body }).show()
})

ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize() })
ipcMain.on('window:force-close', () => mainWindow?.destroy())
ipcMain.on('window:alwaysOnTop', (_e, val) => mainWindow?.setAlwaysOnTop(val))
ipcMain.on('window:opacity', (_e, val) => mainWindow?.setOpacity(val))
ipcMain.handle('window:isAlwaysOnTop', () => mainWindow?.isAlwaysOnTop() ?? false)

ipcMain.handle('system:cpuPercent', () => new Promise(resolve => {
  const cpus1 = os.cpus()
  setTimeout(() => {
    const cpus2 = os.cpus()
    let idle = 0, total = 0
    cpus1.forEach((cpu, i) => {
      for (const t in cpus2[i].times) total += cpus2[i].times[t] - cpu.times[t]
      idle += cpus2[i].times.idle - cpu.times.idle
    })
    resolve(Math.round(100 - (idle / total * 100)))
  }, 400)
}))
