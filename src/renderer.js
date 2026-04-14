const api = window.electronAPI

// ── State ────────────────────────────────────────────────────────────────
let fontSize = parseInt(localStorage.getItem('fontSize') || '14')
let fontFamily = localStorage.getItem('fontFamily') || 'Cascadia Code'

const FONTS = [
  'Cascadia Code', 'Cascadia Mono', 'Consolas', 'Courier New',
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Hack',
]
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

// ── Terminal Background Effects ────────────────────────────────────────────
let bgEffect = localStorage.getItem('bgEffect') || 'none'
let bgIntensity = parseInt(localStorage.getItem('bgIntensity') || '20') / 100
let bgAnimId = null
let bgW = 0, bgH = 0, bgCtx2 = null
let bgMouseX = 0, bgMouseY = 0

function getBgCanvas() { return document.getElementById('bg-canvas') }

function accentRgb() {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a78bfa'
  if (!hex.startsWith('#')) return '167,139,250'
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}
function accentRgba(a) { return `rgba(${accentRgb()},${a})` }

function bgResize() {
  const c = getBgCanvas(); if (!c) return
  const dpr = window.devicePixelRatio || 1
  bgW = c.offsetWidth; bgH = c.offsetHeight
  c.width = bgW * dpr; c.height = bgH * dpr
  bgCtx2 = c.getContext('2d'); bgCtx2.scale(dpr, dpr)
}

function stopBg() {
  if (bgAnimId) { cancelAnimationFrame(bgAnimId); bgAnimId = null }
  const c = getBgCanvas(); if (c && bgCtx2) bgCtx2.clearRect(0, 0, bgW, bgH)
  getBgCanvas()?.classList.remove('interactive')
}

// ─ Static: Dot Grid ─
function drawDots(ctx, w, h, alpha, spacing) {
  ctx.fillStyle = accentRgba(alpha * 0.9)
  for (let x = spacing; x < w; x += spacing)
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI*2); ctx.fill()
    }
}

// ─ Static: Line Grid ─
function drawLineGrid(ctx, w, h, alpha) {
  const sp = 38
  ctx.strokeStyle = accentRgba(alpha * 0.3); ctx.lineWidth = 0.5
  for (let x = 0; x < w; x += sp) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke() }
  for (let y = 0; y < h; y += sp) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke() }
  // Highlight intersections
  ctx.fillStyle = accentRgba(alpha * 0.5)
  for (let x = 0; x < w; x += sp)
    for (let y = 0; y < h; y += sp) {
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill()
    }
}

// ─ Static: Scanlines ─
function drawScanlines(ctx, w, h, alpha) {
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = accentRgba(alpha * 0.35)
    ctx.fillRect(0, y, w, 1)
  }
}

// ─ Animated: Aurora ─
let auroraT = 0
function drawAurora(ctx, w, h, alpha) {
  ctx.clearRect(0, 0, w, h)
  const bands = [
    { freq: 0.6, speed: 0.3, y: 0.25, h: 0.18, a: alpha * 0.7 },
    { freq: 0.4, speed: 0.18, y: 0.5,  h: 0.22, a: alpha * 0.5 },
    { freq: 0.8, speed: 0.45, y: 0.72, h: 0.14, a: alpha * 0.45 },
  ]
  bands.forEach(b => {
    const cy = h * (b.y + Math.sin(auroraT * b.speed) * 0.06)
    const bh = h * b.h
    for (let x = 0; x < w; x += 2) {
      const warp = Math.sin(x * b.freq * 0.012 + auroraT * b.speed * 1.5) * bh * 0.4
      const g = ctx.createLinearGradient(x, cy + warp - bh, x, cy + warp + bh)
      g.addColorStop(0, 'transparent')
      g.addColorStop(0.5, accentRgba(b.a))
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(x, cy + warp - bh, 2, bh * 2)
    }
  })
}

// ─ Animated: Starfield ─
let stars = []
function initStars() {
  stars = Array(120).fill(0).map(() => ({
    x: Math.random() * bgW, y: Math.random() * bgH,
    r: 0.3 + Math.random() * 1.4,
    speed: 0.05 + Math.random() * 0.25,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.5 + Math.random() * 1.5,
  }))
}
function drawStars(ctx, w, h, alpha, dt) {
  ctx.clearRect(0, 0, w, h)
  stars.forEach(s => {
    s.twinkle += s.twinkleSpeed * dt
    const a = alpha * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.twinkle)))
    s.x -= s.speed * dt * 20
    if (s.x < 0) { s.x = w; s.y = Math.random() * h }
    ctx.fillStyle = accentRgba(a * 0.8)
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
  })
}

// ─ Animated: Rain ─
let rainCols = []
function initRain() {
  const colW = 22
  rainCols = Array(Math.ceil(bgW / colW) + 1).fill(0).map((_, i) => ({
    x: i * colW + Math.random() * colW * 0.5,
    y: Math.random() * bgH,
    speed: 70 + Math.random() * 110,
    len: 30 + Math.random() * 80,
    alpha: 0.15 + Math.random() * 0.35,
  }))
}
function drawRain(ctx, w, h, alpha, dt) {
  ctx.clearRect(0, 0, w, h)
  rainCols.forEach(col => {
    col.y += col.speed * dt
    if (col.y - col.len > h) { col.y = -col.len * Math.random(); col.x = Math.random() * w }
    const g = ctx.createLinearGradient(col.x, col.y - col.len, col.x, col.y)
    g.addColorStop(0, 'transparent')
    g.addColorStop(1, accentRgba(col.alpha * alpha * 4))
    ctx.strokeStyle = g; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(col.x, col.y - col.len); ctx.lineTo(col.x, col.y); ctx.stroke()
  })
}

