import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data)
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args))
  },
  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },
  // Project scanning APIs
  scanProjects: (folders: string[]) => ipcRenderer.invoke('scan-projects', folders),
  getProjectsCache: () => ipcRenderer.invoke('get-projects-cache'),
  getGitInfo: (projectPath: string) => ipcRenderer.invoke('get-git-info', projectPath),
  openProjectFolder: (projectPath: string) => ipcRenderer.invoke('open-project-folder', projectPath),
  selectFolders: () => ipcRenderer.invoke('select-folders'),
  // Scan folders management APIs
  saveScanFolders: (folders: string[]) => ipcRenderer.invoke('save-scan-folders', folders),
  getScanFolders: () => ipcRenderer.invoke('get-scan-folders'),
  addScanFolder: (folder: string) => ipcRenderer.invoke('add-scan-folder', folder),
  removeScanFolder: (folder: string) => ipcRenderer.invoke('remove-scan-folder', folder),
  getProjectStats: (projectPath: string) => ipcRenderer.invoke('get-project-stats', projectPath),
  saveProjectsCache: (projects: unknown[], folders: string[], scannedDirs?: string[]) => ipcRenderer.invoke('save-projects-cache', projects, folders, scannedDirs),
  // 扫描进度监听
  onScanProgress: (callback) => {
    const handler = (_: unknown, progress: { stage: string; current: number; total: number; message: string }) => {
      callback(progress)
    }
    ipcRenderer.on('scan-progress', handler)
    return () => {
      ipcRenderer.removeListener('scan-progress', handler)
    }
  },
})

declare global {
  interface Window {
    electronAPI: {
      sendMessage: (channel: string, data: unknown) => void
      on: (channel: string, callback: (...args: unknown[]) => void) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      scanProjects: (folders: string[]) => Promise<{ projects: unknown[]; scannedDirs: string[] }>
      getProjectsCache: () => Promise<{ projects: unknown[]; folders: string[]; scannedDirs: string[]; scannedAt: string } | null>
      getGitInfo: (projectPath: string) => Promise<{ branch: string | null; status: 'clean' | 'modified' | 'error' | 'no-git'; changes: number }>
      openProjectFolder: (projectPath: string) => Promise<{ success: boolean }>
      selectFolders: () => Promise<{ folders: string[] }>
      saveScanFolders: (folders: string[]) => Promise<{ success: boolean; error?: string }>
      getScanFolders: () => Promise<{ folders: string[] }>
      addScanFolder: (folder: string) => Promise<{ success: boolean; error?: string }>
      removeScanFolder: (folder: string) => Promise<{ success: boolean; error?: string }>
      getProjectStats: (projectPath: string) => Promise<{
        size: number
        hasNodeModules: boolean
        packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
        createdAt: string
        updatedAt: string
      }>
      saveProjectsCache: (projects: unknown[], folders: string[], scannedDirs?: string[]) => Promise<{ success: boolean; error?: string }>
      // 扫描进度事件
      onScanProgress: (callback: (progress: { stage: string; current: number; total: number; message: string }) => void) => () => void
    }
  }
}
