const api = window.electronAPI

// ── State ────────────────────────────────────────────────────────────────
let fontSize = parseInt(localStorage.getItem('fontSize') || '14')
let autoScroll = JSON.parse(localStorage.getItem('autoScroll') ?? 'true')
let isPinned = false
let notificationsEnabled = JSON.parse(localStorage.getItem('notifications') ?? 'true')
let activeTabId = null
let isSplit = false
let tabCounter = 0
let selectedFolder = ''
let savedFolders = JSON.parse(localStorage.getItem('savedFolders') || '[]')
const tabs = []

const TAB_COLORS = ['#a78bfa','#34d399','#f87171','#fbbf24','#38bdf8','#f472b6','#4ade80','#fb923c']
let tabColorIdx = 0

// New tab picker state
let newTabShell = 'powershell'
let newTabAI = 'none'
let newTabFolder = ''

// ── Themes ───────────────────────────────────────────────────────────────
const THEMES = {
  purple: {
    // Amethyst — indigo blues, violet magentas, electric cyan
    css: { '--bg':'rgba(10,8,20,0.82)', '--accent':'#a78bfa', '--accent2':'#7c3aed', '--text':'#e2e0f0', '--text-muted':'rgba(226,224,240,0.45)', '--danger':'#f87171' },
    terminal: { background:'transparent',foreground:'#e2e0f0',cursor:'#a78bfa',cursorAccent:'#0a0814',selectionBackground:'rgba(167,139,250,0.3)',black:'#1a1730',red:'#f87171',green:'#4ade80',yellow:'#fbbf24',blue:'#818cf8',magenta:'#c084fc',cyan:'#22d3ee',white:'#e2e0f0',brightBlack:'#4a3f7a',brightRed:'#fca5a5',brightGreen:'#86efac',brightYellow:'#fde047',brightBlue:'#a5b4fc',brightMagenta:'#e879f9',brightCyan:'#67e8f9',brightWhite:'#f5f3ff' },
  },
  ocean: {
    // Deep Sea — teal greens, coral reds, golden yellows, coral magentas
    css: { '--bg':'rgba(4,12,20,0.85)', '--accent':'#34d399', '--accent2':'#059669', '--text':'#d1fae5', '--text-muted':'rgba(209,250,229,0.45)', '--danger':'#fb7185' },
    terminal: { background:'transparent',foreground:'#d1fae5',cursor:'#34d399',cursorAccent:'#04111e',selectionBackground:'rgba(52,211,153,0.25)',black:'#0d2231',red:'#fb7185',green:'#2dd4bf',yellow:'#fcd34d',blue:'#38bdf8',magenta:'#f472b6',cyan:'#22d3ee',white:'#d1fae5',brightBlack:'#1e4060',brightRed:'#fda4af',brightGreen:'#5eead4',brightYellow:'#fde68a',brightBlue:'#7dd3fc',brightMagenta:'#f9a8d4',brightCyan:'#67e8f9',brightWhite:'#ecfdf5' },
  },
  crimson: {
    // Ember — muted greens, amber yellows, indigo blues as cool contrast
    css: { '--bg':'rgba(20,4,4,0.85)', '--accent':'#f87171', '--accent2':'#dc2626', '--text':'#fee2e2', '--text-muted':'rgba(254,226,226,0.45)', '--danger':'#f87171' },
    terminal: { background:'transparent',foreground:'#fee2e2',cursor:'#f87171',cursorAccent:'#140404',selectionBackground:'rgba(248,113,113,0.25)',black:'#2a0808',red:'#f87171',green:'#86efac',yellow:'#fcd34d',blue:'#818cf8',magenta:'#f9a8d4',cyan:'#5eead4',white:'#fee2e2',brightBlack:'#571414',brightRed:'#fca5a5',brightGreen:'#bbf7d0',brightYellow:'#fef08a',brightBlue:'#a5b4fc',brightMagenta:'#fbcfe8',brightCyan:'#99f6e4',brightWhite:'#fff1f2' },
  },
  matrix: {
    // Phosphor — neon greens, chartreuse yellow, cyan-blue, neon pink
    css: { '--bg':'rgba(0,8,0,0.90)', '--accent':'#00ff41', '--accent2':'#008f11', '--text':'#00ff41', '--text-muted':'rgba(0,255,65,0.45)', '--danger':'#ff3333' },
    terminal: { background:'transparent',foreground:'#00ff41',cursor:'#00ff41',cursorAccent:'#000800',selectionBackground:'rgba(0,255,65,0.2)',black:'#001400',red:'#ff3333',green:'#00ff41',yellow:'#b8ff00',blue:'#00d4ff',magenta:'#ff00aa',cyan:'#00ffcc',white:'#ccffcc',brightBlack:'#005200',brightRed:'#ff6666',brightGreen:'#69ff47',brightYellow:'#d4ff00',brightBlue:'#44ddff',brightMagenta:'#ff44cc',brightCyan:'#44ffdd',brightWhite:'#eeffee' },
  },
  tokyo: {
    // Tokyo Night — canonical colors, brights are noticeably lighter
    css: { '--bg':'rgba(13,17,33,0.88)', '--accent':'#7aa2f7', '--accent2':'#3d59a1', '--text':'#c0caf5', '--text-muted':'rgba(192,202,245,0.45)', '--danger':'#f7768e' },
    terminal: { background:'transparent',foreground:'#c0caf5',cursor:'#7aa2f7',cursorAccent:'#0d1121',selectionBackground:'rgba(122,162,247,0.25)',black:'#15161e',red:'#f7768e',green:'#9ece6a',yellow:'#e0af68',blue:'#7aa2f7',magenta:'#bb9af7',cyan:'#7dcfff',white:'#a9b1d6',brightBlack:'#414868',brightRed:'#ff899d',brightGreen:'#b9f27c',brightYellow:'#ffc777',brightBlue:'#82aaff',brightMagenta:'#c3a6ff',brightCyan:'#86e1fc',brightWhite:'#cdd6f4' },
  },
  catppuccin: {
    // Catppuccin Mocha — canonical colors, brights are noticeably lighter
    css: { '--bg':'rgba(30,30,46,0.88)', '--accent':'#cba6f7', '--accent2':'#b4befe', '--text':'#cdd6f4', '--text-muted':'rgba(205,214,244,0.45)', '--danger':'#f38ba8' },
    terminal: { background:'transparent',foreground:'#cdd6f4',cursor:'#cba6f7',cursorAccent:'#1e1e2e',selectionBackground:'rgba(203,166,247,0.25)',black:'#45475a',red:'#f38ba8',green:'#a6e3a1',yellow:'#f9e2af',blue:'#89b4fa',magenta:'#cba6f7',cyan:'#89dceb',white:'#bac2de',brightBlack:'#585b70',brightRed:'#f5a6b8',brightGreen:'#b8f0b3',brightYellow:'#fdecc0',brightBlue:'#9ec4ff',brightMagenta:'#d8baff',brightCyan:'#a0e8f3',brightWhite:'#cdd6f4' },
  },
  nord: {
    // Nord — canonical aurora palette, brights are warmer/lighter
    css: { '--bg':'rgba(36,41,54,0.88)', '--accent':'#88c0d0', '--accent2':'#5e81ac', '--text':'#eceff4', '--text-muted':'rgba(236,239,244,0.45)', '--danger':'#bf616a' },
    terminal: { background:'transparent',foreground:'#eceff4',cursor:'#88c0d0',cursorAccent:'#242936',selectionBackground:'rgba(136,192,208,0.25)',black:'#3b4252',red:'#bf616a',green:'#a3be8c',yellow:'#ebcb8b',blue:'#81a1c1',magenta:'#b48ead',cyan:'#88c0d0',white:'#e5e9f0',brightBlack:'#4c566a',brightRed:'#d07080',brightGreen:'#b5d19f',brightYellow:'#f0d9a0',brightBlue:'#91b4d5',brightMagenta:'#c9a8c3',brightCyan:'#9ecfce',brightWhite:'#eceff4' },
  },
  dracula: {
    // Dracula — canonical, unchanged (already has good dim/bright separation)
    css: { '--bg':'rgba(40,42,54,0.88)', '--accent':'#bd93f9', '--accent2':'#6272a4', '--text':'#f8f8f2', '--text-muted':'rgba(248,248,242,0.45)', '--danger':'#ff5555' },
    terminal: { background:'transparent',foreground:'#f8f8f2',cursor:'#bd93f9',cursorAccent:'#282a36',selectionBackground:'rgba(189,147,249,0.25)',black:'#21222c',red:'#ff5555',green:'#50fa7b',yellow:'#f1fa8c',blue:'#bd93f9',magenta:'#ff79c6',cyan:'#8be9fd',white:'#f8f8f2',brightBlack:'#6272a4',brightRed:'#ff6e6e',brightGreen:'#69ff94',brightYellow:'#ffffa5',brightBlue:'#d6acff',brightMagenta:'#ff92df',brightCyan:'#a4ffff',brightWhite:'#ffffff' },
  },
}

