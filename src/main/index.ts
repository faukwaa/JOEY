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

// 检查目录是否是项目目录
function isProjectDirectory(dir: string): boolean {
  // 检查是否是 git 仓库
  const gitDir = join(dir, '.git')
  if (existsSync(gitDir)) {
    return true
  }

  // 检查是否有常见的项目文件
  const projectIndicators = [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lockb',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'requirements.txt',
    'pyproject.toml',
    'Gemfile',
    'composer.json',
    '.gitignore',
  ]

  for (const indicator of projectIndicators) {
    if (existsSync(join(dir, indicator))) {
      return true
    }
  }

  return false
}

// 应该跳过的目录
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.next',
    '.nuxt',
    'coverage',
    '__pycache__',
    'venv',
    'env',
    '.venv',
    'site-packages',
    '.vscode',
    '.idea',
    '.DS_Store',
    'tmp',
    'temp',
  ]

  return skipDirs.includes(dirName) || dirName.startsWith('.')
}

// 递归扫描目录查找项目
function scanDirectoryRecursively(
  dir: string,
  projects: Project[],
  maxDepth: number = 5,
  currentDepth: number = 0
): void {
  // 达到最大深度，停止扫描
  if (currentDepth >= maxDepth) {
    return
  }

  // 跳过不存在的目录
  if (!existsSync(dir)) {
    return
  }

  try {
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      // 跳过文件和隐藏目录
      if (!entry.isDirectory() || shouldSkipDirectory(entry.name)) {
        continue
      }

      const fullPath = join(dir, entry.name)

      // 检查是否是项目目录
      if (isProjectDirectory(fullPath)) {
        projects.push({
          name: entry.name,
          path: fullPath,
          description: 'Project'
        })
        console.log(`找到项目: ${fullPath}`)
        // 如果是项目目录，不再继续扫描其子目录
        continue
      }

      // 如果不是项目目录，继续扫描子目录
      scanDirectoryRecursively(fullPath, projects, maxDepth, currentDepth + 1)
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error)
  }
}

ipcMain.handle('scan-projects', async (_, folders: string[]) => {
  const projects: Project[] = []

  for (const folder of folders) {
    console.log(`开始扫描目录: ${folder}`)

    if (!existsSync(folder)) {
      console.log(`目录不存在: ${folder}`)
      continue
    }

    // 首先检查根目录本身是否是项目
    if (isProjectDirectory(folder)) {
      const folderName = folder.split('/').pop() || folder
      projects.push({
        name: folderName,
        path: folder,
        description: 'Project'
      })
      console.log(`找到项目 (根目录): ${folder}`)
    }

    // 递归扫描子目录
    try {
      scanDirectoryRecursively(folder, projects, 5, 0)
    } catch (error) {
      console.error(`Error scanning folder ${folder}:`, error)
    }

    console.log(`目录扫描完成: ${folder}, 找到 ${projects.length} 个项目`)
  }

  // 去重（基于路径）
  const uniqueProjects = projects.filter((project, index, self) =>
    index === self.findIndex((p) => p.path === project.path)
  )

  console.log(`总共找到 ${uniqueProjects.length} 个唯一项目`)

  return { projects: uniqueProjects }
})

ipcMain.handle('get-git-info', async (_, projectPath: string) => {
  try {
    // 检查是否是 Git 仓库
    const gitDir = join(projectPath, '.git')
    if (!existsSync(gitDir)) {
      return { branch: null, status: 'no-git', changes: 0 }
    }

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
  } catch {
    // 静默处理错误，不打印到控制台
    return { branch: null, status: 'error', changes: 0 }
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
    let size = 0

    // 使用系统 du 命令获取目录大小（比递归遍历快得多）
    try {
      if (process.platform === 'darwin' || process.platform === 'linux') {
        // macOS/Linux: 使用 du -sb (-s 总结, -b 字节)
        // macOS 的 du 不支持 -b，使用 -k 然后转换
        const duArgs = process.platform === 'darwin' ? ['-sk', projectPath] : ['-sb', projectPath]
        const output = execSync(`du ${duArgs.join(' ')}`, {
          cwd: projectPath,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        })

        // 输出格式: "12345\tpath" 或 "12345 path"
        const match = output.trim().match(/^(\d+)/)
        if (match) {
          const sizeInKB = parseInt(match[1], 10)
          size = process.platform === 'darwin' ? sizeInKB * 1024 : sizeInKB
        }
      } else if (process.platform === 'win32') {
        // Windows: 使用 PowerShell 的 Get-ChildItem
        const output = execSync(
          `powershell -NoProfile -Command "'{0:N0}' - ((Get-ChildItem -Path '${projectPath}' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum | Select-Object -First 1)"`,
          {
            cwd: projectPath,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
          }
        )
        const sizeStr = output.trim().replace(/,/g, '')
        size = parseInt(sizeStr, 10)
      }
    } catch {
      // 如果 du 命令失败，回退到快速检查（不递归）
      // 只统计根目录的文件大小，不包括子目录
      try {
        const entries = readdirSync(projectPath, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isFile()) {
            try {
              const fullPath = join(projectPath, entry.name as unknown as string)
              const stats = statSync(fullPath)
              size += stats.size
            } catch {
              // 跳过无法访问的文件
            }
          }
        }
      } catch {
        // 如果连 readdir 都失败，返回 0
      }
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
      size,
      hasNodeModules,
      packageManager,
    }
  } catch {
    // 静默处理错误，不打印到控制台
    return {
      size: 0,
      hasNodeModules: false,
      packageManager: undefined,
    }
  }
})
