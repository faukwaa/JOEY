import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import path, { dirname, join } from "path";
import { existsSync, stat, readdir, rm, readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
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
const getProjectsCachePath = () => {
  const userDataPath = app.getPath("userData");
  const configDir = join(userDataPath, "config");
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  return join(configDir, "projects-cache.json");
};
const getProjectsCache = () => {
  try {
    const cachePath = getProjectsCachePath();
    if (existsSync(cachePath)) {
      const data = readFileSync(cachePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading projects cache:", error);
  }
  return null;
};
const saveProjectsCache = (projects, folders, scannedDirs, folder, favorites) => {
  try {
    const cachePath = getProjectsCachePath();
    let existingCache = null;
    try {
      const data = readFileSync(cachePath, "utf-8");
      existingCache = JSON.parse(data);
    } catch {
    }
    const scannedDirsMap = existingCache?.scannedDirsMap || {};
    if (folder && scannedDirs) {
      scannedDirsMap[folder] = scannedDirs;
    }
    const cache = {
      projects,
      folders,
      scannedDirs: scannedDirs || [],
      // 向后兼容
      scannedDirsMap,
      favorites,
      scannedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Error saving projects cache:", error);
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
function isProjectDirectory(dir) {
  const gitDir = join(dir, ".git");
  if (existsSync(gitDir)) {
    return true;
  }
  const projectIndicators = [
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "requirements.txt",
    "pyproject.toml",
    "Gemfile",
    "composer.json",
    ".gitignore"
  ];
  for (const indicator of projectIndicators) {
    if (existsSync(join(dir, indicator))) {
      return true;
    }
  }
  return false;
}
function shouldSkipDirectory(dirName) {
  const skipDirs = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    "target",
    "bin",
    "obj",
    ".next",
    ".nuxt",
    "coverage",
    "__pycache__",
    "venv",
    "env",
    ".venv",
    "site-packages",
    ".vscode",
    ".idea",
    ".DS_Store",
    "tmp",
    "temp"
  ];
  return skipDirs.includes(dirName) || dirName.startsWith(".");
}
async function scanDirectoryRecursively(dir, projects, scannedDirs, maxDepth = 5, currentDepth = 0, onProgress) {
  if (currentDepth >= maxDepth) {
    return;
  }
  if (!existsSync(dir)) {
    return;
  }
  scannedDirs.add(dir);
  try {
    const readdirAsync = promisify(readdir);
    const entries = await readdirAsync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || shouldSkipDirectory(entry.name)) {
        continue;
      }
      const fullPath = join(dir, entry.name);
      onProgress?.(fullPath);
      if (isProjectDirectory(fullPath)) {
        projects.push({
          name: entry.name,
          path: fullPath,
          description: "Project"
        });
        console.log(`找到项目: ${fullPath}`);
        continue;
      }
      await scanDirectoryRecursively(fullPath, projects, scannedDirs, maxDepth, currentDepth + 1, onProgress);
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}
ipcMain.handle("scan-projects", async (_event, folders) => {
  const projects = [];
  const scannedDirs = /* @__PURE__ */ new Set();
  const sendProgress = (stage, current, total, message) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("scan-progress", { stage, current, total, message });
    }
  };
  for (const folder of folders) {
    console.log(`开始扫描目录: ${folder}`);
    sendProgress("scanning", 0, 0, `扫描目录: ${folder}`);
    if (!existsSync(folder)) {
      console.log(`目录不存在: ${folder}`);
      continue;
    }
    scannedDirs.add(folder);
    if (isProjectDirectory(folder)) {
      const folderName = folder.split("/").pop() || folder;
      projects.push({
        name: folderName,
        path: folder,
        description: "Project"
      });
      console.log(`找到项目 (根目录): ${folder}`);
      sendProgress("found", projects.length, 0, `找到项目: ${folderName}`);
    }
    try {
      await scanDirectoryRecursively(folder, projects, scannedDirs, 5, 0, (currentPath) => {
        sendProgress("scanning", 0, 0, `扫描中: ${currentPath}`);
      });
    } catch (error) {
      console.error(`Error scanning folder ${folder}:`, error);
    }
    console.log(`目录扫描完成: ${folder}, 找到 ${projects.length} 个项目`);
  }
  const uniqueProjects = projects.filter(
    (project, index, self) => index === self.findIndex((p) => p.path === project.path)
  );
  console.log(`总共找到 ${uniqueProjects.length} 个唯一项目`);
  console.log(`扫描了 ${scannedDirs.size} 个目录`);
  saveProjectsCache(uniqueProjects, folders, Array.from(scannedDirs));
  sendProgress("complete", uniqueProjects.length, uniqueProjects.length, "扫描完成");
  return {
    projects: uniqueProjects,
    scannedDirs: Array.from(scannedDirs)
  };
});
ipcMain.handle("get-projects-cache", async () => {
  const cache = getProjectsCache();
  return cache;
});
ipcMain.handle("get-git-info", async (_, projectPath) => {
  try {
    const gitDir = join(projectPath, ".git");
    if (!existsSync(gitDir)) {
      return { branch: null, status: "no-git", changes: 0 };
    }
    const { stdout: branch } = await execAsync("git rev-parse --abbrev-ref HEAD", {
      cwd: projectPath
    });
    const { stdout: status } = await execAsync("git status --porcelain", {
      cwd: projectPath
    });
    const isClean = status.trim().length === 0;
    return {
      branch: branch.trim(),
      status: isClean ? "clean" : "modified",
      changes: status.trim().split("\n").filter(Boolean).length
    };
  } catch {
    return { branch: null, status: "error", changes: 0 };
  }
});
ipcMain.handle("open-project-folder", async (_, projectPath) => {
  await shell.openPath(projectPath);
  return { success: true };
});
ipcMain.handle("open-project-terminal", async (_, projectPath) => {
  try {
    const platform = process.platform;
    let command;
    if (platform === "darwin") {
      command = `open -a Terminal "${projectPath}"`;
    } else if (platform === "win32") {
      command = `start cmd /K "cd /d "${projectPath}""`;
    } else {
      command = `gnome-terminal --working-directory="${projectPath}" || xterm -e "cd '${projectPath}' && bash"`;
    }
    await execAsync(command);
    return { success: true };
  } catch (error) {
    console.error("Failed to open terminal:", error);
    return { success: false, error: String(error) };
  }
});
ipcMain.handle("open-project-vscode", async (_, projectPath) => {
  try {
    await execAsync(`code "${projectPath}"`);
    return { success: true };
  } catch (error) {
    console.error("Failed to open VSCode:", error);
    return { success: false, error: String(error) };
  }
});
ipcMain.handle("open-project-qoder", async (_, projectPath) => {
  try {
    await execAsync(`qoder "${projectPath}"`);
    return { success: true };
  } catch (error) {
    console.error("Failed to open Qoder:", error);
    return { success: false, error: String(error) };
  }
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
ipcMain.handle("save-projects-cache", async (_, projects, folders, scannedDirs, folder, favorites) => {
  return saveProjectsCache(projects, folders, scannedDirs, folder, favorites);
});
ipcMain.handle("get-project-stats", async (_, projectPath) => {
  try {
    let size = 0;
    let createdAt = Date.now();
    let updatedAt = Date.now();
    try {
      const statAsync = promisify(stat);
      const stats = await statAsync(projectPath);
      createdAt = stats.birthtimeMs;
      updatedAt = stats.mtimeMs;
    } catch {
    }
    try {
      if (process.platform === "darwin" || process.platform === "linux") {
        const duArgs = process.platform === "darwin" ? ["-sk", projectPath] : ["-sb", projectPath];
        const { stdout: output } = await execAsync(`du ${duArgs.join(" ")}`, {
          maxBuffer: 10 * 1024 * 1024
          // 10MB buffer
        });
        const match = output.trim().match(/^(\d+)/);
        if (match) {
          const sizeInKB = parseInt(match[1], 10);
          size = process.platform === "darwin" ? sizeInKB * 1024 : sizeInKB;
        }
      } else if (process.platform === "win32") {
        const { stdout: output } = await execAsync(
          `powershell -NoProfile -Command "'{0:N0}' - ((Get-ChildItem -Path '${projectPath}' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum | Select-Object -First 1)"`,
          {
            maxBuffer: 10 * 1024 * 1024
          }
        );
        const sizeStr = output.trim().replace(/,/g, "");
        size = parseInt(sizeStr, 10);
      }
    } catch {
      try {
        const readdirAsync = promisify(readdir);
        const statAsync = promisify(stat);
        const entries = await readdirAsync(projectPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            try {
              const fullPath = join(projectPath, entry.name);
              const stats = await statAsync(fullPath);
              size += stats.size;
              if (stats.birthtimeMs < createdAt) {
                createdAt = stats.birthtimeMs;
              }
              if (stats.mtimeMs > updatedAt) {
                updatedAt = stats.mtimeMs;
              }
            } catch {
            }
          }
        }
      } catch {
      }
    }
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
      size,
      hasNodeModules,
      packageManager,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString()
    };
  } catch (error) {
    console.error("Error getting project stats:", error);
    return {
      size: 0,
      hasNodeModules: false,
      packageManager: void 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
});
ipcMain.handle("delete-node-modules", async (_, projectPath) => {
  try {
    const nodeModulesPath = join(projectPath, "node_modules");
    if (!existsSync(nodeModulesPath)) {
      return { success: false, error: "node_modules 目录不存在" };
    }
    const rmAsync = promisify(rm);
    await rmAsync(nodeModulesPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    console.error("Error deleting node_modules:", error);
    return { success: false, error: String(error) };
  }
});
ipcMain.handle("delete-project-from-disk", async (_, projectPath) => {
  try {
    if (!existsSync(projectPath)) {
      return { success: false, error: "项目目录不存在" };
    }
    const rmAsync = promisify(rm);
    await rmAsync(projectPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    console.error("Error deleting project from disk:", error);
    return { success: false, error: String(error) };
  }
});
ipcMain.handle("refresh-project-info", async (_, projectPath) => {
  try {
    let gitBranch = null;
    let gitStatus = "no-git";
    let gitChanges = 0;
    try {
      const gitDir = join(projectPath, ".git");
      if (existsSync(gitDir)) {
        const { stdout: branch } = await execAsync("git rev-parse --abbrev-ref HEAD", {
          cwd: projectPath
        });
        const { stdout: status } = await execAsync("git status --porcelain", {
          cwd: projectPath
        });
        gitBranch = branch.trim();
        const isClean = status.trim().length === 0;
        gitStatus = isClean ? "clean" : "modified";
        gitChanges = status.trim().split("\n").filter(Boolean).length;
      }
    } catch {
      gitStatus = "error";
    }
    let size = 0;
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
    try {
      if (process.platform === "darwin" || process.platform === "linux") {
        const duArgs = process.platform === "darwin" ? ["-sk", projectPath] : ["-sb", projectPath];
        const { stdout: output } = await execAsync(`du ${duArgs.join(" ")}`, {
          maxBuffer: 10 * 1024 * 1024
        });
        const match = output.trim().match(/^(\d+)/);
        if (match) {
          const sizeInKB = parseInt(match[1], 10);
          size = process.platform === "darwin" ? sizeInKB * 1024 : sizeInKB;
        }
      } else if (process.platform === "win32") {
        const { stdout: output } = await execAsync(
          `powershell -NoProfile -Command "'{0:N0}' - ((Get-ChildItem -Path '${projectPath}' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum | Select-Object -First 1)"`,
          {
            maxBuffer: 10 * 1024 * 1024
          }
        );
        const sizeStr = output.trim().replace(/,/g, "");
        size = parseInt(sizeStr, 10);
      }
    } catch {
    }
    return {
      success: true,
      projectInfo: {
        gitBranch,
        gitStatus,
        gitChanges,
        size,
        hasNodeModules,
        packageManager
      }
    };
  } catch (error) {
    console.error("Error refreshing project info:", error);
    return { success: false, error: String(error) };
  }
});