let activeTheme = localStorage.getItem('theme') || 'purple'

function applyTheme(name) {
  activeTheme = name
  localStorage.setItem('theme', name)
  const t = THEMES[name]
  for (const [k, v] of Object.entries(t.css)) document.documentElement.style.setProperty(k, v)
  tabs.forEach(tab => { tab.term.options.theme = t.terminal })
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === name))
}

// ── Flow Field Background ─────────────────────────────────────────────────
let flowEnabled = JSON.parse(localStorage.getItem('flowField') || 'false')
let flowAnimId = null
let flowParticles = []
let flowW = 0, flowH = 0
let flowCtx = null

function flowGetColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a78bfa'
}

function flowResize() {
  const canvas = document.getElementById('flow-canvas')
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  flowW = canvas.offsetWidth
  flowH = canvas.offsetHeight
  canvas.width = flowW * dpr
  canvas.height = flowH * dpr
  flowCtx = canvas.getContext('2d')
  flowCtx.scale(dpr, dpr)
  flowParticles = []
  for (let i = 0; i < 400; i++) {
    flowParticles.push({
      x: Math.random() * flowW, y: Math.random() * flowH,
      vx: 0, vy: 0, age: 0,
      life: Math.random() * 200 + 100
    })
  }
}

function flowAnimate() {
  if (!flowEnabled || !flowCtx) return
  flowCtx.fillStyle = 'rgba(0,0,0,0.12)'
  flowCtx.fillRect(0, 0, flowW, flowH)
  const color = flowGetColor()
  for (const p of flowParticles) {
    const angle = (Math.cos(p.x * 0.005) + Math.sin(p.y * 0.005)) * Math.PI
    p.vx += Math.cos(angle) * 0.2
    p.vy += Math.sin(angle) * 0.2
    p.x += p.vx; p.y += p.vy
    p.vx *= 0.95; p.vy *= 0.95
    p.age++
    if (p.age > p.life) {
      p.x = Math.random() * flowW; p.y = Math.random() * flowH
      p.vx = 0; p.vy = 0; p.age = 0
      p.life = Math.random() * 200 + 100
    }
    if (p.x < 0) p.x = flowW; if (p.x > flowW) p.x = 0
    if (p.y < 0) p.y = flowH; if (p.y > flowH) p.y = 0
    const alpha = (1 - Math.abs((p.age / p.life) - 0.5) * 2) * 0.55
    flowCtx.globalAlpha = alpha
    flowCtx.fillStyle = color
    flowCtx.fillRect(p.x, p.y, 1.5, 1.5)
  }
  flowCtx.globalAlpha = 1
  flowAnimId = requestAnimationFrame(flowAnimate)
}

function setFlowField(enabled) {
  flowEnabled = enabled
  localStorage.setItem('flowField', JSON.stringify(enabled))
  const canvas = document.getElementById('flow-canvas')
  if (!canvas) return
  if (enabled) {
    flowResize()
    canvas.classList.add('active')
    flowAnimate()
  } else {
    canvas.classList.remove('active')
    if (flowAnimId) { cancelAnimationFrame(flowAnimId); flowAnimId = null }
    if (flowCtx) flowCtx.clearRect(0, 0, flowW, flowH)
  }
}

window.addEventListener('resize', () => { if (flowEnabled) flowResize() })

// ── Mini Game ────────────────────────────────────────────────────────────
let gameEnabled = JSON.parse(localStorage.getItem('miniGame') || 'false')
let gameAnimId = null
let gameW = 0, gameH = 0
let gameCtx = null

