import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import path, { dirname, join } from "path";
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname$1, "../../public");
let win = null;
const getConfigPath = () => {
  const userDataPath = app.getPath("userData");
  const configDir = join(userDataPath, "config");
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  return join(configDir, "scan-folders.json");
};
const getScanFolders = () => {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, "utf-8");
      const config = JSON.parse(data);
      return config.folders || [];
    }
  } catch (error) {
    console.error("Error reading scan folders config:", error);
  }
  return [];
};
const saveScanFolders = (folders) => {
  try {
    const configPath = getConfigPath();
    const config = { folders, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving scan folders config:", error);
    return { success: false, error: String(error) };
  }
};
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
  win.on("closed", () => {
    win = null;
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("scan-projects", async (_, folders) => {
  const projects = [];
  for (const folder of folders) {
    if (!existsSync(folder)) continue;
    try {
      const entries = readdirSync(folder, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = join(folder, entry.name);
          const gitDir = join(projectPath, ".git");
          if (existsSync(gitDir)) {
            const packageJsonPath = join(projectPath, "package.json");
            projects.push({
              name: entry.name,
              path: projectPath,
              description: existsSync(packageJsonPath) ? "Node.js Project" : void 0
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning folder ${folder}:`, error);
    }
  }
  return { projects };
});
ipcMain.handle("get-git-info", async (_, projectPath) => {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: projectPath,
      encoding: "utf-8"
    }).trim();
    const status = execSync("git status --porcelain", {
      cwd: projectPath,
      encoding: "utf-8"
    });
    const isClean = status.trim().length === 0;
    return {
      branch,
      status: isClean ? "clean" : "modified",
      changes: status.trim().split("\n").filter(Boolean).length
    };
  } catch (error) {
    console.error("Error getting git info:", error);
    return { branch: "unknown", status: "error" };
  }
});
ipcMain.handle("open-project-folder", async (_, projectPath) => {
  await shell.openPath(projectPath);
  return { success: true };
});
ipcMain.handle("select-folders", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "multiSelections"],
    title: "选择项目文件夹"
  });
  if (result.canceled) {
    return { folders: [] };
  }
  return { folders: result.filePaths };
});
ipcMain.handle("save-scan-folders", async (_, folders) => {
  return saveScanFolders(folders);
});
ipcMain.handle("get-scan-folders", async () => {
  const folders = getScanFolders();
  return { folders };
});
ipcMain.handle("add-scan-folder", async (_, folder) => {
  const folders = getScanFolders();
  if (!folders.includes(folder)) {
    folders.push(folder);
    return saveScanFolders(folders);
  }
  return { success: true };
});
ipcMain.handle("remove-scan-folder", async (_, folder) => {
  const folders = getScanFolders();
  const newFolders = folders.filter((f) => f !== folder);
  return saveScanFolders(newFolders);
});
ipcMain.handle("get-project-stats", async (_, projectPath) => {
  try {
    const calculateSize = (dir) => {
      let size = 0;
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".git") {
            size += calculateSize(fullPath);
          }
        } else {
          const stats = statSync(fullPath);
          size += stats.size;
        }
      }
      return size;
    };
    const hasNodeModules = existsSync(join(projectPath, "node_modules"));
    let packageManager;
    if (existsSync(join(projectPath, "pnpm-lock.yaml"))) {
      packageManager = "pnpm";
    } else if (existsSync(join(projectPath, "yarn.lock"))) {
      packageManager = "yarn";
    } else if (existsSync(join(projectPath, "bun.lockb"))) {
      packageManager = "bun";
    } else if (existsSync(join(projectPath, "package-lock.json"))) {
      packageManager = "npm";
    }
    return {
      size: calculateSize(projectPath),
      hasNodeModules,
      packageManager
    };
  } catch (error) {
    console.error("Error getting project stats:", error);
    return {
      size: 0,
      hasNodeModules: false,
      packageManager: void 0
    };
  }
});
