const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    readFile: (data) => ipcRenderer.invoke('read-file', data),
    checkFileExists: (data) => ipcRenderer.invoke('check-file-exists', data),
    readRawFile: (data) => ipcRenderer.invoke('read-raw-file', data),
    isElectron: true,
});