const G = {
  ball:    { x: 0, y: 0, vx: 0, vy: 0, r: 8 },
  paddle:  { x: 0, w: 90, h: 10 },
  hearts:  3,
  damageAlpha: 0,   // 0–1, red flash
  gameOver: false,
  gameOverTimer: 0,
  speed: 1,         // speed multiplier, grows slowly
  mouseX: -1,
}

function gameColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a78bfa'
}

function gameReset(fullReset = false) {
  if (fullReset) { G.hearts = 3; G.speed = 1 }
  const canvas = document.getElementById('game-canvas')
  if (!canvas) return
  gameW = canvas.offsetWidth
  gameH = canvas.offsetHeight
  G.ball.x = gameW / 2
  G.ball.y = gameH * 0.38
  const angle = (-55 + Math.random() * 50) * (Math.PI / 180) // ~-55° to -5° (upward)
  const spd = (3.6 + G.speed * 0.4)
  G.ball.vx = Math.cos(angle) * spd * (Math.random() < 0.5 ? 1 : -1)
  G.ball.vy = -Math.abs(Math.sin(angle) * spd) - 2
  G.paddle.x = gameW / 2 - G.paddle.w / 2
  G.gameOver = false
}

function gameResize() {
  const canvas = document.getElementById('game-canvas')
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  gameW = canvas.offsetWidth
  gameH = canvas.offsetHeight
  canvas.width = gameW * dpr
  canvas.height = gameH * dpr
  gameCtx = canvas.getContext('2d')
  gameCtx.scale(dpr, dpr)
}

function gameDamage() {
  G.hearts = Math.max(0, G.hearts - 1)
  G.damageAlpha = 1
  G.speed = Math.min(G.speed + 0.15, 3)

  // Screen shake via CSS class
  const area = document.getElementById('terminal-area')
  area.classList.remove('game-shake')
  requestAnimationFrame(() => area.classList.add('game-shake'))
  setTimeout(() => area.classList.remove('game-shake'), 310)

  if (G.hearts <= 0) {
    G.gameOver = true
    G.gameOverTimer = 180 // ~3s at 60fps
  } else {
    setTimeout(() => gameReset(false), 700)
  }
}

function gameLoop() {
  if (!gameEnabled || !gameCtx) return

  gameCtx.clearRect(0, 0, gameW, gameH)

  // ── Paddle follows mouse ─────────────────────────────────────────────
  if (G.mouseX >= 0) {
    const target = G.mouseX - G.paddle.w / 2
    G.paddle.x += (target - G.paddle.x) * 0.22
    G.paddle.x = Math.max(0, Math.min(gameW - G.paddle.w, G.paddle.x))
  }
  const paddleY = gameH - 28

  const col = gameColor()

  if (!G.gameOver) {
    // ── Ball physics ───────────────────────────────────────────────────
    G.ball.x += G.ball.vx
    G.ball.y += G.ball.vy

    // Wall bounces
    if (G.ball.x - G.ball.r < 0)      { G.ball.x = G.ball.r;        G.ball.vx = Math.abs(G.ball.vx) }
    if (G.ball.x + G.ball.r > gameW)  { G.ball.x = gameW - G.ball.r; G.ball.vx = -Math.abs(G.ball.vx) }
    if (G.ball.y - G.ball.r < 0)      { G.ball.y = G.ball.r;        G.ball.vy = Math.abs(G.ball.vy) }

    // Paddle bounce — angle based on hit position
    const withinX = G.ball.x > G.paddle.x - 4 && G.ball.x < G.paddle.x + G.paddle.w + 4
    if (withinX && G.ball.vy > 0 && G.ball.y + G.ball.r >= paddleY && G.ball.y + G.ball.r <= paddleY + G.ball.r + G.ball.vy + 2) {
      const hitPos = (G.ball.x - G.paddle.x) / G.paddle.w // 0–1
      const angle  = (hitPos - 0.5) * 2.2                  // -1.1 to 1.1 rad
      const spd    = Math.hypot(G.ball.vx, G.ball.vy)
      G.ball.vx    = Math.sin(angle) * spd
      G.ball.vy    = -Math.abs(Math.cos(angle) * spd)
      G.ball.y     = paddleY - G.ball.r - 1
      // Slight speed creep
      G.speed = Math.min(G.speed + 0.01, 3)
      const maxSpd = 3.6 + G.speed * 0.4 + 4
      const curSpd = Math.hypot(G.ball.vx, G.ball.vy)
      if (curSpd > maxSpd) { G.ball.vx *= maxSpd / curSpd; G.ball.vy *= maxSpd / curSpd }
    }

    // Ball fell past paddle
    if (G.ball.y - G.ball.r > gameH + 10) {
      gameDamage()
    }

    // ── Draw ball ──────────────────────────────────────────────────────
    gameCtx.save()
    gameCtx.shadowColor = col
    gameCtx.shadowBlur = 14
    gameCtx.beginPath()
    gameCtx.arc(G.ball.x, G.ball.y, G.ball.r, 0, Math.PI * 2)
    gameCtx.fillStyle = col
    gameCtx.fill()
    gameCtx.restore()
  }

  // ── Draw paddle ──────────────────────────────────────────────────────
  gameCtx.save()
  gameCtx.shadowColor = col
  gameCtx.shadowBlur = 12
  const pr = G.paddle.h / 2
  gameCtx.beginPath()
  gameCtx.roundRect(G.paddle.x, paddleY, G.paddle.w, G.paddle.h, pr)
  gameCtx.fillStyle = col
  gameCtx.fill()
  gameCtx.restore()

  // ── Draw hearts ──────────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const filled = i < G.hearts
    gameCtx.font = '13px sans-serif'
    gameCtx.globalAlpha = filled ? 0.9 : 0.22
    gameCtx.fillStyle = filled ? '#f87171' : '#ffffff'
    gameCtx.fillText('♥', 12 + i * 20, 22)
  }
  gameCtx.globalAlpha = 1

  // ── Damage red flash ─────────────────────────────────────────────────
  if (G.damageAlpha > 0) {
    gameCtx.fillStyle = `rgba(248,113,113,${G.damageAlpha * 0.28})`
    gameCtx.fillRect(0, 0, gameW, gameH)
    G.damageAlpha = Math.max(0, G.damageAlpha - 0.04)
  }

  // ── Game over screen ─────────────────────────────────────────────────
  if (G.gameOver) {
    gameCtx.fillStyle = 'rgba(0,0,0,0.55)'
    gameCtx.fillRect(0, 0, gameW, gameH)
    gameCtx.font = 'bold 22px "Segoe UI",system-ui,sans-serif'
    gameCtx.textAlign = 'center'
    gameCtx.fillStyle = '#f87171'
    gameCtx.shadowColor = '#f87171'
    gameCtx.shadowBlur = 18
    gameCtx.fillText('GAME OVER', gameW / 2, gameH / 2 - 12)
    gameCtx.shadowBlur = 0
    gameCtx.font = '12px "Segoe UI",system-ui,sans-serif'
    gameCtx.fillStyle = 'rgba(255,255,255,0.5)'
    gameCtx.fillText('restarting…', gameW / 2, gameH / 2 + 14)
    gameCtx.textAlign = 'left'
    G.gameOverTimer--
    if (G.gameOverTimer <= 0) gameReset(true)
  }

  gameAnimId = requestAnimationFrame(gameLoop)
}

