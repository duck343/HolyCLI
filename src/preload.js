const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  terminal: {
    create:    (tabId, shellType) => ipcRenderer.send('terminal:create', tabId, shellType),
    close:     (tabId)           => ipcRenderer.send('terminal:close', tabId),
    sendInput: (tabId, data)     => ipcRenderer.send('terminal:input', tabId, data),
    resize:    (tabId, cols, rows) => ipcRenderer.send('terminal:resize', tabId, { cols, rows }),
    onData:    (cb) => ipcRenderer.on('terminal:data', (_e, tabId, data) => cb(tabId, data)),
    onExit:    (cb) => ipcRenderer.on('terminal:exit', (_e, tabId) => cb(tabId)),
  },
context: {
    save: (folder, content) => ipcRenderer.invoke('context:save', { folder, content }),
    read: (folder) => ipcRenderer.invoke('context:read', folder),
  },
  dialog: {
    pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
    confirm: (msg)  => ipcRenderer.invoke('dialog:confirm', msg),
  },
  system: { getCpuPercent: () => ipcRenderer.invoke('system:cpuPercent') },
  getFilePath: (file) => webUtils.getPathForFile(file),
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  window: {
    minimize:         () => ipcRenderer.send('window:minimize'),
    maximize:         () => ipcRenderer.send('window:maximize'),
    forceClose:       () => ipcRenderer.send('window:force-close'),
    setAlwaysOnTop:   (val) => ipcRenderer.send('window:alwaysOnTop', val),
    setOpacity:       (val) => ipcRenderer.send('window:opacity', val),
    isAlwaysOnTop:    ()    => ipcRenderer.invoke('window:isAlwaysOnTop'),
    onCloseRequested: (cb)  => ipcRenderer.on('window:close-requested', cb),
  },
})
