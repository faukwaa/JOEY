import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  sendMessage: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  // Project scanning APIs
  scanProjects: (folders) => ipcRenderer.invoke("scan-projects", folders),
  getProjectsCache: () => ipcRenderer.invoke("get-projects-cache"),
  getGitInfo: (projectPath) => ipcRenderer.invoke("get-git-info", projectPath),
  openProjectFolder: (projectPath) => ipcRenderer.invoke("open-project-folder", projectPath),
  openProjectTerminal: (projectPath) => ipcRenderer.invoke("open-project-terminal", projectPath),
  openProjectVSCode: (projectPath) => ipcRenderer.invoke("open-project-vscode", projectPath),
  openProjectQoder: (projectPath) => ipcRenderer.invoke("open-project-qoder", projectPath),
  selectFolders: () => ipcRenderer.invoke("select-folders"),
  // Scan folders management APIs
  saveScanFolders: (folders) => ipcRenderer.invoke("save-scan-folders", folders),
  getScanFolders: () => ipcRenderer.invoke("get-scan-folders"),
  addScanFolder: (folder) => ipcRenderer.invoke("add-scan-folder", folder),
  removeScanFolder: (folder) => ipcRenderer.invoke("remove-scan-folder", folder),
  getProjectStats: (projectPath) => ipcRenderer.invoke("get-project-stats", projectPath),
  saveProjectsCache: (projects, folders, scannedDirs, folder, favorites, scannedDirsMap) => ipcRenderer.invoke("save-projects-cache", projects, folders, scannedDirs, folder, favorites, scannedDirsMap),
  // 项目操作 APIs
  deleteNodeModules: (projectPath) => ipcRenderer.invoke("delete-node-modules", projectPath),
  deleteProjectFromDisk: (projectPath) => ipcRenderer.invoke("delete-project-from-disk", projectPath),
  refreshProjectInfo: (projectPath) => ipcRenderer.invoke("refresh-project-info", projectPath),
  // 扫描进度监听
  onScanProgress: (callback) => {
    const handler = (_, progress) => {
      callback(progress);
    };
    ipcRenderer.on("scan-progress", handler);
    return () => {
      ipcRenderer.removeListener("scan-progress", handler);
    };
  }
});
