import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'

// Polyfill for __dirname and __filename in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(__dirname, '../../public')

let win: BrowserWindow | null = null

// 存储配置文件路径
const getConfigPath = () => {
  const userDataPath = app.getPath('userData')
  const configDir = join(userDataPath, 'config')
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  return join(configDir, 'scan-folders.json')
}

// 读取扫描目录配置
const getScanFolders = (): string[] => {
  try {
    const configPath = getConfigPath()
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(data)
      return config.folders || []
    }
  } catch (error) {
    console.error('Error reading scan folders config:', error)
  }
  return []
}

// 保存扫描目录配置
const saveScanFolders = (folders: string[]) => {
  try {
    const configPath = getConfigPath()
    const config = { folders, updatedAt: new Date().toISOString() }
    writeFileSync(configPath, JSON.stringify(config, null, 2))
    return { success: true }
  } catch (error) {
    console.error('Error saving scan folders config:', error)
    return { success: false, error: String(error) }
  }
}

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite @variables by Replacement
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

// When the app is ready, create the window
app.whenReady().then(createWindow)

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handlers for project scanning
interface Project {
  name: string
  path: string
  description?: string
}

ipcMain.handle('scan-projects', async (_, folders: string[]) => {
  const projects: Project[] = []

  for (const folder of folders) {
    if (!existsSync(folder)) continue

    try {
      const entries = readdirSync(folder, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = join(folder, entry.name)

          // Check if it's a git repository
          const gitDir = join(projectPath, '.git')
          if (existsSync(gitDir)) {
            // Check for package.json or other project indicators
            const packageJsonPath = join(projectPath, 'package.json')

            projects.push({
              name: entry.name,
              path: projectPath,
              description: existsSync(packageJsonPath) ? 'Node.js Project' : undefined
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning folder ${folder}:`, error)
    }
  }

  return { projects }
})

ipcMain.handle('get-git-info', async (_, projectPath: string) => {
  try {
    // Get current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectPath,
      encoding: 'utf-8'
    }).trim()

    // Get git status
    const status = execSync('git status --porcelain', {
      cwd: projectPath,
      encoding: 'utf-8'
    })

    const isClean = status.trim().length === 0

    return {
      branch,
      status: isClean ? 'clean' : 'modified',
      changes: status.trim().split('\n').filter(Boolean).length
    }
  } catch (error) {
    console.error('Error getting git info:', error)
    return { branch: 'unknown', status: 'error' }
  }
})

ipcMain.handle('open-project-folder', async (_, projectPath: string) => {
  await shell.openPath(projectPath)
  return { success: true }
})

ipcMain.handle('select-folders', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
    title: '选择项目文件夹'
  })

  if (result.canceled) {
    return { folders: [] }
  }

  return { folders: result.filePaths }
})

// 保存扫描目录
ipcMain.handle('save-scan-folders', async (_, folders: string[]) => {
  return saveScanFolders(folders)
})

// 读取扫描目录
ipcMain.handle('get-scan-folders', async () => {
  const folders = getScanFolders()
  return { folders }
})

// 添加扫描目录
ipcMain.handle('add-scan-folder', async (_, folder: string) => {
  const folders = getScanFolders()
  if (!folders.includes(folder)) {
    folders.push(folder)
    return saveScanFolders(folders)
  }
  return { success: true }
})

// 删除扫描目录
ipcMain.handle('remove-scan-folder', async (_, folder: string) => {
  const folders = getScanFolders()
  const newFolders = folders.filter(f => f !== folder)
  return saveScanFolders(newFolders)
})

// 获取项目统计信息
ipcMain.handle('get-project-stats', async (_, projectPath: string) => {
  try {
    const calculateSize = (dir: string): number => {
      let size = 0
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          // 跳过 node_modules 和 .git 以提高性能
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            size += calculateSize(fullPath)
          }
        } else {
          const stats = statSync(fullPath)
          size += stats.size
        }
      }
      return size
    }

    const hasNodeModules = existsSync(join(projectPath, 'node_modules'))

    // 检测包管理器
    let packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | undefined
    if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) {
      packageManager = 'pnpm'
    } else if (existsSync(join(projectPath, 'yarn.lock'))) {
      packageManager = 'yarn'
    } else if (existsSync(join(projectPath, 'bun.lockb'))) {
      packageManager = 'bun'
    } else if (existsSync(join(projectPath, 'package-lock.json'))) {
      packageManager = 'npm'
    }

    return {
      size: calculateSize(projectPath),
      hasNodeModules,
      packageManager,
    }
  } catch (error) {
    console.error('Error getting project stats:', error)
    return {
      size: 0,
      hasNodeModules: false,
      packageManager: undefined,
    }
  }
})
