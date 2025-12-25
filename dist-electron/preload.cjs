"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendMessage: (channel, data) => {
    electron.ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  invoke: (channel, ...args) => {
    return electron.ipcRenderer.invoke(channel, ...args);
  },
  // Project scanning APIs
  scanProjects: (folders) => electron.ipcRenderer.invoke("scan-projects", folders),
  getProjectsCache: () => electron.ipcRenderer.invoke("get-projects-cache"),
  getGitInfo: (projectPath) => electron.ipcRenderer.invoke("get-git-info", projectPath),
  openProjectFolder: (projectPath) => electron.ipcRenderer.invoke("open-project-folder", projectPath),
  openProjectTerminal: (projectPath) => electron.ipcRenderer.invoke("open-project-terminal", projectPath),
  openProjectVSCode: (projectPath) => electron.ipcRenderer.invoke("open-project-vscode", projectPath),
  openProjectQoder: (projectPath) => electron.ipcRenderer.invoke("open-project-qoder", projectPath),
  selectFolders: () => electron.ipcRenderer.invoke("select-folders"),
  // Scan folders management APIs
  saveScanFolders: (folders) => electron.ipcRenderer.invoke("save-scan-folders", folders),
  getScanFolders: () => electron.ipcRenderer.invoke("get-scan-folders"),
  addScanFolder: (folder) => electron.ipcRenderer.invoke("add-scan-folder", folder),
  removeScanFolder: (folder) => electron.ipcRenderer.invoke("remove-scan-folder", folder),
  getProjectStats: (projectPath) => electron.ipcRenderer.invoke("get-project-stats", projectPath),
  saveProjectsCache: (projects, folders, scannedDirs, folder) => electron.ipcRenderer.invoke("save-projects-cache", projects, folders, scannedDirs, folder),
  // 项目操作 APIs
  deleteNodeModules: (projectPath) => electron.ipcRenderer.invoke("delete-node-modules", projectPath),
  deleteProjectFromDisk: (projectPath) => electron.ipcRenderer.invoke("delete-project-from-disk", projectPath),
  refreshProjectInfo: (projectPath) => electron.ipcRenderer.invoke("refresh-project-info", projectPath),
  // 扫描进度监听
  onScanProgress: (callback) => {
    const handler = (_, progress) => {
      callback(progress);
    };
    electron.ipcRenderer.on("scan-progress", handler);
    return () => {
      electron.ipcRenderer.removeListener("scan-progress", handler);
    };
  }
});
