const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  terminal: {
    onData: (cb) => ipcRenderer.on('terminal:data', (_e, data) => cb(data)),
    onExit: (cb) => ipcRenderer.on('terminal:exit', cb),
    sendInput: (data) => ipcRenderer.send('terminal:input', data),
    resize: (cols, rows) => ipcRenderer.send('terminal:resize', { cols, rows }),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    setAlwaysOnTop: (val) => ipcRenderer.send('window:alwaysOnTop', val),
    setOpacity: (val) => ipcRenderer.send('window:opacity', val),
    isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  },
})
