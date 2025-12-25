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
  openProjectTerminal: (projectPath: string) => ipcRenderer.invoke('open-project-terminal', projectPath),
  openProjectVSCode: (projectPath: string) => ipcRenderer.invoke('open-project-vscode', projectPath),
  openProjectQoder: (projectPath: string) => ipcRenderer.invoke('open-project-qoder', projectPath),
  selectFolders: () => ipcRenderer.invoke('select-folders'),
  // Scan folders management APIs
  saveScanFolders: (folders: string[]) => ipcRenderer.invoke('save-scan-folders', folders),
  getScanFolders: () => ipcRenderer.invoke('get-scan-folders'),
  addScanFolder: (folder: string) => ipcRenderer.invoke('add-scan-folder', folder),
  removeScanFolder: (folder: string) => ipcRenderer.invoke('remove-scan-folder', folder),
  getProjectStats: (projectPath: string) => ipcRenderer.invoke('get-project-stats', projectPath),
  // User settings APIs
  getUserSettings: () => ipcRenderer.invoke('get-user-settings'),
  saveUserSettings: (settings: { theme?: 'light' | 'dark' | 'system' }) => ipcRenderer.invoke('save-user-settings', settings),
  saveProjectsCache: (projects: unknown[], folders: string[], scannedDirs?: string[], folder?: string, favorites?: string[], scannedDirsMap?: Record<string, string[]>) => ipcRenderer.invoke('save-projects-cache', projects, folders, scannedDirs, folder, favorites, scannedDirsMap),
  // 项目操作 APIs
  deleteNodeModules: (projectPath: string) => ipcRenderer.invoke('delete-node-modules', projectPath),
  deleteProjectFromDisk: (projectPath: string) => ipcRenderer.invoke('delete-project-from-disk', projectPath),
  refreshProjectInfo: (projectPath: string) => ipcRenderer.invoke('refresh-project-info', projectPath),
  // 窗口控制 APIs
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
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
      getProjectsCache: () => Promise<{ projects: unknown[]; folders: string[]; scannedDirs?: string[]; scannedDirsMap?: Record<string, string[]>; favorites?: string[]; scannedAt: string } | null>
      getGitInfo: (projectPath: string) => Promise<{ branch: string | null; status: 'clean' | 'modified' | 'error' | 'no-git'; changes: number }>
      openProjectFolder: (projectPath: string) => Promise<{ success: boolean }>
      openProjectTerminal: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      openProjectVSCode: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      openProjectQoder: (projectPath: string) => Promise<{ success: boolean; error?: string }>
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
      getUserSettings: () => Promise<{ settings: { theme?: 'light' | 'dark' | 'system' } }>
      saveUserSettings: (settings: { theme?: 'light' | 'dark' | 'system' }) => Promise<{ success: boolean; error?: string }>
      saveProjectsCache: (projects: unknown[], folders: string[], scannedDirs?: string[], folder?: string, favorites?: string[], scannedDirsMap?: Record<string, string[]>) => Promise<{ success: boolean; error?: string }>
      deleteNodeModules: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      deleteProjectFromDisk: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      refreshProjectInfo: (projectPath: string) => Promise<{
        success: boolean
        error?: string
        projectInfo?: {
          gitBranch: string | null
          gitStatus: 'clean' | 'modified' | 'error' | 'no-git'
          gitChanges: number
          size: number
          hasNodeModules: boolean
          packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
        }
      }>
      // 窗口控制
      windowMinimize: () => Promise<void>
      windowMaximize: () => Promise<void>
      windowClose: () => Promise<void>
      windowIsMaximized: () => Promise<boolean>
      // 扫描进度事件
      onScanProgress: (callback: (progress: { stage: string; current: number; total: number; message: string }) => void) => () => void
    }
  }
}
