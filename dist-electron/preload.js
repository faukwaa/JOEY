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
  getGitInfo: (projectPath) => ipcRenderer.invoke("get-git-info", projectPath),
  openProjectFolder: (projectPath) => ipcRenderer.invoke("open-project-folder", projectPath),
  selectFolders: () => ipcRenderer.invoke("select-folders"),
  // Scan folders management APIs
  saveScanFolders: (folders) => ipcRenderer.invoke("save-scan-folders", folders),
  getScanFolders: () => ipcRenderer.invoke("get-scan-folders"),
  addScanFolder: (folder) => ipcRenderer.invoke("add-scan-folder", folder),
  removeScanFolder: (folder) => ipcRenderer.invoke("remove-scan-folder", folder),
  getProjectStats: (projectPath) => ipcRenderer.invoke("get-project-stats", projectPath)
});
