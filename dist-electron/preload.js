import { contextBridge as c, ipcRenderer as o } from "electron";
c.exposeInMainWorld("electronAPI", {
  sendMessage: (e, n) => {
    o.send(e, n);
  },
  on: (e, n) => {
    o.on(e, (i, ...r) => n(...r));
  },
  invoke: (e, ...n) => o.invoke(e, ...n),
  // Project scanning APIs
  scanProjects: (e) => o.invoke("scan-projects", e),
  getProjectsCache: () => o.invoke("get-projects-cache"),
  getGitInfo: (e) => o.invoke("get-git-info", e),
  openProjectFolder: (e) => o.invoke("open-project-folder", e),
  openProjectTerminal: (e) => o.invoke("open-project-terminal", e),
  openProjectVSCode: (e) => o.invoke("open-project-vscode", e),
  openProjectQoder: (e) => o.invoke("open-project-qoder", e),
  selectFolders: () => o.invoke("select-folders"),
  // Scan folders management APIs
  saveScanFolders: (e) => o.invoke("save-scan-folders", e),
  getScanFolders: () => o.invoke("get-scan-folders"),
  addScanFolder: (e) => o.invoke("add-scan-folder", e),
  removeScanFolder: (e) => o.invoke("remove-scan-folder", e),
  getProjectStats: (e) => o.invoke("get-project-stats", e),
  // User settings APIs
  getUserSettings: () => o.invoke("get-user-settings"),
  saveUserSettings: (e) => o.invoke("save-user-settings", e),
  saveProjectsCache: (e, n, i, r, s, t) => o.invoke("save-projects-cache", e, n, i, r, s, t),
  // 项目操作 APIs
  deleteNodeModules: (e) => o.invoke("delete-node-modules", e),
  deleteProjectFromDisk: (e) => o.invoke("delete-project-from-disk", e),
  refreshProjectInfo: (e) => o.invoke("refresh-project-info", e),
  // 窗口控制 APIs
  windowMinimize: () => o.invoke("window-minimize"),
  windowMaximize: () => o.invoke("window-maximize"),
  windowClose: () => o.invoke("window-close"),
  windowIsMaximized: () => o.invoke("window-is-maximized"),
  // 扫描进度监听
  onScanProgress: (e) => {
    const n = (i, r) => {
      e(r);
    };
    return o.on("scan-progress", n), () => {
      o.removeListener("scan-progress", n);
    };
  }
});