function setMiniGame(enabled) {
  gameEnabled = enabled
  localStorage.setItem('miniGame', JSON.stringify(enabled))
  const canvas = document.getElementById('game-canvas')
  if (!canvas) return
  if (enabled) {
    canvas.classList.add('active')
    gameResize()
    gameReset(true)
    gameLoop()
  } else {
    canvas.classList.remove('active')
    if (gameAnimId) { cancelAnimationFrame(gameAnimId); gameAnimId = null }
    if (gameCtx) gameCtx.clearRect(0, 0, gameW, gameH)
  }
}

// Mouse tracking for paddle — on document so terminal stays interactive
document.addEventListener('mousemove', e => {
  if (!gameEnabled) return
  const area = document.getElementById('terminal-area')
  if (!area) return
  const rect = area.getBoundingClientRect()
  G.mouseX = e.clientX - rect.left
})

window.addEventListener('resize', () => { if (gameEnabled) { gameResize(); G.paddle.x = Math.min(G.paddle.x, gameW - G.paddle.w) } })

// ── ANSI strip ───────────────────────────────────────────────────────────
function stripAnsi(s) {
  return s
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '')
    .replace(/\r/g, '')
}

// ── Saved folders ─────────────────────────────────────────────────────────
function persistSavedFolders() {
  localStorage.setItem('savedFolders', JSON.stringify(savedFolders))
}

function addToSavedFolders(path) {
  if (path && !savedFolders.includes(path)) {
    savedFolders.push(path)
    persistSavedFolders()
  }
}

function removeFromSavedFolders(path) {
  savedFolders = savedFolders.filter(f => f !== path)
  persistSavedFolders()
}

function setSelectedFolder(path) {
  selectedFolder = path
  const label = document.getElementById('save-ctx-folder-label')
  const row = document.getElementById('save-ctx-folder-row')
  if (label) label.textContent = path || 'No folder selected'
  if (row) row.classList.toggle('has-path', !!path)
}

// ── Tab creation ─────────────────────────────────────────────────────────
function createTab(opts = {}) {
  const id = `tab-${++tabCounter}`
  const name = opts.name ?? `Session ${tabCounter}`
  const startTime = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const isSplitTab = opts.split ?? false

  const term = new Terminal({
    theme: THEMES[activeTheme].terminal,
    fontFamily: '"Cascadia Code","Fira Code","JetBrains Mono",Consolas,monospace',
    fontSize, lineHeight: 1.4, letterSpacing: 0.3,
    cursorBlink: true, cursorStyle: 'bar',
    scrollback: 5000, allowTransparency: true, macOptionIsMeta: true,
  })

  const fitAddon = new FitAddon.FitAddon()
  const searchAddon = new SearchAddon.SearchAddon()
  term.loadAddon(fitAddon)
  term.loadAddon(searchAddon)
  term.loadAddon(new WebLinksAddon.WebLinksAddon())

  const el = document.createElement('div')
  el.className = 'terminal-instance'
  el.dataset.tabId = id
  el.style.cssText = 'width:100%;height:100%;display:none'

  const color = opts.color ?? TAB_COLORS[tabColorIdx++ % TAB_COLORS.length]
  const tab = { id, name, term, fitAddon, searchAddon, el, buffer: '', notifyTimer: null, startTime, isSplitTab, folder: opts.folder ?? null, aiType: opts.aiType ?? 'none', color }
  tabs.push(tab)

  term.onData(data => api.terminal.sendInput(id, data))

  term.attachCustomKeyEventHandler(e => {
    if (e.ctrlKey && e.key === 'v') {
      if (e.type === 'keydown') {
        navigator.clipboard.readText().then(t => term.paste(t))
      }
      return false
    }
    if (e.type !== 'keydown') return true
    if (e.ctrlKey && e.key === 'c' && term.hasSelection()) {
      navigator.clipboard.writeText(term.getSelection()); return false
    }
    return true
  })

  if (isSplitTab) {
    el.style.display = 'block'
    document.getElementById('terminal-pane-split').appendChild(el)
    term.open(el)
  } else {
    document.getElementById('terminal-pane-main').appendChild(el)
    term.open(el)
  }

  term.element.addEventListener('paste', e => { e.preventDefault(); e.stopPropagation() }, true)

  api.terminal.create(id, opts.shellType ?? 'powershell')
  return tab
}

// ── Tab bar ───────────────────────────────────────────────────────────────
let dragSrcTabId = null

