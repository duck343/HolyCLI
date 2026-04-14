const api = window.electronAPI

const termEl = document.getElementById('terminal')
let fontSize = 14
let autoScroll = true
let isPinned = false

const term = new Terminal({
  theme: {
    background: 'transparent',
    foreground: '#e2e0f0',
    cursor: '#a78bfa',
    cursorAccent: '#0a0814',
    selectionBackground: 'rgba(167, 139, 250, 0.3)',
    black:   '#1a1730', red:     '#f87171', green:  '#4ade80', yellow: '#facc15',
    blue:    '#60a5fa', magenta: '#a78bfa', cyan:   '#34d399', white:  '#e2e0f0',
    brightBlack:   '#3d3660', brightRed:     '#fca5a5', brightGreen:  '#86efac',
    brightYellow:  '#fde047', brightBlue:    '#93c5fd', brightMagenta:'#c4b5fd',
    brightCyan:    '#6ee7b7', brightWhite:   '#f0eeff',
  },
  fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Consolas, monospace',
  fontSize,
  lineHeight: 1.4,
  letterSpacing: 0.3,
  cursorBlink: true,
  cursorStyle: 'bar',
  scrollback: 5000,
  allowTransparency: true,
  macOptionIsMeta: true,
})

const fitAddon = new FitAddon.FitAddon()
const searchAddon = new SearchAddon.SearchAddon()
const webLinksAddon = new WebLinksAddon.WebLinksAddon()

term.loadAddon(fitAddon)
term.loadAddon(searchAddon)
term.loadAddon(webLinksAddon)
term.open(termEl)
fitAddon.fit()

term.onData((data) => api.terminal.sendInput(data))

api.terminal.onData((data) => {
  term.write(data)
  if (autoScroll) term.scrollToBottom()
})

api.terminal.onExit(() => {
  term.write('\r\n\x1b[33m[Session ended]\x1b[0m\r\n')
})

window.addEventListener('resize', () => {
  fitAddon.fit()
  api.terminal.resize(term.cols, term.rows)
})

const ro = new ResizeObserver(() => {
  fitAddon.fit()
  api.terminal.resize(term.cols, term.rows)
})
ro.observe(termEl)

const fontDisplay = document.getElementById('font-size-display')
const fontsizeSlider = document.getElementById('fontsize-slider')

function setFontSize(size) {
  fontSize = Math.min(24, Math.max(10, size))
  term.options.fontSize = fontSize
  fontDisplay.textContent = fontSize
  fontsizeSlider.value = fontSize
  document.getElementById('fontsize-val').textContent = fontSize + 'px'
  fitAddon.fit()
  api.terminal.resize(term.cols, term.rows)
}

document.getElementById('btn-font-up').addEventListener('click', () => setFontSize(fontSize + 1))
document.getElementById('btn-font-down').addEventListener('click', () => setFontSize(fontSize - 1))

document.getElementById('btn-minimize').addEventListener('click', () => api.window.minimize())
document.getElementById('btn-maximize').addEventListener('click', () => api.window.maximize())
document.getElementById('btn-close').addEventListener('click', () => api.window.close())

const pinBtn = document.getElementById('btn-pin')
pinBtn.addEventListener('click', async () => {
  isPinned = !isPinned
  api.window.setAlwaysOnTop(isPinned)
  pinBtn.classList.toggle('active', isPinned)
  document.getElementById('pin-toggle').checked = isPinned
})

const settingsPanel = document.getElementById('settings-panel')
document.getElementById('btn-settings').addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden')
})
document.getElementById('settings-close').addEventListener('click', () => {
  settingsPanel.classList.add('hidden')
})

const opacitySlider = document.getElementById('opacity-slider')
const opacityVal = document.getElementById('opacity-val')
opacitySlider.addEventListener('input', () => {
  const v = parseInt(opacitySlider.value)
  opacityVal.textContent = v + '%'
  api.window.setOpacity(v / 100)
})

fontsizeSlider.addEventListener('input', () => setFontSize(parseInt(fontsizeSlider.value)))

document.getElementById('autoscroll-toggle').addEventListener('change', (e) => {
  autoScroll = e.target.checked
  document.getElementById('ctx-autoscroll').textContent = `Auto-scroll: ${autoScroll ? 'on' : 'off'}`
})

document.getElementById('pin-toggle').addEventListener('change', (e) => {
  isPinned = e.target.checked
  api.window.setAlwaysOnTop(isPinned)
  pinBtn.classList.toggle('active', isPinned)
})

const findBar = document.getElementById('find-bar')
const findInput = document.getElementById('find-input')
const btnFind = document.getElementById('btn-find')

btnFind.addEventListener('click', () => {
  findBar.classList.toggle('hidden')
  if (!findBar.classList.contains('hidden')) findInput.focus()
})

document.getElementById('find-close').addEventListener('click', () => {
  findBar.classList.add('hidden')
  searchAddon.clearDecorations()
  term.focus()
})

document.getElementById('find-next').addEventListener('click', () => {
  searchAddon.findNext(findInput.value, { incremental: false, regex: false })
})

document.getElementById('find-prev').addEventListener('click', () => {
  searchAddon.findPrevious(findInput.value)
})

findInput.addEventListener('input', () => {
  if (findInput.value) searchAddon.findNext(findInput.value, { incremental: true })
  else searchAddon.clearDecorations()
})

findInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchAddon.findNext(findInput.value)
  if (e.key === 'Escape') {
    findBar.classList.add('hidden')
    searchAddon.clearDecorations()
    term.focus()
  }
})

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault()
    findBar.classList.toggle('hidden')
    if (!findBar.classList.contains('hidden')) findInput.focus()
  }
  if (e.ctrlKey && e.key === '=') { e.preventDefault(); setFontSize(fontSize + 1) }
  if (e.ctrlKey && e.key === '-') { e.preventDefault(); setFontSize(fontSize - 1) }
  if (e.ctrlKey && e.key === '0') { e.preventDefault(); setFontSize(14) }
})

const ctxMenu = document.getElementById('context-menu')
const hideCtx = () => ctxMenu.classList.add('hidden')

document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 170) + 'px'
  ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 180) + 'px'
  ctxMenu.classList.remove('hidden')
})

document.addEventListener('click', hideCtx)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCtx() })

document.getElementById('ctx-copy').addEventListener('click', () => {
  const sel = term.getSelection()
  if (sel) navigator.clipboard.writeText(sel)
  hideCtx()
})

document.getElementById('ctx-paste').addEventListener('click', async () => {
  const text = await navigator.clipboard.readText()
  api.terminal.sendInput(text)
  term.focus()
  hideCtx()
})

document.getElementById('ctx-select-all').addEventListener('click', () => {
  term.selectAll()
  hideCtx()
})

document.getElementById('ctx-clear').addEventListener('click', () => {
  term.clear()
  hideCtx()
})

document.getElementById('ctx-autoscroll').addEventListener('click', () => {
  autoScroll = !autoScroll
  document.getElementById('ctx-autoscroll').textContent = `Auto-scroll: ${autoScroll ? 'on' : 'off'}`
  document.getElementById('autoscroll-toggle').checked = autoScroll
  hideCtx()
})

term.attachCustomKeyEventHandler((e) => {
  if (e.ctrlKey && e.key === 'c' && term.hasSelection()) {
    navigator.clipboard.writeText(term.getSelection())
    return false
  }
  if (e.ctrlKey && e.key === 'v') {
    navigator.clipboard.readText().then(t => api.terminal.sendInput(t))
    return false
  }
  return true
})

term.focus()