// ─ Animated: Flicker Grid ─
let flickerCells = []
let flickerT = 0
function initFlicker() {
  const sp = 32
  flickerCells = []
  for (let x = 0; x < bgW; x += sp)
    for (let y = 0; y < bgH; y += sp)
      flickerCells.push({ x, y, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 1.6, size: sp - 1 })
}
function drawFlicker(ctx, w, h, alpha, dt) {
  ctx.clearRect(0, 0, w, h)
  flickerT += dt
  flickerCells.forEach(c => {
    const a = alpha * 0.18 * (0.5 + 0.5 * Math.sin(c.phase + flickerT * c.speed))
    if (a > 0.005) {
      ctx.fillStyle = accentRgba(a)
      ctx.fillRect(c.x, c.y, c.size, c.size)
      ctx.strokeStyle = accentRgba(a * 1.8)
      ctx.lineWidth = 0.5
      ctx.strokeRect(c.x, c.y, c.size, c.size)
    }
  })
}

// ─ Interactive: Particles ─
let bgParticles = []
function initParticles() {
  bgParticles = Array(60).fill(0).map(() => ({
    x: Math.random() * bgW, y: Math.random() * bgH,
    vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
    r: 1 + Math.random() * 2.5,
    alpha: 0.15 + Math.random() * 0.35,
  }))
}
function drawParticles(ctx, w, h, alpha) {
  ctx.clearRect(0, 0, w, h)
  const rect = getBgCanvas().getBoundingClientRect()
  const mx = bgMouseX - rect.left, my = bgMouseY - rect.top
  bgParticles.forEach(p => {
    // Repel from cursor
    const dx = p.x - mx, dy = p.y - my
    const dist = Math.sqrt(dx*dx + dy*dy)
    if (dist < 100) { const f = (100 - dist) / 100 * 0.8; p.vx += dx/dist*f; p.vy += dy/dist*f }
    // Dampen and move
    p.vx *= 0.98; p.vy *= 0.98
    p.x += p.vx; p.y += p.vy
    if (p.x < 0) { p.x = 0; p.vx *= -1 }; if (p.x > w) { p.x = w; p.vx *= -1 }
    if (p.y < 0) { p.y = 0; p.vy *= -1 }; if (p.y > h) { p.y = h; p.vy *= -1 }
    // Draw
    ctx.fillStyle = accentRgba(p.alpha * alpha * 4)
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill()
    // Connect nearby particles
    bgParticles.forEach(q => {
      if (q === p) return
      const dx2 = q.x - p.x, dy2 = q.y - p.y, d2 = Math.sqrt(dx2*dx2+dy2*dy2)
      if (d2 < 90) {
        ctx.strokeStyle = accentRgba(alpha * 0.15 * (1 - d2/90))
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke()
      }
    })
  })
}