function renderTabBar() {
  const list = document.getElementById('tab-list')
  list.innerHTML = ''
  const mainTabs = tabs.filter(t => !t.isSplitTab)
  mainTabs.forEach(tab => {
    const el = document.createElement('div')
    el.className = 'tab-item' + (tab.id === activeTabId ? ' active' : '')
    el.draggable = true
    el.dataset.tabId = tab.id
    el.style.setProperty('--tab-color', tab.color)

    const dot = document.createElement('span')
    dot.className = 'tab-color-dot'
    el.appendChild(dot)

    const nameEl = document.createElement('span')
    nameEl.className = 'tab-name'
    nameEl.textContent = tab.name
    nameEl.addEventListener('dblclick', e => {
      e.stopPropagation()
      const input = document.createElement('input')
      input.className = 'tab-rename-input'
      input.value = tab.name
      nameEl.replaceWith(input)
      input.focus(); input.select()
      const commit = () => { tab.name = input.value.trim() || tab.name; renderTabBar() }
      input.addEventListener('blur', commit)
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        if (e.key === 'Escape') renderTabBar()
      })
    })
    el.appendChild(nameEl)

    if (mainTabs.length > 1) {
      const x = document.createElement('button')
      x.className = 'tab-close'
      x.textContent = '✕'
      x.addEventListener('click', e => { e.stopPropagation(); closeTab(tab.id) })
      el.appendChild(x)
    }

    el.addEventListener('click', () => switchTab(tab.id))

    // Drag reorder
    el.addEventListener('dragstart', e => {
      dragSrcTabId = tab.id
      e.dataTransfer.effectAllowed = 'move'
      setTimeout(() => el.classList.add('dragging'), 0)
    })
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging')
      list.querySelectorAll('.tab-item').forEach(t => t.classList.remove('drag-over'))
    })
    el.addEventListener('dragover', e => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      list.querySelectorAll('.tab-item').forEach(t => t.classList.remove('drag-over'))
      if (tab.id !== dragSrcTabId) el.classList.add('drag-over')
    })
    el.addEventListener('drop', e => {
      e.preventDefault()
      if (!dragSrcTabId || dragSrcTabId === tab.id) return
      const mainT = tabs.filter(t => !t.isSplitTab)
      const splitT = tabs.filter(t => t.isSplitTab)
      const srcI = mainT.findIndex(t => t.id === dragSrcTabId)
      const dstI = mainT.findIndex(t => t.id === tab.id)
      if (srcI === -1 || dstI === -1) return
      const [moved] = mainT.splice(srcI, 1)
      mainT.splice(dstI, 0, moved)
      tabs.length = 0
      tabs.push(...mainT, ...splitT)
      dragSrcTabId = null
      renderTabBar()
    })

    list.appendChild(el)
  })
}

function switchTab(id) {
  tabs.filter(t => !t.isSplitTab).forEach(t => { t.el.style.display = 'none' })
  activeTabId = id
  const tab = tabs.find(t => t.id === id)
  if (!tab) return
  tab.el.style.display = 'block'
  requestAnimationFrame(() => {
    tab.fitAddon.fit()
    api.terminal.resize(id, tab.term.cols, tab.term.rows)
    tab.term.focus()
  })
  renderTabBar()
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id)
  if (idx === -1) return
  const tab = tabs[idx]
  api.terminal.close(id)
  tab.el.remove()
  tabs.splice(idx, 1)

  const remaining = tabs.filter(t => !t.isSplitTab)
  if (remaining.length === 0) {
    const newTab = createTab()
    renderTabBar()
    switchTab(newTab.id)
  } else if (activeTabId === id) {
    switchTab(remaining[Math.min(idx, remaining.length - 1)].id)
  } else {
    renderTabBar()
  }
}

// ── IPC handlers ─────────────────────────────────────────────────────────
api.terminal.onData((tabId, data) => {
  const tab = tabs.find(t => t.id === tabId)
  if (!tab) return
  tab.term.write(data)
  if (autoScroll) tab.term.scrollToBottom()

  tab.buffer += stripAnsi(data)
  if (tab.buffer.length > 500000) tab.buffer = tab.buffer.slice(-400000)

  if (notificationsEnabled) {
    clearTimeout(tab.notifyTimer)
    tab.notifyTimer = setTimeout(() => {
      if (!document.hasFocus()) api.notify('Holy CLI', `"${tab.name}" is ready`)
      tab.notifyTimer = null
    }, 3000)
  }
})

api.terminal.onExit(tabId => {
  const tab = tabs.find(t => t.id === tabId)
  if (tab) tab.term.write('\r\n\x1b[33m[Session ended]\x1b[0m\r\n')
})

// ── Split view ────────────────────────────────────────────────────────────
function toggleSplit() {
  if (isSplit) {
    const st = tabs.find(t => t.isSplitTab)
    if (st) {
      api.terminal.close(st.id)
      st.el.remove()
      tabs.splice(tabs.indexOf(st), 1)
    }
    document.getElementById('terminal-pane-split').classList.add('hidden')
    document.getElementById('split-resizer').classList.add('hidden')
    document.getElementById('btn-split').classList.remove('active')
    isSplit = false
  } else {
    document.getElementById('terminal-pane-split').classList.remove('hidden')
    document.getElementById('split-resizer').classList.remove('hidden')
    document.getElementById('btn-split').classList.add('active')
    isSplit = true
    const st = createTab({ name: 'Split', split: true })
    setTimeout(() => {
      st.fitAddon.fit()
      api.terminal.resize(st.id, st.term.cols, st.term.rows)
    }, 60)
  }
  const active = tabs.find(t => t.id === activeTabId)
  if (active) setTimeout(() => { active.fitAddon.fit(); api.terminal.resize(activeTabId, active.term.cols, active.term.rows) }, 60)
}

// Split resizer drag
const splitResizer = document.getElementById('split-resizer')
const termArea = document.getElementById('terminal-area')
let isResizing = false
let resizeStartX = 0
let resizeStartLeft = 0

splitResizer.addEventListener('mousedown', e => {
  isResizing = true
  resizeStartX = e.clientX
  const paneMain = document.getElementById('terminal-pane-main')
  resizeStartLeft = paneMain.getBoundingClientRect().width
  splitResizer.classList.add('dragging')
  e.preventDefault()
})

document.addEventListener('mousemove', e => {
  if (!isResizing) return
  const paneMain = document.getElementById('terminal-pane-main')
  const pane = document.getElementById('terminal-pane-split')
  const totalW = termArea.getBoundingClientRect().width - 4
  const newLeft = Math.min(Math.max(resizeStartLeft + (e.clientX - resizeStartX), 150), totalW - 150)
  paneMain.style.flex = 'none'
  paneMain.style.width = newLeft + 'px'
  pane.style.flex = '1'
})

document.addEventListener('mouseup', () => {
  if (!isResizing) return
  isResizing = false
  splitResizer.classList.remove('dragging')
  const active = tabs.find(t => t.id === activeTabId)
  const st = tabs.find(t => t.isSplitTab)
  if (active) { active.fitAddon.fit(); api.terminal.resize(activeTabId, active.term.cols, active.term.rows) }
  if (st) { st.fitAddon.fit(); api.terminal.resize(st.id, st.term.cols, st.term.rows) }
})

