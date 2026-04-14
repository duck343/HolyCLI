# Claude Chat

Transparent Electron terminal app for Claude.

## Setup

```bash
npm install
npm run rebuild    # rebuild node-pty for Electron
npm start          # launch app
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Ctrl+F | Find in terminal |
| Ctrl+C | Copy selection |
| Ctrl+V | Paste |
| Ctrl+= | Font size up |
| Ctrl+- | Font size down |
| Ctrl+0 | Reset font size |

## Features

- Transparent glassmorphism window
- PowerShell terminal via node-pty + xterm.js
- Always-on-top pin
- Opacity control (Settings panel)
- Font size control
- Find in terminal
- Right-click context menu
- Auto-scroll toggle
- Tray icon