// ─ Animated: Hacker Binary Rain ─
const HACKER_FONT_SIZE = 13
const HACKER_COL_W = HACKER_FONT_SIZE + 3
let hackerCols = []
function initHacker() {
  hackerCols = Array(Math.ceil(bgW / HACKER_COL_W) + 2).fill(0).map((_, i) => ({
    x: i * HACKER_COL_W + HACKER_COL_W / 2,
    y: Math.random() * bgH * -1.5,
    speed: 45 + Math.random() * 90,
    length: 6 + Math.floor(Math.random() * 14),
    chars: [],
    swapTimer: 0,
    swapInterval: 0.06 + Math.random() * 0.18,
  }))
  hackerCols.forEach(col => { col.chars = Array(col.length).fill(0).map(() => Math.random() < 0.5 ? '0' : '1') })
}
function drawHacker(ctx, w, h, alpha, dt) {
  ctx.clearRect(0, 0, w, h)
  ctx.font = `${HACKER_FONT_SIZE}px "Cascadia Code","Fira Code",Consolas,monospace`
  ctx.textAlign = 'center'
  hackerCols.forEach(col => {
    col.y += col.speed * dt
    col.swapTimer += dt
    if (col.swapTimer >= col.swapInterval) {
      col.swapTimer = 0
      col.chars[Math.floor(Math.random() * col.chars.length)] = Math.random() < 0.5 ? '0' : '1'
    }
    if (col.y - col.length * HACKER_FONT_SIZE > h) {
      col.y = -HACKER_FONT_SIZE * (2 + Math.random() * 8)
      col.speed = 45 + Math.random() * 90
      col.length = 6 + Math.floor(Math.random() * 14)
      col.chars = Array(col.length).fill(0).map(() => Math.random() < 0.5 ? '0' : '1')
    }
    for (let i = 0; i < col.length; i++) {
      const cy = col.y - (col.length - 1 - i) * HACKER_FONT_SIZE
      if (cy < -HACKER_FONT_SIZE || cy > h + HACKER_FONT_SIZE) continue
      if (i === col.length - 1) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.95})`
      } else {
        const t = i / (col.length - 1)
        ctx.fillStyle = accentRgba(alpha * t * 0.75)
      }
      ctx.fillText(col.chars[i], col.x, cy)
    }
  })
}

// ─ Main animation loop ─
let bgLastTs = 0
function bgLoop(ts) {
  const dt = Math.min((ts - bgLastTs) / 1000, 0.05); bgLastTs = ts
  if (!bgCtx2) return
  switch(bgEffect) {
    case 'aurora':    auroraT += dt; drawAurora(bgCtx2, bgW, bgH, bgIntensity); break
    case 'stars':     drawStars(bgCtx2, bgW, bgH, bgIntensity, dt); break
    case 'rain':      drawRain(bgCtx2, bgW, bgH, bgIntensity, dt); break
    case 'flicker':   drawFlicker(bgCtx2, bgW, bgH, bgIntensity, dt); break
    case 'particles': drawParticles(bgCtx2, bgW, bgH, bgIntensity); break
    case 'hacker':    drawHacker(bgCtx2, bgW, bgH, bgIntensity, dt); break
    default: return
  }
  bgAnimId = requestAnimationFrame(bgLoop)
}

function startBg(effect) {
  stopBg()
  bgEffect = effect
  localStorage.setItem('bgEffect', effect)
  const c = getBgCanvas(); if (!c) return
  c.classList.remove('hidden')
  c.style.opacity = bgIntensity
  c.classList.toggle('interactive', effect === 'particles')
  if (effect === 'none') { c.classList.add('hidden'); return }
  bgResize()
  // Static effects — draw once
  if (effect === 'dots') { drawDots(bgCtx2, bgW, bgH, bgIntensity, 28); return }
  if (effect === 'grid') { drawLineGrid(bgCtx2, bgW, bgH, bgIntensity); return }
  if (effect === 'scanlines') { drawScanlines(bgCtx2, bgW, bgH, bgIntensity); return }
  // Animated
  if (effect === 'stars') initStars()
  if (effect === 'rain') initRain()
  if (effect === 'flicker') initFlicker()
  if (effect === 'particles') initParticles()
  if (effect === 'hacker') initHacker()
  bgLastTs = performance.now()
  bgAnimId = requestAnimationFrame(bgLoop)
}

// ─ Preview renderer for settings cards ─
function renderBgPreview(canvas, effect) {
  canvas.width = canvas.offsetWidth || 130
  canvas.height = canvas.offsetHeight || 82
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  // Dark background
  ctx.fillStyle = 'rgba(10,8,20,1)'; ctx.fillRect(0, 0, w, h)
  const alpha = 0.7
  switch(effect) {
    case 'dots': drawDots(ctx, w, h, alpha, 18); break
    case 'grid': drawLineGrid(ctx, w, h, alpha * 0.6); break
    case 'scanlines': drawScanlines(ctx, w, h, alpha); break
    case 'rain':
      for (let i = 0; i < 9; i++) {
        const x = 8 + (i / 9) * w, y2 = 15 + Math.random() * h * 0.7, y1 = y2 - 15 - Math.random() * 30
        const g = ctx.createLinearGradient(x, y1, x, y2)
        g.addColorStop(0, 'transparent'); g.addColorStop(1, accentRgba(0.45))
        ctx.strokeStyle = g; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke()
      }
      break
    case 'aurora':
      [0.25, 0.52, 0.78].forEach((yp, i) => {
        const cy = h * yp, bh = h * 0.14
        const g = ctx.createLinearGradient(0, cy - bh, 0, cy + bh)
        g.addColorStop(0,'transparent'); g.addColorStop(0.5, accentRgba(0.35 - i*0.05)); g.addColorStop(1,'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, cy - bh, w, bh * 2)
      })
      break
    case 'stars':
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = accentRgba(0.15 + Math.random() * 0.55)
        ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 0.4+Math.random()*1.2, 0, Math.PI*2); ctx.fill()
      }
      break
    case 'flicker': {
      const sp = 14
      for (let x = 0; x < w; x += sp) for (let y = 0; y < h; y += sp) {
        const a = Math.random() * 0.22
        if (a > 0.06) { ctx.fillStyle = accentRgba(a); ctx.fillRect(x,y,sp-1,sp-1) }
        ctx.strokeStyle = accentRgba(0.06); ctx.lineWidth = 0.4; ctx.strokeRect(x,y,sp-1,sp-1)
      }
      break
    }
    case 'particles':
      for (let i = 0; i < 12; i++) {
        const px = Math.random()*w, py = Math.random()*h, pr = 1+Math.random()*2.5
        ctx.fillStyle = accentRgba(0.25+Math.random()*0.4)
        ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fill()
      }
      // draw some connection lines
      for (let i = 0; i < 6; i++) {
        const x1=Math.random()*w,y1=Math.random()*h,x2=x1+(Math.random()-0.5)*50,y2=y1+(Math.random()-0.5)*50
        ctx.strokeStyle = accentRgba(0.12); ctx.lineWidth=0.5
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
      }
      break
    case 'hacker': {
      const fs = 9
      ctx.font = `${fs}px "Cascadia Code",Consolas,monospace`
      ctx.textAlign = 'center'
      const cw = fs + 3
      for (let x = cw / 2; x < w; x += cw) {
        const len = 4 + Math.floor(Math.random() * 7)
        const baseY = 6 + Math.random() * (h - len * fs)
        for (let i = 0; i < len; i++) {
          const cy = baseY + i * fs
          if (cy > h) break
          if (i === len - 1) {
            ctx.fillStyle = `rgba(255,255,255,0.9)`
          } else {
            ctx.fillStyle = accentRgba((i / (len - 1)) * 0.65)
          }
          ctx.fillText(Math.random() < 0.5 ? '0' : '1', x, cy)
        }
      }
      break
    }
  }
}

function refreshBgPreviews() {
  document.querySelectorAll('[data-preview]').forEach(canvas => {
    renderBgPreview(canvas, canvas.dataset.preview)
  })
}

// Wire up background settings cards
document.querySelectorAll('.bg-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.bg-card').forEach(c => c.classList.remove('active'))
    card.classList.add('active')
    startBg(card.dataset.bg)
  })
})

document.getElementById('bg-intensity-slider').addEventListener('input', function () {
  bgIntensity = parseInt(this.value) / 100
  localStorage.setItem('bgIntensity', this.value)
  document.getElementById('bg-intensity-val').textContent = this.value + '%'
  const c = getBgCanvas()
  if (c && bgEffect !== 'none') {
    // Redraw static effects at new intensity
    if (['dots','grid','scanlines'].includes(bgEffect)) {
      bgCtx2.clearRect(0, 0, bgW, bgH)
      if (bgEffect === 'dots') drawDots(bgCtx2, bgW, bgH, bgIntensity, 28)
      if (bgEffect === 'grid') drawLineGrid(bgCtx2, bgW, bgH, bgIntensity)
      if (bgEffect === 'scanlines') drawScanlines(bgCtx2, bgW, bgH, bgIntensity)
    }
  }
})

// Track mouse for particles
document.addEventListener('mousemove', e => { bgMouseX = e.clientX; bgMouseY = e.clientY })

// Re-render previews when Background section is opened
document.querySelectorAll('.snav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.section === 'background') setTimeout(refreshBgPreviews, 50)
  })
})

window.addEventListener('resize', () => {
  if (bgEffect !== 'none' && !['dots','grid','scanlines'].includes(bgEffect)) {
    bgResize()
    if (bgEffect === 'stars') initStars()
    if (bgEffect === 'rain') initRain()
    if (bgEffect === 'flicker') initFlicker()
    if (bgEffect === 'particles') initParticles()
  }
})

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
  ball:      { x: 0, y: 0, vx: 0, vy: 0, r: 8 },
  paddle:    { x: 0, w: 90, h: 10 },
  hearts:    3,
  damageAlpha: 0,
  gameOver:  false,
  gameOverTimer: 0,
  speed:     1,
  baseSpeed: parseFloat(localStorage.getItem('ballSpeed') || '3.6'),
  mouseX:    -1,
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
  const spd = (G.baseSpeed + G.speed * 0.4)
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
    fontFamily: `"${fontFamily}",Consolas,monospace`,
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
  const tab = { id, name, term, fitAddon, searchAddon, el, buffer: '', notifyTimer: null, startTime, isSplitTab, folder: opts.folder ?? null, aiType: opts.aiType ?? 'none', shellType: opts.shellType ?? 'powershell', color, createdAt: Date.now(), history: [], cmdLine: '' }
  tabs.push(tab)

  term.onData(data => {
    if (data === '\r') {
      const cmd = tab.cmdLine.trim()
      if (cmd) tab.history.push({ cmd, time: Date.now() })
      tab.cmdLine = ''
    } else if (data === '\x7f') {
      tab.cmdLine = tab.cmdLine.slice(0, -1)
    } else if (data.length === 1 && data.charCodeAt(0) >= 32) {
      tab.cmdLine += data
    } else if (data.length > 1) {
      tab.cmdLine += data.replace(/[^\x20-\x7e]/g, '')
    }
    api.terminal.sendInput(id, data)
  })

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

    const shellBadge = document.createElement('span')
    shellBadge.className = 'tab-shell-badge'
    const shellLabels = { powershell: 'PS', cmd: 'CMD', gitbash: 'BASH', wsl: 'WSL' }
    shellBadge.textContent = shellLabels[tab.shellType] ?? 'PS'
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
    const ageBadge = document.createElement('span')
    ageBadge.className = 'tab-age-badge'
    ageBadge.textContent = formatAge(tab.createdAt)

    el.appendChild(nameEl)
    if (!tab.isSplitTab) el.appendChild(shellBadge)
    el.appendChild(ageBadge)

    if (mainTabs.length > 1) {
      const x = document.createElement('button')
      x.className = 'tab-close'
      x.textContent = '✕'
      x.addEventListener('click', async e => {
        e.stopPropagation()
        const ok = await showConfirm(`Close "${tab.name}"?`)
        if (ok) closeTab(tab.id)
      })
      el.appendChild(x)
    }

    el.addEventListener('click', () => switchTab(tab.id))

    // Drag reorder
    el.addEventListener('dragstart', e => {
      dragSrcTabId = tab.id
      e.dataTransfer.effectAllowed = 'move'
      const ghost = new Image()
      ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      e.dataTransfer.setDragImage(ghost, 0, 0)
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
  tab.el.classList.remove('tab-entering')
  void tab.el.offsetWidth // force reflow to restart animation
  tab.el.classList.add('tab-entering')
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
let skeletonGone = false
api.terminal.onData((tabId, data) => {
  if (!skeletonGone) {
    skeletonGone = true
    const sk = document.getElementById('skeleton')
    sk.classList.add('fade-out')
    setTimeout(() => sk.remove(), 370)
  }
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

// ── Font family ───────────────────────────────────────────────────────────
function setFontFamily(family) {
  fontFamily = family
  localStorage.setItem('fontFamily', family)
  const full = `"${family}",Consolas,monospace`
  tabs.forEach(t => { t.term.options.fontFamily = full; t.fitAddon.fit() })
  const preview = document.getElementById('font-preview')
  if (preview) preview.style.fontFamily = full
  document.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.font === family))
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatAge(createdAt) {
  const s = Math.floor((Date.now() - createdAt) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function formatHistoryTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Refresh age badges every 30s without full re-render
setInterval(() => {
  document.querySelectorAll('.tab-age-badge').forEach(badge => {
    const tabEl = badge.closest('.tab-item')
    if (!tabEl) return
    const tab = tabs.find(t => t.id === tabEl.dataset.tabId)
    if (tab) badge.textContent = formatAge(tab.createdAt)
  })
}, 30000)

// ── Neon flicker ──────────────────────────────────────────────────────────
function scheduleFlicker() {
  setTimeout(() => {
    const titleEl = document.getElementById('app-title')
    titleEl.classList.remove('flickering')
    void titleEl.offsetWidth
    titleEl.classList.add('flickering')
    titleEl.addEventListener('animationend', () => {
      titleEl.classList.remove('flickering')
      scheduleFlicker()
    }, { once: true })
  }, 10000 + Math.random() * 25000)
}
scheduleFlicker()

// ── CPU heartbeat ─────────────────────────────────────────────────────────
async function pollCpu() {
  try {
    const cpu = await api.system.getCpuPercent()
    const speed = cpu > 75 ? '0.5s' : cpu > 45 ? '1s' : cpu > 20 ? '1.8s' : '2.5s'
    document.getElementById('status-dot').style.setProperty('--pulse-speed', speed)
  } catch (_) {}
}
pollCpu()
setInterval(pollCpu, 4000)

// ── History list (inside cmd-panel) ───────────────────────────────────────
function renderHistoryList(query) {
  const tab = tabs.find(t => t.id === activeTabId)
  const list = document.getElementById('history-list')
  if (!tab || tab.history.length === 0) {
    list.innerHTML = '<div class="history-empty">No commands recorded yet.<br>Start typing in the terminal.</div>'
    return
  }
  const q = (query || '').toLowerCase()
  const items = q ? tab.history.filter(h => h.cmd.toLowerCase().includes(q)) : tab.history
  list.innerHTML = ''
  ;[...items].reverse().forEach(h => {
    const el = document.createElement('div')
    el.className = 'history-item'

    const dot = document.createElement('span')
    dot.className = 'history-dot'

    const body = document.createElement('div')
    body.className = 'history-item-body'

    const timeEl = document.createElement('span')
    timeEl.className = 'history-time'
    timeEl.textContent = formatHistoryTime(h.time)

    const cmdEl = document.createElement('span')
    cmdEl.className = 'history-cmd'
    cmdEl.textContent = h.cmd

    body.appendChild(timeEl)
    body.appendChild(cmdEl)
    el.appendChild(dot)
    el.appendChild(body)

    el.addEventListener('click', () => {
      const activeTab = tabs.find(t => t.id === activeTabId)
      if (activeTab) { activeTab.term.paste(h.cmd); activeTab.term.focus() }
      closeCmdPanel()
    })
    list.appendChild(el)
  })
}

document.getElementById('history-search').addEventListener('input', function () {
  renderHistoryList(this.value)
})

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
  ctxMenu.classList.remove('hidden')
  const mw = ctxMenu.offsetWidth || 170
  const mh = ctxMenu.offsetHeight || 200
  const x = (e.clientX + mw > window.innerWidth)  ? e.clientX - mw : e.clientX
  const y = (e.clientY + mh > window.innerHeight) ? e.clientY - mh : e.clientY
  ctxMenu.style.left = Math.max(0, x) + 'px'
  ctxMenu.style.top  = Math.max(0, y) + 'px'
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
document.getElementById('ctx-split').addEventListener('click', () => { toggleSplit(); hideCtx() })
document.getElementById('ctx-close-tab').addEventListener('click', async () => {
  hideCtx()
  if (!activeTabId) return
  const tab = tabs.find(t => t.id === activeTabId)
  if (!tab) return
  const ok = await showConfirm(`Close "${tab.name}"?`)
  if (ok) closeTab(activeTabId)
})

// ── Window controls ───────────────────────────────────────────────────────
document.getElementById('btn-minimize').addEventListener('click', () => api.window.minimize())
document.getElementById('btn-maximize').addEventListener('click', () => api.window.maximize())
document.getElementById('btn-close').addEventListener('click', async () => {
  const ok = await showConfirm('Close Holy CLI?')
  if (ok) api.window.forceClose()
})

api.window.onCloseRequested(() => {
  showConfirm('Close Holy CLI?').then(ok => { if (ok) api.window.forceClose() })
})

// ── Command panel ─────────────────────────────────────────────────────────
const cmdPanel = document.getElementById('cmd-panel')
const btnCommand = document.getElementById('btn-command')
let activeCmdTab = 'search'

function openCmdPanel(tab) {
  const btnRect = btnCommand.getBoundingClientRect()
  cmdPanel.style.top = (btnRect.bottom + 6) + 'px'
  cmdPanel.style.right = (window.innerWidth - btnRect.right) + 'px'
  cmdPanel.style.left = 'auto'
  cmdPanel.classList.remove('hidden')
  btnCommand.classList.add('active')
  if (tab) switchCmdTab(tab)

  // Auto-focus the relevant input
  requestAnimationFrame(() => {
    if (activeCmdTab === 'search') document.getElementById('cmd-find-input')?.focus()
    else if (activeCmdTab === 'history') { renderHistoryList(''); document.getElementById('history-search')?.focus() }
    else if (activeCmdTab === 'palette') { renderPalette(''); document.getElementById('palette-search')?.focus() }
  })
}

function closeCmdPanel() {
  cmdPanel.classList.add('hidden')
  btnCommand.classList.remove('active')
  // Clear search decorations when closing
  const cmdFindInput = document.getElementById('cmd-find-input')
  if (cmdFindInput?.value) {
    getSearchAddon()?.clearDecorations()
    cmdFindInput.value = ''
  }
}

function switchCmdTab(tab) {
  if (tab === 'settings') {
    closeCmdPanel()
    openSettings()
    return
  }
  activeCmdTab = tab
  document.querySelectorAll('.cmd-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('.cmd-page').forEach(p => p.classList.toggle('active', p.dataset.tab === tab))
  // refresh content
  if (tab === 'history') { renderHistoryList(''); document.getElementById('history-search').value = ''; document.getElementById('history-search').focus() }
  else if (tab === 'palette') { renderPalette(''); document.getElementById('palette-search').focus() }
  else if (tab === 'search') document.getElementById('cmd-find-input').focus()
}

btnCommand.addEventListener('click', e => {
  e.stopPropagation()
  if (cmdPanel.classList.contains('hidden')) openCmdPanel(activeCmdTab)
  else closeCmdPanel()
})

document.querySelectorAll('.cmd-tab').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    switchCmdTab(btn.dataset.tab)
  })
})

document.addEventListener('click', e => {
  if (!cmdPanel.contains(e.target) && e.target !== btnCommand) closeCmdPanel()
})

// cmd-panel inline search
const cmdFindInput = document.getElementById('cmd-find-input')
cmdFindInput.addEventListener('input', () => {
  cmdFindInput.value
    ? getSearchAddon()?.findNext(cmdFindInput.value, { incremental: true })
    : getSearchAddon()?.clearDecorations()
})
cmdFindInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') getSearchAddon()?.findNext(cmdFindInput.value)
  if (e.key === 'Escape') { getSearchAddon()?.clearDecorations(); cmdFindInput.value = ''; closeCmdPanel() }
})
document.getElementById('cmd-find-next').addEventListener('click', () => getSearchAddon()?.findNext(cmdFindInput.value, { incremental: false }))
document.getElementById('cmd-find-prev').addEventListener('click', () => getSearchAddon()?.findPrevious(cmdFindInput.value))

// ── Command palette ───────────────────────────────────────────────────────
const PALETTE_ACTIONS = [
  { label: 'New Tab',              shortcut: 'Ctrl+T',     svg: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',                                                           action: () => { closeCmdPanel(); document.getElementById('btn-new-tab').click() } },
  { label: 'Close Tab',            shortcut: 'Ctrl+W',     svg: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',                                                       action: () => { closeCmdPanel(); if (activeTabId) { const t = tabs.find(x => x.id === activeTabId); if (t) showConfirm(`Close "${t.name}"?`).then(ok => { if (ok) closeTab(activeTabId) }) } } },
  { label: 'Split / Unsplit View', shortcut: '',            svg: '<rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v18" stroke="currentColor" stroke-width="1.5"/>', action: () => { closeCmdPanel(); toggleSplit() } },
  { label: 'Find in Terminal',     shortcut: 'Ctrl+F',     svg: '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',                           action: () => { closeCmdPanel(); switchCmdTab('search'); openCmdPanel('search') } },
  { label: 'Clear Terminal',       shortcut: '',            svg: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',                  action: () => { closeCmdPanel(); getActiveTab()?.term.clear() } },
  { label: 'Open Settings',        shortcut: 'Ctrl+,',     svg: '<line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="6" r="2.5" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="12" r="2.5" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="18" r="2.5" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/>',  action: () => { closeCmdPanel(); openSettings() } },
  { label: 'Toggle Mini Game',     shortcut: 'Ctrl+⇧+G',  svg: '<rect x="2" y="6" width="20" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h4m-2-2v4M16 12h.01M18 12h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',  action: () => { closeCmdPanel(); const t = document.getElementById('minigame-toggle'); t.checked = !t.checked; setMiniGame(t.checked) } },
  { label: 'Increase Font Size',   shortcut: 'Ctrl++',     svg: '<path d="M4 20L12 4l8 16M7 14h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 3v6m-3-3h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', action: () => setFontSize(fontSize + 1) },
  { label: 'Decrease Font Size',   shortcut: 'Ctrl+-',     svg: '<path d="M4 20L12 4l8 16M7 14h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',      action: () => setFontSize(fontSize - 1) },
  { label: 'Reset Font Size',      shortcut: 'Ctrl+0',     svg: '<path d="M4 20L12 4l8 16M7 14h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',                               action: () => setFontSize(14) },
]

function renderPalette(query) {
  const list = document.getElementById('palette-list')
  const q = (query || '').toLowerCase()
  const filtered = q ? PALETTE_ACTIONS.filter(a => a.label.toLowerCase().includes(q)) : PALETTE_ACTIONS
  if (filtered.length === 0) {
    list.innerHTML = '<div class="palette-empty">No matching actions</div>'
    return
  }
  list.innerHTML = ''
  filtered.forEach((action, i) => {
    const el = document.createElement('div')
    el.className = 'palette-item' + (i === 0 ? ' focused' : '')
    el.innerHTML = `
      <div class="palette-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">${action.svg}</svg>
      </div>
      <span class="palette-label">${action.label}</span>
      ${action.shortcut ? `<span class="palette-shortcut">${action.shortcut}</span>` : ''}
    `
    el.addEventListener('click', () => action.action())
    list.appendChild(el)
  })
}

document.getElementById('palette-search').addEventListener('input', function () {
  renderPalette(this.value)
})
document.getElementById('palette-search').addEventListener('keydown', e => {
  const items = [...document.querySelectorAll('.palette-item')]
  if (!items.length) return
  const focused = items.findIndex(i => i.classList.contains('focused'))
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const next = (focused + 1) % items.length
    items.forEach((el, i) => el.classList.toggle('focused', i === next))
    items[next].scrollIntoView({ block: 'nearest' })
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = (focused - 1 + items.length) % items.length
    items.forEach((el, i) => el.classList.toggle('focused', i === prev))
    items[prev].scrollIntoView({ block: 'nearest' })
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const focusedItem = items[focused]
    if (focusedItem) focusedItem.click()
  }
})

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

// ── Custom confirm dialog ─────────────────────────────────────────────────
function showConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirm-overlay')
    document.getElementById('confirm-msg').textContent = message
    overlay.classList.remove('hidden')

    const okBtn = document.getElementById('confirm-ok-btn')
    const cancelBtn = document.getElementById('confirm-cancel-btn')

    const done = result => {
      overlay.classList.add('hidden')
      okBtn.removeEventListener('click', onOk)
      cancelBtn.removeEventListener('click', onCancel)
      document.removeEventListener('keydown', onKey)
      resolve(result)
    }
    const onOk = () => done(true)
    const onCancel = () => done(false)
    const onKey = e => { if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false) }

    okBtn.addEventListener('click', onOk)
    cancelBtn.addEventListener('click', onCancel)
    document.addEventListener('keydown', onKey)
  })
}

// ── Settings panel ────────────────────────────────────────────────────────
const settingsPanel = document.getElementById('settings-panel')
let settingsCloseTimer = null

function openSettings() {
  if (settingsCloseTimer) { clearTimeout(settingsCloseTimer); settingsCloseTimer = null }
  settingsPanel.classList.remove('closing', 'hidden')
}

function closeSettings() {
  if (settingsPanel.classList.contains('hidden')) return
  settingsPanel.classList.add('closing')
  settingsCloseTimer = setTimeout(() => {
    settingsPanel.classList.remove('closing')
    settingsPanel.classList.add('hidden')
    settingsCloseTimer = null
  }, 200)
}

document.getElementById('settings-close').addEventListener('click', closeSettings)
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !settingsPanel.classList.contains('hidden')) closeSettings() })

const SECTION_LABELS = { appearance: 'Appearance', behavior: 'Behavior', background: 'Background', extras: 'Extras' }

function movePill(btn) {
  const pill = document.getElementById('snav-pill')
  const nav  = document.getElementById('settings-nav')
  const nr   = nav.getBoundingClientRect()
  const br   = btn.getBoundingClientRect()
  pill.style.transform = `translateY(${br.top - nr.top}px)`
  pill.style.height    = br.height + 'px'
}

document.querySelectorAll('.snav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.snav-item').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.settings-page').forEach(p => p.classList.remove('active'))
    btn.classList.add('active')
    document.querySelector(`.settings-page[data-section="${btn.dataset.section}"]`).classList.add('active')
    document.getElementById('settings-page-title').textContent = SECTION_LABELS[btn.dataset.section] ?? btn.dataset.section
    movePill(btn)
  })
})

document.getElementById('opacity-slider').addEventListener('input', function () {
  document.getElementById('opacity-val').textContent = this.value + '%'
  localStorage.setItem('opacity', this.value)
  api.window.setOpacity(parseInt(this.value) / 100)
})
document.getElementById('fontsize-slider').addEventListener('input', function () {
  setFontSize(parseInt(this.value))
  const preview = document.getElementById('font-preview')
  preview.style.fontSize = this.value + 'px'
  preview.style.fontFamily = `"${fontFamily}",Consolas,monospace`
})
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
document.getElementById('ball-speed-slider').addEventListener('input', function () {
  const val = parseFloat(this.value)
  G.baseSpeed = val
  localStorage.setItem('ballSpeed', val)
  document.getElementById('ball-speed-val').textContent = val
})
document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)))

// ── Save Context (inside cmd-panel Save tab) ──────────────────────────────

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

// ── Load Context Button (inside AI ctx panel) ─────────────────────────────
document.getElementById('save-ctx-load-btn').addEventListener('click', async () => {
  const tab = getActiveTab()
  const folder = tab?.folder || selectedFolder
  const status = document.getElementById('save-ctx-status')
  if (!folder) {
    status.textContent = 'Pick a folder first (use the + tab picker)'
    status.className = 'err'; status.classList.remove('hidden'); return
  }
  const ctx = await api.context.read(folder)
  if (!ctx) {
    status.textContent = 'No AI_CONTEXT.md found in this folder'
    status.className = 'err'; status.classList.remove('hidden'); return
  }
  if (tab.aiType !== 'none') {
    api.terminal.sendInput(tab.id, ctx)
  } else {
    const safePath = folder.replace(/"/g, '\\"')
    api.terminal.sendInput(tab.id, `cat "${safePath}/AI_CONTEXT.md"\r`)
  }
  tab.term.focus()
  closeCmdPanel()
})

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideCtx(); if (!findBar.classList.contains('hidden')) toggleFind(); closeCmdPanel() }
  if (e.ctrlKey && e.key === 'k') { e.preventDefault(); cmdPanel.classList.contains('hidden') ? openCmdPanel(activeCmdTab) : closeCmdPanel() }
  if (e.ctrlKey && e.key === ',') { e.preventDefault(); openSettings() }
  if (e.ctrlKey && e.key === 'f') { e.preventDefault(); toggleFind() }
  if (e.ctrlKey && e.key === '=') { e.preventDefault(); setFontSize(fontSize + 1) }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); setFontSize(fontSize - 1) }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); setFontSize(14) }
  if (e.ctrlKey && e.key === 't') { e.preventDefault(); btnNewTab.click() }
  if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (activeTabId) { const t = tabs.find(x => x.id === activeTabId); if (t) showConfirm(`Close "${t.name}"?`).then(ok => { if (ok) closeTab(activeTabId) }) } }
  if (e.ctrlKey && e.shiftKey && e.key === 'G') { e.preventDefault(); const tog = document.getElementById('minigame-toggle'); tog.checked = !tog.checked; setMiniGame(tog.checked) }
})

// ── Init ─────────────────────────────────────────────────────────────────
applyTheme(localStorage.getItem('theme') || 'purple')

// Slider fill — fills track up to thumb in accent color
function updateSliderFill(el) {
  const min = parseFloat(el.min) || 0
  const max = parseFloat(el.max) || 100
  const pct = ((parseFloat(el.value) - min) / (max - min)) * 100
  el.style.background = `linear-gradient(to right, var(--accent) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`
}
document.querySelectorAll('input[type="range"]').forEach(el => {
  updateSliderFill(el)
  el.addEventListener('input', () => updateSliderFill(el))
})

// Init pill position on the currently active nav item
requestAnimationFrame(() => {
  const activeNav = document.querySelector('.snav-item.active')
  if (activeNav) movePill(activeNav)
})

// Restore persisted settings
const savedOpacity = parseInt(localStorage.getItem('opacity') || '92')
document.getElementById('opacity-slider').value = savedOpacity
document.getElementById('opacity-val').textContent = savedOpacity + '%'
api.window.setOpacity(savedOpacity / 100)
updateSliderFill(document.getElementById('opacity-slider'))

// Build font family buttons
document.fonts.ready.then(() => {
  const fontButtonsEl = document.getElementById('font-buttons')
  FONTS.forEach(f => {
    const btn = document.createElement('button')
    btn.className = 'font-btn'
    btn.dataset.font = f
    btn.textContent = f
    btn.style.fontFamily = `"${f}",monospace`
    if (!document.fonts.check(`12px "${f}"`)) btn.classList.add('unavailable')
    btn.addEventListener('click', () => { if (!btn.classList.contains('unavailable')) setFontFamily(f) })
    fontButtonsEl.appendChild(btn)
  })
  setFontFamily(fontFamily)
})

document.getElementById('fontsize-slider').value = fontSize
document.getElementById('fontsize-val').textContent = fontSize + 'px'
document.getElementById('font-preview').style.fontSize = fontSize + 'px'
document.getElementById('font-preview').style.fontFamily = `"${fontFamily}",Consolas,monospace`

const savedBallSpeed = parseFloat(localStorage.getItem('ballSpeed') || '3.6')
document.getElementById('ball-speed-slider').value = savedBallSpeed
document.getElementById('ball-speed-val').textContent = savedBallSpeed

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

// Restore background effect
const savedBgIntensity = parseInt(localStorage.getItem('bgIntensity') || '20')
document.getElementById('bg-intensity-slider').value = savedBgIntensity
document.getElementById('bg-intensity-val').textContent = savedBgIntensity + '%'
updateSliderFill(document.getElementById('bg-intensity-slider'))

if (bgEffect !== 'none') {
  document.querySelector(`.bg-card[data-bg="${bgEffect}"]`)?.classList.add('active')
  document.querySelector('.bg-card[data-bg="none"]')?.classList.remove('active')
  setTimeout(() => startBg(bgEffect), 300)
}