// ── Drag & drop ───────────────────────────────────────────────────────────
const dropOverlay = document.getElementById('drop-overlay')

document.addEventListener('dragover', e => { e.preventDefault(); dropOverlay.classList.remove('hidden') })
document.addEventListener('dragleave', e => { if (e.clientX <= 0 && e.clientY <= 0) dropOverlay.classList.add('hidden') })
document.addEventListener('drop', e => {
  e.preventDefault()
  dropOverlay.classList.add('hidden')
  const files = Array.from(e.dataTransfer.files)
  if (!files.length) return
  const paths = files.map(f => `"${api.getFilePath(f)}"`).join(' ')
  const targetId = isSplit && e.target.closest('#terminal-pane-split') ? tabs.find(t => t.isSplitTab)?.id : activeTabId
  if (targetId) {
    api.terminal.sendInput(targetId, paths)
    tabs.find(t => t.id === targetId)?.term.focus()
  }
})

// ── Resize observer ───────────────────────────────────────────────────────
function refitAll() {
  const active = tabs.find(t => t.id === activeTabId)
  if (active) { active.fitAddon.fit(); api.terminal.resize(activeTabId, active.term.cols, active.term.rows) }
  if (isSplit) {
    const st = tabs.find(t => t.isSplitTab)
    if (st) { st.fitAddon.fit(); api.terminal.resize(st.id, st.term.cols, st.term.rows) }
  }
}

new ResizeObserver(refitAll).observe(document.getElementById('terminal-area'))
window.addEventListener('resize', refitAll)

// ── Font size ─────────────────────────────────────────────────────────────
function setFontSize(size) {
  fontSize = Math.min(24, Math.max(10, size))
  localStorage.setItem('fontSize', fontSize)
  tabs.forEach(t => { t.term.options.fontSize = fontSize; t.fitAddon.fit() })
  document.getElementById('fontsize-slider').value = fontSize
  document.getElementById('fontsize-val').textContent = fontSize + 'px'
}

// ── Find bar ──────────────────────────────────────────────────────────────
const findBar = document.getElementById('find-bar')
const findInput = document.getElementById('find-input')

function getSearchAddon() { return tabs.find(t => t.id === activeTabId)?.searchAddon }

function toggleFind() {
  findBar.classList.toggle('hidden')
  if (!findBar.classList.contains('hidden')) findInput.focus()
  else getSearchAddon()?.clearDecorations()
}

document.getElementById('find-next').addEventListener('click', () => getSearchAddon()?.findNext(findInput.value, { incremental: false }))
document.getElementById('find-prev').addEventListener('click', () => getSearchAddon()?.findPrevious(findInput.value))
document.getElementById('find-close').addEventListener('click', () => {
  findBar.classList.add('hidden')
  getSearchAddon()?.clearDecorations()
  tabs.find(t => t.id === activeTabId)?.term.focus()
})
findInput.addEventListener('input', () => {
  findInput.value ? getSearchAddon()?.findNext(findInput.value, { incremental: true }) : getSearchAddon()?.clearDecorations()
})
findInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') getSearchAddon()?.findNext(findInput.value)
  if (e.key === 'Escape') { findBar.classList.add('hidden'); getSearchAddon()?.clearDecorations() }
})

// ── Context menu ──────────────────────────────────────────────────────────
const ctxMenu = document.getElementById('context-menu')
const hideCtx = () => ctxMenu.classList.add('hidden')

document.addEventListener('contextmenu', e => {
  e.preventDefault()
  ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 170) + 'px'
  ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 160) + 'px'
  ctxMenu.classList.remove('hidden')
})
document.addEventListener('click', hideCtx)

function getActiveTab() { return tabs.find(t => t.id === activeTabId) }

document.getElementById('ctx-copy').addEventListener('click', () => {
  const sel = getActiveTab()?.term.getSelection()
  if (sel) navigator.clipboard.writeText(sel)
  hideCtx()
})
document.getElementById('ctx-paste').addEventListener('click', async () => {
  const text = await navigator.clipboard.readText()
  const activeTab = getActiveTab()
  if (activeTab) activeTab.term.paste(text)
  activeTab?.term.focus()
  hideCtx()
})
document.getElementById('ctx-select-all').addEventListener('click', () => { getActiveTab()?.term.selectAll(); hideCtx() })
document.getElementById('ctx-clear').addEventListener('click', () => { getActiveTab()?.term.clear(); hideCtx() })
document.getElementById('ctx-autoscroll').addEventListener('click', () => {
  autoScroll = !autoScroll
  document.getElementById('ctx-autoscroll').textContent = `Auto-scroll: ${autoScroll ? 'on' : 'off'}`
  document.getElementById('autoscroll-toggle').checked = autoScroll
  hideCtx()
})

// ── Window controls ───────────────────────────────────────────────────────
document.getElementById('btn-minimize').addEventListener('click', () => api.window.minimize())
document.getElementById('btn-maximize').addEventListener('click', () => api.window.maximize())
document.getElementById('btn-close').addEventListener('click', () => api.window.close())
document.getElementById('btn-split').addEventListener('click', toggleSplit)
document.getElementById('btn-find').addEventListener('click', toggleFind)

// ── Panel positioning helper ──────────────────────────────────────────────
function positionPanel(panel, anchor) {
  panel.classList.remove('hidden')
  const btnRect = anchor.getBoundingClientRect()
  const panelH = panel.getBoundingClientRect().height
  panel.style.right = (window.innerWidth - btnRect.right) + 'px'
  if (btnRect.top >= panelH + 8) {
    panel.style.bottom = (window.innerHeight - btnRect.top + 4) + 'px'
    panel.style.top = 'auto'
  } else {
    panel.style.top = (btnRect.bottom + 4) + 'px'
    panel.style.bottom = 'auto'
  }
}

// ── New Tab Picker ────────────────────────────────────────────────────────
const ntpPanel = document.getElementById('ntp-panel')
const btnNewTab = document.getElementById('btn-new-tab')

