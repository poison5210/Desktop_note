const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  notes: {
    read: () => ipcRenderer.invoke('notes:read'),
    update: (notes) => ipcRenderer.invoke('notes:update', notes)
  },
  settings: {
    read: () => ipcRenderer.invoke('settings:read'),
    update: (settings) => ipcRenderer.invoke('settings:update', settings)
  },
  window: {
    pin: (isPinned) => ipcRenderer.invoke('window:pin', isPinned),
    minimize: () => ipcRenderer.invoke('window:minimize')
  },
  dialog: {
    chooseDir: () => ipcRenderer.invoke('dialog:chooseDir')
  }
});


