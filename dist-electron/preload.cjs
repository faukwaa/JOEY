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
  selectFolders: () => electron.ipcRenderer.invoke("select-folders"),
  // Scan folders management APIs
  saveScanFolders: (folders) => electron.ipcRenderer.invoke("save-scan-folders", folders),
  getScanFolders: () => electron.ipcRenderer.invoke("get-scan-folders"),
  addScanFolder: (folder) => electron.ipcRenderer.invoke("add-scan-folder", folder),
  removeScanFolder: (folder) => electron.ipcRenderer.invoke("remove-scan-folder", folder),
  getProjectStats: (projectPath) => electron.ipcRenderer.invoke("get-project-stats", projectPath),
  saveProjectsCache: (projects, folders) => electron.ipcRenderer.invoke("save-projects-cache", projects, folders),
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