function renderNtpSavedFolders() {
  const container = document.getElementById('ntp-saved-folders')
  container.innerHTML = ''
  savedFolders.forEach(path => {
    const chip = document.createElement('div')
    chip.className = 'ntp-folder-chip' + (newTabFolder === path ? ' active' : '')
    const name = path.split(/[\\/]/).pop() || path
    chip.title = path

    const label = document.createElement('span')
    label.textContent = name
    label.addEventListener('click', e => {
      e.stopPropagation()
      newTabFolder = newTabFolder === path ? '' : path
      document.getElementById('ntp-folder-label').textContent = newTabFolder || 'Choose folder (optional)'
      document.getElementById('ntp-pick-folder').classList.toggle('has-path', !!newTabFolder)
      renderNtpSavedFolders()
    })

    const del = document.createElement('button')
    del.className = 'ntp-folder-chip-del'
    del.textContent = '×'
    del.title = 'Remove bookmark'
    del.addEventListener('click', e => {
      e.stopPropagation()
      if (newTabFolder === path) { newTabFolder = ''; document.getElementById('ntp-folder-label').textContent = 'Choose folder (optional)'; document.getElementById('ntp-pick-folder').classList.remove('has-path') }
      removeFromSavedFolders(path)
      renderNtpSavedFolders()
    })

    chip.appendChild(label)
    chip.appendChild(del)
    container.appendChild(chip)
  })
}

btnNewTab.addEventListener('click', e => {
  e.stopPropagation()
  const isOpen = ntpPanel.classList.contains('visible')
  if (!isOpen) {
    renderNtpSavedFolders()
    const btnRect = btnNewTab.getBoundingClientRect()
    const pw = ntpPanel.getBoundingClientRect().width
    const ph = ntpPanel.getBoundingClientRect().height
    const left = Math.max(4, btnRect.right - pw)
    const top = (btnRect.bottom + ph + 8 <= window.innerHeight) ? btnRect.bottom + 4 : btnRect.top - ph - 4
    ntpPanel.style.left = left + 'px'
    ntpPanel.style.top = top + 'px'
    ntpPanel.style.right = 'auto'
    ntpPanel.style.bottom = 'auto'
    ntpPanel.classList.add('visible')
    const activeShellChip = ntpPanel.querySelector('#shell-chip-group .chip.active')
    if (activeShellChip) activeShellChip.focus()
  } else {
    ntpPanel.classList.remove('visible')
  }
  btnNewTab.classList.toggle('active', !isOpen)
})

document.addEventListener('click', e => {
  if (!ntpPanel.contains(e.target) && e.target !== btnNewTab) {
    ntpPanel.classList.remove('visible')
    btnNewTab.classList.remove('active')
  }
})

// Shell chips
document.querySelectorAll('#shell-chip-group .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    newTabShell = btn.dataset.shell
    document.querySelectorAll('#shell-chip-group .chip').forEach(b => b.classList.toggle('active', b === btn))
  })
})

// AI chips
document.querySelectorAll('#ai-chip-group .chip').forEach(btn => {
  btn.addEventListener('click', () => {
    newTabAI = btn.dataset.ai
    document.querySelectorAll('#ai-chip-group .chip').forEach(b => b.classList.toggle('active', b === btn))
    document.getElementById('ntp-skip-row').classList.toggle('hidden', newTabAI === 'none')
  })
})

// Keyboard nav in NTP panel
ntpPanel.addEventListener('keydown', e => {
  if (e.key === 'Enter') { document.getElementById('ntp-open-btn').click(); return }
  if (e.key === 'Escape') { ntpPanel.classList.remove('visible'); btnNewTab.classList.remove('active'); return }
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const focused = document.activeElement
  if (!focused || !focused.classList.contains('chip')) return
  e.preventDefault()
  const group = focused.closest('.chip-group')
  const chips = [...group.querySelectorAll('.chip')]
  const idx = chips.indexOf(focused)
  const next = e.key === 'ArrowRight'
    ? chips[(idx + 1) % chips.length]
    : chips[(idx - 1 + chips.length) % chips.length]
  next.focus()
  next.click()
})

// Folder picker in new tab panel
document.getElementById('ntp-pick-folder').addEventListener('click', async e => {
  e.stopPropagation()
  const folder = await api.dialog.pickFolder()
  if (folder) {
    newTabFolder = folder
    addToSavedFolders(folder)
    document.getElementById('ntp-folder-label').textContent = folder.split(/[\\/]/).pop() || folder
    document.getElementById('ntp-pick-folder').classList.add('has-path')
    renderNtpSavedFolders()
  }
})

// Open tab button
document.getElementById('ntp-open-btn').addEventListener('click', () => {
  const shellLabels = { powershell: 'PowerShell', cmd: 'CMD', gitbash: 'Git Bash', wsl: 'WSL' }
  const aiLabels = { claude: 'Claude', codex: 'Codex', gemini: 'Gemini' }
  const tabName = newTabAI !== 'none' ? (aiLabels[newTabAI] ?? newTabAI) : (shellLabels[newTabShell] ?? newTabShell)
  const skipPerms = document.getElementById('ntp-skip-perms').checked

  const tab = createTab({ name: tabName, shellType: newTabShell, folder: newTabFolder || null, aiType: newTabAI })
  renderTabBar()
  switchTab(tab.id)
  ntpPanel.classList.remove('visible')
  btnNewTab.classList.remove('active')

  if (newTabAI !== 'none') {
    let aiCmd
    if (newTabAI === 'claude') aiCmd = skipPerms ? 'claude --dangerously-skip-permissions' : 'claude'
    else if (newTabAI === 'codex') aiCmd = skipPerms ? 'codex --yolo' : 'codex'
    else if (newTabAI === 'gemini') aiCmd = 'gemini'

    const folder = newTabFolder
    if (folder) setSelectedFolder(folder)

    setTimeout(() => {
      if (folder) {
        api.terminal.sendInput(tab.id, `cd "${folder}"\r`)
        setTimeout(() => api.terminal.sendInput(tab.id, `${aiCmd}\r`), 400)
      } else {
        api.terminal.sendInput(tab.id, `${aiCmd}\r`)
      }
    }, 400)
  } else if (newTabFolder) {
    setSelectedFolder(newTabFolder)
    setTimeout(() => api.terminal.sendInput(tab.id, `cd "${newTabFolder}"\r`), 400)
  }
})

