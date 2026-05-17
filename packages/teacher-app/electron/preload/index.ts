import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getServerPort: (): Promise<number> => ipcRenderer.invoke('get-server-port'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url)
})