const pinBtn = document.getElementById('btn-pin')
pinBtn.addEventListener('click', async () => {
  isPinned = !isPinned
  api.window.setAlwaysOnTop(isPinned)
  pinBtn.classList.toggle('active', isPinned)
  document.getElementById('pin-toggle').checked = isPinned
})

// ── Settings panel ────────────────────────────────────────────────────────
const settingsPanel = document.getElementById('settings-panel')
document.getElementById('btn-settings').addEventListener('click', () => settingsPanel.classList.toggle('hidden'))
document.getElementById('settings-close').addEventListener('click', () => settingsPanel.classList.add('hidden'))

document.getElementById('opacity-slider').addEventListener('input', function () {
  document.getElementById('opacity-val').textContent = this.value + '%'
  localStorage.setItem('opacity', this.value)
  api.window.setOpacity(parseInt(this.value) / 100)
})
document.getElementById('fontsize-slider').addEventListener('input', function () { setFontSize(parseInt(this.value)) })
document.getElementById('autoscroll-toggle').addEventListener('change', e => {
  autoScroll = e.target.checked
  localStorage.setItem('autoScroll', autoScroll)
  document.getElementById('ctx-autoscroll').textContent = `Auto-scroll: ${autoScroll ? 'on' : 'off'}`
})
document.getElementById('pin-toggle').addEventListener('change', e => {
  isPinned = e.target.checked
  api.window.setAlwaysOnTop(isPinned)
  pinBtn.classList.toggle('active', isPinned)
})
document.getElementById('notify-toggle').addEventListener('change', e => {
  notificationsEnabled = e.target.checked
  localStorage.setItem('notifications', notificationsEnabled)
})
document.getElementById('flowfield-toggle').addEventListener('change', e => { setFlowField(e.target.checked) })
document.getElementById('minigame-toggle').addEventListener('change', e => { setMiniGame(e.target.checked) })
document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)))

// ── Save Context Panel ────────────────────────────────────────────────────
const savePanel = document.getElementById('save-ctx-panel')
const btnSaveCtx = document.getElementById('btn-save-ctx')

btnSaveCtx.addEventListener('click', e => {
  e.stopPropagation()
  const hidden = savePanel.classList.contains('hidden')
  if (hidden) positionPanel(savePanel, btnSaveCtx)
  else savePanel.classList.add('hidden')
  btnSaveCtx.classList.toggle('active', hidden)
})

document.addEventListener('click', e => {
  if (!document.getElementById('save-btn-wrap').contains(e.target)) {
    savePanel.classList.add('hidden')
    btnSaveCtx.classList.remove('active')
  }
})

document.getElementById('save-ctx-btn').addEventListener('click', async () => {
  const status = document.getElementById('save-ctx-status')

  if (!selectedFolder) {
    status.textContent = 'Pick a folder first (use the + tab picker)'
    status.className = 'err'
    status.classList.remove('hidden')
    return
  }

  const note = document.getElementById('save-ctx-note').value.trim()
  const tab = getActiveTab()
  const tabName = tab?.name ?? 'Unknown session'
  const now = new Date().toLocaleString()
  const excerpt = tab ? tab.buffer.slice(-4000).trim() : ''

  let md = `## Session: ${now} — ${tabName}\n\n`
  if (note) md += `### Note\n${note}\n\n`
  md += `### Terminal Output\n\`\`\`\n${excerpt}\n\`\`\``

  try {
    const saved = await api.context.save(selectedFolder, md)
    const filename = saved.split(/[\\/]/).pop()
    status.textContent = `Saved → ${filename}`
    status.className = ''
    status.classList.remove('hidden')
    setTimeout(() => status.classList.add('hidden'), 3000)
  } catch (err) {
    status.textContent = `Error: ${err.message}`
    status.className = 'err'
    status.classList.remove('hidden')
  }
})

// ── Load Context Button ───────────────────────────────────────────────────
document.getElementById('btn-load-ctx').addEventListener('click', async () => {
  const tab = getActiveTab()
  const folder = tab?.folder || selectedFolder
  if (!folder) return
  const ctx = await api.context.read(folder)
  if (!ctx) return
  if (tab.aiType !== 'none') {
    // AI session: paste the file content into the input buffer (no \r — user sends it)
    api.terminal.sendInput(tab.id, ctx)
  } else {
    // Shell session: run cat to print the file
    const safePath = folder.replace(/"/g, '\\"')
    api.terminal.sendInput(tab.id, `cat "${safePath}/AI_CONTEXT.md"\r`)
  }
  tab.term.focus()
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideCtx(); if (!findBar.classList.contains('hidden')) toggleFind() }
  if (e.ctrlKey && e.key === 'f') { e.preventDefault(); toggleFind() }
  if (e.ctrlKey && e.key === '=') { e.preventDefault(); setFontSize(fontSize + 1) }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); setFontSize(fontSize - 1) }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); setFontSize(14) }
  if (e.ctrlKey && e.key === 't') { e.preventDefault(); btnNewTab.click() }
  if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (activeTabId) closeTab(activeTabId) }
})

// ── Init ─────────────────────────────────────────────────────────────────
applyTheme(localStorage.getItem('theme') || 'purple')

// Restore persisted settings
const savedOpacity = parseInt(localStorage.getItem('opacity') || '92')
document.getElementById('opacity-slider').value = savedOpacity
document.getElementById('opacity-val').textContent = savedOpacity + '%'
api.window.setOpacity(savedOpacity / 100)

document.getElementById('fontsize-slider').value = fontSize
document.getElementById('fontsize-val').textContent = fontSize + 'px'

document.getElementById('autoscroll-toggle').checked = autoScroll
document.getElementById('ctx-autoscroll').textContent = `Auto-scroll: ${autoScroll ? 'on' : 'off'}`

document.getElementById('notify-toggle').checked = notificationsEnabled

const firstTab = createTab({ name: 'Session 1' })
renderTabBar()
switchTab(firstTab.id)

// Restore flow field state — idle-deferred so it never blocks startup
if (flowEnabled) {
  document.getElementById('flowfield-toggle').checked = true
  const start = () => setFlowField(true)
  if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(start, { timeout: 1500 })
  else setTimeout(start, 0)
}

// Restore mini game state
if (gameEnabled) {
  document.getElementById('minigame-toggle').checked = true
  setTimeout(() => setMiniGame(true), 200) // after layout settles
}
