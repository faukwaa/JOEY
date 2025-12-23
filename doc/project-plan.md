# Electron 项目管理应用 - 开发规划

## 项目概述

一个基于 Electron 的桌面应用程序，用于管理和监控本地项目文件夹。通过可视化界面展示项目的关键信息，帮助开发者更好地管理和维护多个项目。

### 核心功能
- 项目信息采集与管理
- 项目状态监控
- 项目快速访问与操作
- 数据持久化存储

---

## 功能需求详解

### 1. 项目信息采集
- **基础信息**
  - 项目名称
  - 项目路径
  - 创建时间（通过文件系统获取）
  - 最后修改时间
  - 磁盘占用大小

- **代码仓库信息**
  - Git 仓库地址（从 .git/config 解析）
  - 当前分支
  - 最近提交信息

- **依赖管理**
  - 检测是否存在 node_modules 目录
  - 识别包管理器类型（npm/yarn/pnpm/bun）
  - 读取 package.json 获取依赖信息

### 2. 项目列表展示
- 表格/卡片视图切换
- 支持排序（按创建时间、修改时间、大小等）
- 支持搜索和过滤
- 显示项目健康状态指标

### 3. 项目操作
- 在终端/IDE 中打开项目
- 刷新项目信息
- 删除项目记录（仅从应用中移除）
- **删除项目文件**（永久删除真实文件夹）
  - 支持移至回收站（安全删除）
  - 支持永久删除（危险操作）
- 导出项目列表

### 4. 数据持久化
- 使用 SQLite 或 JSON 存储项目配置
- 支持导入/导出配置
- 定期自动刷新项目信息

---

## 技术栈选型

### 核心框架
- **Electron**: 桌面应用框架
- **React**: UI 框架（选择 React 因为生态丰富）
- **TypeScript**: 类型安全
- **Vite**: 前端构建工具（快速热更新）

### UI 组件库
- **shadcn/ui**: 基于 Radix UI 和 Tailwind CSS 的组件库
  - 组件复制到项目中，完全可定制
  - 原生 TypeScript 支持
  - 现代化的设计风格
  - 基于 Tailwind CSS，易于定制主题
  - 使用 Radix UI 作为无障碍层

### 样式方案
- **Tailwind CSS**: 原子化 CSS 框架
  - 快速构建 UI
  - 优秀的开发体验
  - 生产环境自动优化
- **clsx** / **cn**: 条件类名工具

### 状态管理
- **Zustand**: 轻量级状态管理
- **React Query**: 数据缓存和同步
- **Immer**: 不可变数据更新

### 数据库
- **Better-SQLite3**: 嵌入式数据库，同步 API
- **drizzle-orm**: 类型安全的 ORM（可选）

### 工具库
- **electron-builder**: 应用打包
- **electron-updater**: 自动更新
- **date-fns**: 日期处理
- **filesize**: 文件大小格式化
- **lucide-react**: 图标库（shadcn/ui 推荐）

---

## 项目结构设计

```
projectMng/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   ├── ipc/           # IPC 通信处理
│   │   ├── services/      # 后台服务
│   │   │   ├── project.ts   # 项目信息采集
│   │   │   ├── git.ts       # Git 信息解析
│   │   │   ├── storage.ts   # 数据存储
│   │   │   └── node-modules.ts # node_modules 管理
│   │   └── database/      # 数据库相关
│   │
│   ├── renderer/          # Electron 渲染进程
│   │   ├── App.tsx        # 应用入口
│   │   ├── main.tsx       # React 入口
│   │   ├── pages/         # 页面组件
│   │   │   ├── Home.tsx     # 项目列表页
│   │   │   └── Settings.tsx # 设置页
│   │   ├── components/    # 通用组件
│   │   │   ├── ui/         # shadcn/ui 组件
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectTable.tsx
│   │   │   ├── DeleteConfirmDialog.tsx
│   │   │   ├── DeleteNodeModulesDialog.tsx
│   │   │   └── AddProjectModal.tsx
│   │   ├── hooks/         # 自定义 Hooks
│   │   │   ├── useProjects.ts
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── store/         # 状态管理
│   │   │   └── projectStore.ts
│   │   └── lib/           # 工具函数
│   │       └── utils.ts    # cn() 工具函数
│   │
│   ├── shared/            # 共享代码
│   │   ├── types.ts       # TypeScript 类型定义
│   │   └── constants.ts   # 常量
│   │
│   └── preload.ts         # 预加载脚本
│
├── components.json        # shadcn/ui 配置
├── tailwind.config.js     # Tailwind CSS 配置
├── postcss.config.js      # PostCSS 配置
├── doc/                   # 文档目录
├── build/                 # 构建配置
│   ├── background.ts      # Electron Builder 配置
│   └── icon/              # 应用图标
│
├── package.json
├── tsconfig.json
├── vite.config.ts         # Vite 配置
└── README.md
```

---

## 数据模型设计

### Project 数据结构

```typescript
interface Project {
  id: string;                    // 唯一标识
  name: string;                  // 项目名称
  path: string;                  // 项目绝对路径

  // 时间信息
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 最后修改时间
  addedAt: Date;                 // 添加到应用的时间

  // 存储信息
  size: number;                  // 字节大小
  hasNodeModules: boolean;       // 是否有 node_modules

  // Git 信息
  gitRemote?: string;            // 远程仓库地址
  gitBranch?: string;            // 当前分支
  lastCommit?: string;           // 最后提交信息

  // 包信息
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  dependencies?: string[];       // 主要依赖

  // 元数据
  tags?: string[];               // 用户标签
  notes?: string;                // 备注
  icon?: string;                 // 自定义图标
  favorite?: boolean;            // 是否收藏
}

// 扫描目录时的临时数据
interface ProjectScanResult {
  path: string;
  isValidProject: boolean;
  projectType?: 'nodejs' | 'python' | 'rust' | 'go' | 'other';
  metadata?: Partial<Project>;
}
```

---

## 开发任务分解

### Phase 1: 项目初始化与基础框架
- [ ] 使用 Electron + React + TypeScript 搭建脚手架
- [ ] 配置开发环境（热重载、ESLint、Prettier）
- [ ] 实现基础的窗口管理
- [ ] 搭建 IPC 通信机制
- [ ] 创建基础 UI 布局

### Phase 2: 数据层开发
- [ ] 设计并实现数据库 Schema
- [ ] 实现项目信息采集服务
  - 文件系统信息获取
  - Git 信息解析
  - package.json 解析
  - 目录大小计算
- [ ] 实现数据持久化层（CRUD 操作）
- [ ] 添加项目扫描与导入功能

### Phase 3: UI 开发
- [ ] 实现项目列表页面
  - 表格视图
  - 卡片视图
  - 排序和筛选
- [ ] 实现添加项目功能
  - 目录选择器
  - 批量导入
- [ ] 实现项目详情页面
  - 完整信息展示
  - 编辑功能
- [ ] 实现设置页面
  - 主题切换
  - 数据导出/导入
  - 自动刷新配置

### Phase 4: 项目操作功能
- [ ] 实现打开项目功能（终端/IDE）
- [ ] 实现项目信息刷新
- [ ] 实现从应用中移除项目（不删除文件）
- [ ] **实现删除项目文件功能**
  - [ ] 移至回收站功能（跨平台支持）
  - [ ] 永久删除功能
  - [ ] 安全确认对话框
  - [ ] 批量删除功能
  - [ ] 删除操作日志
- [ ] 实现批量操作
- [ ] 添加快捷键支持

### Phase 5: 优化与增强
- [ ] 性能优化（大量项目时的加载优化）
- [ ] 添加搜索功能
- [ ] 实现数据统计仪表板
- [ ] 添加通知系统
- [ ] 实现自动备份

### Phase 6: 打包与发布
- [ ] 配置应用图标和名称
- [ ] 配置 Electron Builder
- [ ] 实现自动更新功能
- [ ] 编写用户文档
- [ ] 测试并发布

---

## UI/UX 设计思路

### 主界面布局
```
+----------------------------------+
|  Header: Logo | Search | Settings |
+----------------------------------+
|                                  |
|  Sidebar:          Main Content: |
|  - All Projects    [Grid View]   |
|  - Favorites       [Table View]  |
|  - Tags            +             |
|  - Statistics      Project Cards |
|                    or            |
|                    Table Rows    |
|                                  |
+----------------------------------+
|  Status Bar: Projects count | Size |
+----------------------------------+
```

### 项目卡片设计
- 项目名称 + 图标
- Git 仓库地址（可点击跳转）
- 关键信息：创建时间、大小、最后更新
- 状态指示器：node_modules 状态、Git 状态
- 快速操作按钮：打开、刷新、删除

### 颜色方案
- 主色：蓝色系（专业、科技感）
- 成功状态：绿色
- 警告状态：橙色（如无 node_modules）
- 错误状态：红色（如路径不存在）

---

## 技术要点与注意事项

### 1. 文件系统操作
- 使用 Node.js 的 `fs` 和 `fs/promises` 模块
- 大目录计算可能耗时，需要使用 Worker 线程
- 考虑缓存机制，避免重复计算

### 2. IPC 通信设计
```typescript
// 主进程 API
ipcMain.handle('project:getAll', () => {
  return database.getAllProjects();
});

ipcMain.handle('project:add', (_, projectPath) => {
  return services.scanAndAddProject(projectPath);
});

// 渲染进程调用
const projects = await window.electronAPI.project.getAll();
await window.electronAPI.project.add('/path/to/project');
```

### 3. 安全考虑
- 验证用户选择的项目路径
- 防止路径遍历攻击
- 限制可访问的目录范围
- 敏感信息（如 token）加密存储

### 4. 性能优化
- 使用虚拟列表处理大量项目
- 实现懒加载和分页
- 图片和图标缓存
- 数据库索引优化

### 5. 删除项目文件功能
- **安全机制**
  - 双重确认对话框
  - 需要输入项目名称确认
  - 显示将要删除的文件夹大小和文件数量
  - 支持撤销（移至回收站）
- **删除方式**
  - **移至回收站**（默认，推荐）
    - Windows: 使用回收站
    - macOS: 使用 ~/.Trash
    - Linux: 使用 trash-cli 或系统回收站
  - **永久删除**（高级选项）
    - 需要二次确认
    - 显示警告提示
    - 记录操作日志
- **批量删除**
  - 支持选择多个项目
  - 显示总大小统计
  - 逐个确认或批量确认

---

## 开发时间估算

| 阶段 | 预计工作量 | 说明 |
|------|-----------|------|
| Phase 1 | 2-3 天 | 项目初始化和基础框架 |
| Phase 2 | 3-4 天 | 数据层开发，核心功能 |
| Phase 3 | 4-5 天 | UI 开发，主要交互 |
| Phase 4 | 2-3 天 | 项目操作功能 |
| Phase 5 | 3-4 天 | 优化与增强 |
| Phase 6 | 2-3 天 | 打包发布 |
| **总计** | **16-22 天** | 约 3-4 周 |

---

## 后续扩展功能

- [ ] Git 操作集成（pull、push、commit）
- [ ] 项目依赖健康检查
- [ ] 项目模板快速生成
- [ ] 团队协作功能（配置共享）
- [ ] 云端同步
- [ ] 插件系统
- [ ] Docker 项目支持
- [ ] 项目脚本项目脚本运行
- [ ] CI/CD 状态集成
- [ ] 多语言支持

---

## 打开项目功能 - 技术实现方案

### 1. 功能概述

支持多种方式打开项目，提高开发效率：

- **在系统文件管理器中打开** - 查看/管理项目文件
- **在终端中打开** - 执行命令行操作
- **在 IDE 中打开** - 使用编辑器编辑代码
- **在 Git GUI 中打开** - 使用 Git 图形界面工具

### 2. 跨平台实现方案

```typescript
// src/main/services/open-project.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { shell } from 'electron';
import path from 'path';

const execAsync = promisify(exec);

// 平台检测
const platform = process.platform;
const isMac = platform === 'darwin';
const isWindows = platform === 'win32';
const isLinux = platform === 'linux';

/**
 * 在系统文件管理器中打开项目文件夹
 */
export async function openInFileManager(projectPath: string): Promise<void> {
  if (isWindows) {
    // Windows: 使用 explorer
    await execAsync(`explorer "${projectPath}"`);
  } else if (isMac) {
    // macOS: 使用 open
    await execAsync(`open "${projectPath}"`);
  } else {
    // Linux: 使用 xdg-open
    await execAsync(`xdg-open "${projectPath}"`);
  }
}

/**
 * 在终端中打开项目
 */
export async function openInTerminal(projectPath: string): Promise<void> {
  if (isWindows) {
    // Windows: 使用 Windows Terminal 或 cmd
    try {
      // 优先尝试 Windows Terminal
      await execAsync(`wt -d "${projectPath}"`);
    } catch {
      // 回退到 cmd
      await execAsync(`start cmd /K "cd /d "${projectPath}"`);
    }
  } else if (isMac) {
    // macOS: 使用 Terminal 或 iTerm2
    const terminalApps = [
      'Terminal',
      'iTerm',
      'Warp',
      'Alacritty'
    ];

    for (const app of terminalApps) {
      try {
        await execAsync(`open -a "${app}" "${projectPath}"`);
        return;
      } catch {
        continue;
      }
    }
  } else {
    // Linux: 使用系统默认终端
    const terminalCommands = [
      'gnome-terminal',
      'konsole',
      'xfce4-terminal',
      'xterm'
    ];

    for (const cmd of terminalCommands) {
      try {
        await execAsync(`${cmd} --working-directory="${projectPath}"`);
        return;
      } catch {
        continue;
      }
    }
  }
}

/**
 * 在 IDE 中打开项目
 */
export async function openInIDE(
  projectPath: string,
  ide: IDEType
): Promise<void> {
  switch (ide) {
    case 'vscode':
      await openInVSCode(projectPath);
      break;
    case 'webstorm':
      await openInWebStorm(projectPath);
      break;
    case 'sublime':
      await openInSublimeText(projectPath);
      break;
    case 'atom':
      await openInAtom(projectPath);
      break;
    case 'vim':
    case 'nvim':
      await openInTerminalEditor(projectPath, ide);
      break;
    default:
      throw new Error(`Unsupported IDE: ${ide}`);
  }
}

type IDEType = 'vscode' | 'webstorm' | 'sublime' | 'atom' | 'vim' | 'nvim';

/**
 * 在 VS Code 中打开项目
 */
async function openInVSCode(projectPath: string): Promise<void> {
  const codeCommand = isWindows ? 'code' : 'code';

  try {
    // 尝试使用 code 命令
    await execAsync(`"${codeCommand}" "${projectPath}"`);
  } catch (error) {
    // 如果命令失败，尝试查找 VS Code 安装路径
    let vscodePath = '';

    if (isMac) {
      vscodePath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
    } else if (isWindows) {
      vscodePath = 'C:\\Users\\{USER}\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd';
    } else if (isLinux) {
      vscodePath = '/usr/bin/code';
    }

    if (vscodePath) {
      await execAsync(`"${vscodePath}" "${projectPath}"`);
    } else {
      throw new Error('VS Code not found');
    }
  }
}

/**
 * 在 WebStorm 中打开项目
 */
async function openInWebStorm(projectPath: string): Promise<void> {
  if (isMac) {
    await execAsync(`open -a "WebStorm" "${projectPath}"`);
  } else if (isWindows) {
    await execAsync(`webstorm "${projectPath}"`);
  } else {
    await execAsync(`webstorm "${projectPath}"`);
  }
}

/**
 * 在 Sublime Text 中打开项目
 */
async function openInSublimeText(projectPath: string): Promise<void> {
  const sublimeCommand = isMac ? 'subl' : 'sublime_text';

  try {
    await execAsync(`"${sublimeCommand}" "${projectPath}"`);
  } catch (error) {
    throw new Error('Sublime Text not found');
  }
}

/**
 * 在 Atom 中打开项目
 */
async function openInAtom(projectPath: string): Promise<void> {
  try {
    await execAsync(`atom "${projectPath}"`);
  } catch (error) {
    throw new Error('Atom not found');
  }
}

/**
 * 在终端编辑器中打开项目
 */
async function openInTerminalEditor(projectPath: string, editor: 'vim' | 'nvim'): Promise<void> {
  // 先打开终端，然后 cd 到项目目录
  await openInTerminal(projectPath);

  // 注意：这需要在已经打开的终端中执行，
  // 实际实现可能需要更复杂的逻辑
  // 或者创建一个新的终端窗口并执行编辑器
}

/**
 * 在 Git GUI 工具中打开项目
 */
export async function openInGitGUI(
  projectPath: string,
  gui: 'sourcetree' | 'tower' | 'github' | 'gitkraken' | 'fork'
): Promise<void> {
  switch (gui) {
    case 'sourcetree':
      await openInSourceTree(projectPath);
      break;
    case 'tower':
      await openInTower(projectPath);
      break;
    case 'github':
      await openInGitHubDesktop(projectPath);
      break;
    case 'gitkraken':
      await openInGitKraken(projectPath);
      break;
    case 'fork':
      await openInFork(projectPath);
      break;
    default:
      throw new Error(`Unsupported Git GUI: ${gui}`);
  }
}

async function openInSourceTree(projectPath: string): Promise<void> {
  if (isMac) {
    await execAsync(`open -a "Sourcetree" "${projectPath}"`);
  } else if (isWindows) {
    await execAsync(`sourcetree "${projectPath}"`);
  }
}

async function openInTower(projectPath: string): Promise<void> {
  if (isMac) {
    await execAsync(`open -a "Tower" "${projectPath}"`);
  }
}

async function openInGitHubDesktop(projectPath: string): Promise<void> {
  if (isMac) {
    await execAsync(`open -a "GitHub Desktop" "${projectPath}"`);
  } else if (isWindows) {
    await execAsync(`github "${projectPath}"`);
  }
}

async function openInGitKraken(projectPath: string): Promise<void> {
  await execAsync(`gitkraken -p "${projectPath}"`);
}

async function openInFork(projectPath: string): Promise<void> {
  if (isMac) {
    await execAsync(`open -a "Fork" "${projectPath}"`);
  } else if (isWindows) {
    await execAsync(`fork "${projectPath}"`);
  }
}
```

### 3. IPC 通信设计

```typescript
// src/main/ipc/project.ts

import { ipcMain } from 'electron';
import * as openProject from '../services/open-project';

// 在文件管理器中打开
ipcMain.handle('project:openInFileManager', async (_, projectPath: string) => {
  try {
    await openProject.openInFileManager(projectPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 在终端中打开
ipcMain.handle('project:openInTerminal', async (_, projectPath: string) => {
  try {
    await openProject.openInTerminal(projectPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 在 IDE 中打开
ipcMain.handle('project:openInIDE', async (_, projectPath: string, ide: IDEType) => {
  try {
    await openProject.openInIDE(projectPath, ide);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 在 Git GUI 中打开
ipcMain.handle('project:openInGitGUI', async (_, projectPath: string, gui: GitGUIType) => {
  try {
    await openProject.openInGitGUI(projectPath, gui);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 检测已安装的应用
ipcMain.handle('system:detectInstalledApps', async () => {
  const apps = {
    vscode: await isAppInstalled('vscode'),
    webstorm: await isAppInstalled('webstorm'),
    sublime: await isAppInstalled('sublime'),
    atom: await isAppInstalled('atom'),
    sourcetree: await isAppInstalled('sourcetree'),
    tower: await isAppInstalled('tower'),
    github: await isAppInstalled('github-desktop'),
    gitkraken: await isAppInstalled('gitkraken'),
    fork: await isAppInstalled('fork')
  };

  return apps;
});

// 检测应用是否已安装
async function isAppInstalled(app: string): Promise<boolean> {
  try {
    switch (app) {
      case 'vscode':
        await execAsync('code --version');
        return true;
      case 'webstorm':
        if (isMac) {
          await execAsync('ls /Applications/WebStorm.app');
        }
        return true;
      case 'sublime':
        await execAsync('subl --version');
        return true;
      case 'atom':
        await execAsync('atom --version');
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
```

### 4. 渲染进程实现

```typescript
// src/renderer/components/ProjectCard.tsx

import { Button, Dropdown, Tooltip, message } from 'antd';
import {
  FolderOpenOutlined,
  CodeOutlined,
  TerminalOutlined,
  BranchesOutlined,
  MoreOutlined
} from '@ant-design/icons';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [installedApps, setInstalledApps] = useState({});

  // 加载已安装的应用
  useEffect(() => {
    window.electronAPI.system.detectInstalledApps().then(setInstalledApps);
  }, []);

  const openInFileManager = async () => {
    const result = await window.electronAPI.project.openInFileManager(project.path);
    if (result.success) {
      message.success('已在文件管理器中打开');
    } else {
      message.error(`打开失败: ${result.error}`);
    }
  };

  const openInTerminal = async () => {
    const result = await window.electronAPI.project.openInTerminal(project.path);
    if (result.success) {
      message.success('已在终端中打开');
    } else {
      message.error(`打开失败: ${result.error}`);
    }
  };

  const openInIDE = async (ide: IDEType) => {
    const result = await window.electronAPI.project.openInIDE(project.path, ide);
    if (result.success) {
      message.success(`已在 ${getIDEName(ide)} 中打开`);
    } else {
      message.error(`打开失败: ${result.error}`);
    }
  };

  const openInGitGUI = async (gui: GitGUIType) => {
    const result = await window.electronAPI.project.openInGitGUI(project.path, gui);
    if (result.success) {
      message.success(`已在 ${getGUIName(gui)} 中打开`);
    } else {
      message.error(`打开失败: ${result.error}`);
    }
  };

  const getIDEName = (ide: IDEType): string => {
    const names = {
      vscode: 'VS Code',
      webstorm: 'WebStorm',
      sublime: 'Sublime Text',
      atom: 'Atom',
      vim: 'Vim',
      nvim: 'Neovim'
    };
    return names[ide];
  };

  const getGUIName = (gui: GitGUIType): string => {
    const names = {
      sourcetree: 'Sourcetree',
      tower: 'Tower',
      github: 'GitHub Desktop',
      gitkraken: 'GitKraken',
      fork: 'Fork'
    };
    return names[gui];
  };

  // 构建 IDE 菜单项
  const ideMenuItems = [
    ...(installedApps.vscode ? [{
      key: 'vscode',
      label: 'VS Code',
      icon: <CodeOutlined />,
      onClick: () => openInIDE('vscode')
    }] : []),
    ...(installedApps.webstorm ? [{
      key: 'webstorm',
      label: 'WebStorm',
      onClick: () => openInIDE('webstorm')
    }] : []),
    ...(installedApps.sublime ? [{
      key: 'sublime',
      label: 'Sublime Text',
      onClick: () => openInIDE('sublime')
    }] : []),
    ...(installedApps.atom ? [{
      key: 'atom',
      label: 'Atom',
      onClick: () => openInIDE('atom')
    }] : [])
  ];

  // 构建 Git GUI 菜单项
  const gitMenuItems = [
    ...(installedApps.sourcetree ? [{
      key: 'sourcetree',
      label: 'Sourcetree',
      onClick: () => openInGitGUI('sourcetree')
    }] : []),
    ...(installedApps.tower ? [{
      key: 'tower',
      label: 'Tower',
      onClick: () => openInGitGUI('tower')
    }] : []),
    ...(installedApps.github ? [{
      key: 'github',
      label: 'GitHub Desktop',
      onClick: () => openInGitGUI('github')
    }] : []),
    ...(installedApps.gitkraken ? [{
      key: 'gitkraken',
      label: 'GitKraken',
      onClick: () => openInGitGUI('gitkraken')
    }] : []),
    ...(installedApps.fork ? [{
      key: 'fork',
      label: 'Fork',
      onClick: () => openInGitGUI('fork')
    }] : [])
  ];

  return (
    <Card
      title={project.name}
      extra={
        <Dropdown
          menu={{
            items: [
              {
                key: 'filemanager',
                label: '在文件管理器中打开',
                icon: <FolderOpenOutlined />,
                onClick: openInFileManager
              },
              {
                key: 'terminal',
                label: '在终端中打开',
                icon: <TerminalOutlined />,
                onClick: openInTerminal
              },
              {
                type: 'divider'
              },
              {
                key: 'ide',
                label: '在 IDE 中打开',
                children: ideMenuItems.length > 0 ? ideMenuItems : [{ key: 'none', label: '未检测到支持的 IDE', disabled: true }]
              },
              ...(project.gitRemote ? [{
                key: 'git',
                label: '在 Git GUI 中打开',
                icon: <BranchesOutlined />,
                children: gitMenuItems.length > 0 ? gitMenuItems : [{ key: 'none', label: '未检测到 Git GUI', disabled: true }]
              }] : [])
            ]
          }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      }
    >
      {/* 项目信息 */}
      <p>{project.path}</p>
      <p>{formatSize(project.size)}</p>

      {/* 快速操作按钮 */}
      <Space>
        <Tooltip title="在文件管理器中打开">
          <Button icon={<FolderOpenOutlined />} onClick={openInFileManager} />
        </Tooltip>
        <Tooltip title="在终端中打开">
          <Button icon={<TerminalOutlined />} onClick={openInTerminal} />
        </Tooltip>
        {installedApps.vscode && (
          <Tooltip title="在 VS Code 中打开">
            <Button icon={<CodeOutlined />} onClick={() => openInIDE('vscode')} />
          </Tooltip>
        )}
      </Space>
    </Card>
  );
};
```

### 5. 用户配置

```typescript
// src/shared/types.ts

interface UserSettings {
  open: {
    defaultIDE?: IDEType;
    defaultGitGUI?: GitGUIType;
    defaultTerminal?: string; // macOS: Terminal, iTerm, Warp
    customCommands: Array<{
      name: string;
      command: string;
      args?: string[];
    }>;
  };
}

// 自定义命令示例
const customCommands = [
  {
    name: '在 IntelliJ IDEA 中打开',
    command: '/Applications/IntelliJ\ IDEA.app/Contents/MacOS/idea',
    args: ['{projectPath}']
  },
  {
    name: '在 tmux 会话中打开',
    command: 'tmux',
    args: ['new-session', '-c', '{projectPath}']
  }
];
```

### 6. 快捷键支持

```typescript
// src/renderer/hooks/useKeyboardShortcuts.ts

export const useProjectShortcuts = (project: Project) => {
  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      // Cmd/Ctrl + O: 在文件管理器中打开
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        await window.electronAPI.project.openInFileManager(project.path);
      }

      // Cmd/Ctrl + T: 在终端中打开
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        await window.electronAPI.project.openInTerminal(project.path);
      }

      // Cmd/Ctrl + Shift + O: 在默认 IDE 中打开
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        const settings = await getSettings();
        if (settings.open.defaultIDE) {
          await window.electronAPI.project.openInIDE(project.path, settings.open.defaultIDE);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [project]);
};
```

### 7. 错误处理和用户反馈

```typescript
// 统一的错误处理
export async function handleOpenError(
  error: Error,
  action: string,
  projectPath: string
): Promise<void> {
  let errorMessage = `${action}失败`;

  if (error.message.includes('not found')) {
    errorMessage = `未找到对应的应用程序，请先安装后再试`;
  } else if (error.message.includes('ENOENT')) {
    errorMessage = `项目路径不存在: ${projectPath}`;
  } else if (error.message.includes('EACCES')) {
    errorMessage = `没有访问权限: ${projectPath}`;
  }

  message.error(errorMessage);

  // 记录错误日志
  console.error('Failed to open project:', {
    action,
    path: projectPath,
    error: error.message
  });
}
```

### 8. 性能优化建议

- **缓存已安装应用列表**：避免每次都重新检测
- **异步加载菜单**：只在实际使用时检测应用
- **用户配置记忆**：记住用户常用的打开方式
- **批量操作支持**：支持为多个项目执行相同的打开操作

### 总结

打开项目功能的核心要点：

1. **跨平台兼容**：处理 Windows、macOS、Linux 的差异
2. **多种打开方式**：文件管理器、终端、IDE、Git GUI
3. **自动检测应用**：只显示已安装的应用选项
4. **用户可配置**：支持自定义命令和默认应用
5. **快捷键支持**：提高操作效率
6. **良好的错误处理**：清晰的错误提示和反馈

---

## 删除 node_modules 功能 - 技术实现方案

### 1. 功能概述

针对前端项目的专属功能，快速删除 node_modules 目录以释放磁盘空间：

- **快速删除** - 直接删除，不经过回收站
- **批量删除** - 支持为多个项目同时删除 node_modules
- **大小统计** - 显示删除前后释放的磁盘空间
- **智能检测** - 自动识别包含 node_modules 的项目
- **安全确认** - 删除前显示占用大小并要求确认

### 2. 应用场景

- 项目不再需要，但想保留源码
- 需要重新安装依赖（清理缓存）
- 磁盘空间不足，需要清理
- CI/CD 失败，需要清理重试
- 切换分支，需要重新安装依赖

### 3. 实现方案

```typescript
// src/main/services/node-modules.ts

import { rm, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { trash } from 'trash';

interface NodeModulesInfo {
  exists: boolean;
  size: number;
  fileCount: number;
  path: string;
}

/**
 * 检测项目的 node_modules 信息
 */
export async function detectNodeModules(projectPath: string): Promise<NodeModulesInfo> {
  const nodeModulesPath = join(projectPath, 'node_modules');

  try {
    const stats = await stat(nodeModulesPath);

    if (!stats.isDirectory()) {
      return {
        exists: false,
        size: 0,
        fileCount: 0,
        path: nodeModulesPath
      };
    }

    // 计算 node_modules 大小
    const size = await calculateDirectorySize(nodeModulesPath);

    // 统计文件数量（可选，较耗时）
    const fileCount = await countFiles(nodeModulesPath);

    return {
      exists: true,
      size,
      fileCount,
      path: nodeModulesPath
    };
  } catch (error) {
    // node_modules 不存在
    return {
      exists: false,
      size: 0,
      fileCount: 0,
      path: nodeModulesPath
    };
  }
}

/**
 * 删除 node_modules
 */
export async function deleteNodeModules(
  projectPath: string,
  useTrash: boolean = false
): Promise<{ success: boolean; freedSpace: number; error?: string }> {
  const nodeModulesPath = join(projectPath, 'node_modules');

  try {
    // 检查是否存在
    const info = await detectNodeModules(projectPath);
    if (!info.exists) {
      return {
        success: false,
        freedSpace: 0,
        error: 'node_modules 不存在'
      };
    }

    const sizeBefore = info.size;

    // 执行删除
    if (useTrash) {
      // 移至回收站（保留恢复机会）
      await trash(nodeModulesPath);
    } else {
      // 直接删除（更快，不占用回收站空间）
      await rm(nodeModulesPath, {
        recursive: true,
        force: true,
        maxRetries: 3
      });
    }

    return {
      success: true,
      freedSpace: sizeBefore
    };
  } catch (error) {
    return {
      success: false,
      freedSpace: 0,
      error: error.message
    };
  }
}

/**
 * 批量删除多个项目的 node_modules
 */
export async function batchDeleteNodeModules(
  projectPaths: string[],
  useTrash: boolean = false,
  onProgress?: (current: number, total: number, projectPath: string) => void
): Promise<{
  success: boolean;
  results: Array<{
    projectPath: string;
    success: boolean;
    freedSpace: number;
    error?: string;
  }>;
  totalFreedSpace: number;
}> {
  const results = [];
  let totalFreedSpace = 0;

  for (let i = 0; i < projectPaths.length; i++) {
    const projectPath = projectPaths[i];

    // 通知进度
    onProgress?.(i + 1, projectPaths.length, projectPath);

    const result = await deleteNodeModules(projectPath, useTrash);
    results.push({
      projectPath,
      ...result
    });

    if (result.success) {
      totalFreedSpace += result.freedSpace;
    }
  }

  return {
    success: true,
    results,
    totalFreedSpace
  };
}

/**
 * 计算目录大小（异步，使用 Worker 避免阻塞）
 */
async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function traverse(path: string) {
    const entries = await readdir(path, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(path, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = await stat(fullPath);
          totalSize += stats.size;
        } catch {
          // 文件可能被删除，忽略错误
        }
      }
    }
  }

  await traverse(dirPath);
  return totalSize;
}

/**
 * 统计文件数量（可选操作）
 */
async function countFiles(dirPath: string): Promise<number> {
  let count = 0;

  async function traverse(path: string) {
    const entries = await readdir(path, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await traverse(join(path, entry.name));
      } else if (entry.isFile()) {
        count++;
      }
    }
  }

  await traverse(dirPath);
  return count;
}

/**
 * 重新安装依赖（删除后执行 npm install）
 */
export async function reinstallDependencies(
  projectPath: string,
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' = 'npm'
): Promise<{ success: boolean; error?: string }> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const commands = {
      npm: 'npm install',
      yarn: 'yarn install',
      pnpm: 'pnpm install',
      bun: 'bun install'
    };

    const command = commands[packageManager];

    await execAsync(command, {
      cwd: projectPath,
      timeout: 300000 // 5 分钟超时
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 4. IPC 通信设计

```typescript
// src/main/ipc/node-modules.ts

import { ipcMain } from 'electron';
import * as nodeModulesService from '../services/node-modules';

// 检测 node_modules
ipcMain.handle('nodeModules:detect', async (_, projectPath: string) => {
  try {
    const info = await nodeModulesService.detectNodeModules(projectPath);
    return { success: true, info };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 删除 node_modules
ipcMain.handle('nodeModules:delete', async (_, projectPath: string, useTrash: boolean) => {
  try {
    const result = await nodeModulesService.deleteNodeModules(projectPath, useTrash);

    if (result.success) {
      // 记录操作日志
      await logOperation({
        type: 'delete_node_modules',
        projectPath,
        freedSpace: result.freedSpace,
        timestamp: new Date()
      });
    }

    return result;
  } catch (error) {
    return { success: false, freedSpace: 0, error: error.message };
  }
});

// 批量删除
ipcMain.handle('nodeModules:batchDelete', async (
  _,
  projectPaths: string[],
  useTrash: boolean
) => {
  try {
    const result = await nodeModulesService.batchDeleteNodeModules(
      projectPaths,
      useTrash,
      (current, total, projectPath) => {
        // 发送进度更新到渲染进程
        mainWindow?.webContents.send('nodeModules:progress', {
          current,
          total,
          projectPath
        });
      }
    );

    return result;
  } catch (error) {
    return {
      success: false,
      results: [],
      totalFreedSpace: 0,
      error: error.message
    };
  }
});

// 重新安装依赖
ipcMain.handle('nodeModules:reinstall', async (
  _,
  projectPath: string,
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
) => {
  try {
    const result = await nodeModulesService.reinstallDependencies(
      projectPath,
      packageManager
    );
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### 5. 渲染进程实现

```typescript
// src/renderer/components/DeleteNodeModulesDialog.tsx

import { Modal, Progress, Alert, List, Tag, Button, Space } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

interface DeleteNodeModulesDialogProps {
  visible: boolean;
  projects: Project[];
  onCancel: () => void;
  onConfirm: (useTrash: boolean) => Promise<void>;
}

export const DeleteNodeModulesDialog: React.FC<DeleteNodeModulesDialogProps> = ({
  visible,
  projects,
  onCancel,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [nodeModulesInfo, setNodeModulesInfo] = useState<Map<string, NodeModulesInfo>>(new Map());
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // 加载 node_modules 信息
  useEffect(() => {
    if (visible) {
      loadNodeModulesInfo();
    }
  }, [visible, projects]);

  const loadNodeModulesInfo = async () => {
    const infoMap = new Map<string, NodeModulesInfo>();

    for (const project of projects) {
      const result = await window.electronAPI.nodeModules.detect(project.path);
      if (result.success) {
        infoMap.set(project.id, result.info);
      }
    }

    setNodeModulesInfo(infoMap);
  };

  const handleConfirm = async (useTrash: boolean = false) => {
    setLoading(true);

    try {
      // 监听进度
      const removeListener = window.electronAPI.nodeModules.onProgress((progress) => {
        setProgress({ current: progress.current, total: progress.total });
      });

      await onConfirm(useTrash);

      removeListener();
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const totalSize = Array.from(nodeModulesInfo.values())
    .reduce((sum, info) => sum + info.size, 0);

  const projectsWithNodeModules = projects.filter(p =>
    nodeModulesInfo.get(p.id)?.exists
  );

  return (
    <Modal
      title={
        <span>
          <DeleteOutlined /> 删除 node_modules
        </span>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          取消
        </Button>,
        <Button
          key="trash"
          danger
          loading={loading}
          onClick={() => handleConfirm(true)}
          disabled={projectsWithNodeModules.length === 0}
        >
          移至回收站
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          loading={loading}
          onClick={() => handleConfirm(false)}
          disabled={projectsWithNodeModules.length === 0}
        >
          直接删除
        </Button>
      ]}
    >
      <Alert
        message="删除 node_modules 将释放磁盘空间，但后续需要重新安装依赖才能运行项目"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {projectsWithNodeModules.length === 0 ? (
        <Alert
          message="选中的项目没有 node_modules 目录"
          type="info"
          showIcon
        />
      ) : (
        <>
          {/* 总计信息 */}
          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <div>
                <strong>项目数量：</strong>
                {projectsWithNodeModules.length}
              </div>
              <div>
                <strong>可释放空间：</strong>
                <Tag color="red">{formatSize(totalSize)}</Tag>
              </div>
            </Space>
          </div>

          {/* 进度条 */}
          {progress && (
            <div style={{ marginBottom: 16 }}>
              <Progress
                percent={Math.round((progress.current / progress.total) * 100)}
                status="active"
              />
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                正在删除 ({progress.current} / {progress.total})
              </div>
            </div>
          )}

          {/* 项目列表 */}
          <List
            size="small"
            bordered
            dataSource={projectsWithNodeModules}
            renderItem={(project) => {
              const info = nodeModulesInfo.get(project.id);
              return (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{project.name}</strong>
                      <Tag color="orange">{formatSize(info?.size || 0)}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {project.path}
                    </div>
                    {info?.fileCount && (
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {info.fileCount.toLocaleString()} 个文件
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </>
      )}
    </Modal>
  );
};

// 在项目卡片中使用
export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const [nodeModulesInfo, setNodeModulesInfo] = useState<NodeModulesInfo | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    window.electronAPI.nodeModules.detect(project.path).then(result => {
      if (result.success) {
        setNodeModulesInfo(result.info);
      }
    });
  }, [project.path]);

  const handleDeleteNodeModules = async () => {
    const confirmed = await confirm({
      title: '删除 node_modules',
      content: `确定要删除 ${project.name} 的 node_modules 吗？将释放 ${formatSize(nodeModulesInfo?.size || 0)} 空间。`
    });

    if (confirmed) {
      const result = await window.electronAPI.nodeModules.delete(project.path, false);
      if (result.success) {
        message.success(`已释放 ${formatSize(result.freedSpace)} 空间`);
        setNodeModulesInfo({ exists: false, size: 0, fileCount: 0, path: '' });
      } else {
        message.error(`删除失败: ${result.error}`);
      }
    }
  };

  return (
    <Card
      title={project.name}
      extra={
        <Dropdown
          menu={{
            items: [
              // ... 其他菜单项
              {
                key: 'delete-node-modules',
                label: '删除 node_modules',
                icon: <DeleteOutlined />,
                disabled: !nodeModulesInfo?.exists,
                onClick: () => setDeleteDialogVisible(true),
                children: nodeModulesInfo?.exists ? [
                  {
                    key: 'size',
                    label: `占用: ${formatSize(nodeModulesInfo.size)}`,
                    disabled: true
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'delete',
                    label: '直接删除',
                    danger: true,
                    onClick: handleDeleteNodeModules
                  },
                  {
                    key: 'trash',
                    label: '移至回收站',
                    onClick: () => handleDeleteNodeModulesWithTrash()
                  }
                ] : [{ key: 'none', label: '不存在 node_modules', disabled: true }]
              }
            ]
          }}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      }
    >
      {/* 显示 node_modules 状态 */}
      {nodeModulesInfo?.exists && (
        <Tag color="orange" icon={<DatabaseOutlined />}>
          node_modules: {formatSize(nodeModulesInfo.size)}
        </Tag>
      )}

      <DeleteNodeModulesDialog
        visible={deleteDialogVisible}
        projects={[project]}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={async (useTrash) => {
          const result = await window.electronAPI.nodeModules.delete(project.path, useTrash);
          if (result.success) {
            message.success(`已释放 ${formatSize(result.freedSpace)} 空间`);
            setNodeModulesInfo({ exists: false, size: 0, fileCount: 0, path: '' });
          }
          setDeleteDialogVisible(false);
        }}
      />
    </Card>
  );
};
```

### 6. 批量操作 UI

```typescript
// 在项目列表中添加批量删除按钮
export const ProjectList: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deleteNodeModulesDialog, setDeleteNodeModulesDialog] = useState(false);

  const selectedProjectsData = projects.filter(p =>
    selectedProjects.includes(p.id)
  );

  const handleBatchDeleteNodeModules = async (useTrash: boolean) => {
    const projectPaths = selectedProjectsData.map(p => p.path);
    const result = await window.electronAPI.nodeModules.batchDelete(projectPaths, useTrash);

    if (result.success) {
      message.success(
        `已为 ${result.results.length} 个项目删除 node_modules，` +
        `共释放 ${formatSize(result.totalFreedSpace)} 空间`
      );

      // 刷新项目信息
      await refreshProjects();
      setSelectedProjects([]);
    }

    setDeleteNodeModulesDialog(false);
  };

  return (
    <>
      {/* 工具栏 */}
      <Toolbar
        selectedCount={selectedProjects.length}
        actions={
          selectedProjects.length > 0 && (
            <Space>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => setDeleteNodeModulesDialog(true)}
              >
                删除 node_modules
              </Button>
            </Space>
          )
        }
      />

      {/* 项目列表 */}
      <ProjectTable
        selectedRowKeys={selectedProjects}
        onChange={setSelectedProjects}
      />

      {/* 批量删除对话框 */}
      <DeleteNodeModulesDialog
        visible={deleteNodeModulesDialog}
        projects={selectedProjectsData}
        onCancel={() => setDeleteNodeModulesDialog(false)}
        onConfirm={handleBatchDeleteNodeModules}
      />
    </>
  );
};
```

### 7. 性能优化

```typescript
// 使用 Worker 线程计算目录大小，避免阻塞主线程

// src/main/workers/calculate-size.worker.ts
import { parentPort, workerData } from 'worker_threads';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function calculateSize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function traverse(path: string) {
    const entries = await readdir(path, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(path, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = await stat(fullPath);
          totalSize += stats.size;
        } catch {
          // 忽略错误
        }
      }
    }
  }

  await traverse(dirPath);
  return totalSize;
}

calculateSize(workerData.dirPath)
  .then(size => {
    parentPort?.postMessage({ success: true, size });
  })
  .catch(error => {
    parentPort?.postMessage({ success: false, error: error.message });
  });

// 主进程中使用 Worker
import { Worker } from 'worker_threads';

async function calculateDirectorySizeWithWorker(dirPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./workers/calculate-size.worker.ts', {
      workerData: { dirPath }
    });

    worker.on('message', (message) => {
      if (message.success) {
        resolve(message.size);
      } else {
        reject(new Error(message.error));
      }
      worker.terminate();
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
```

### 8. 统计和报告

```typescript
// 生成 node_modules 统计报告
interface NodeModulesReport {
  totalProjects: number;
 projectsWithNodeModules: number;
  totalSize: number;
  largestProjects: Array<{
    projectPath: string;
    size: number;
  }>;
  packageManagerDistribution: {
    npm: number;
    yarn: number;
    pnpm: number;
    bun: number;
  };
}

export async function generateNodeModulesReport(projects: Project[]): Promise<NodeModulesReport> {
  const report: NodeModulesReport = {
    totalProjects: projects.length,
    projectsWithNodeModules: 0,
    totalSize: 0,
    largestProjects: [],
    packageManagerDistribution: {
      npm: 0,
      yarn: 0,
      pnpm: 0,
      bun: 0
    }
  };

  const projectSizes: Array<{ projectPath: string; size: number }> = [];

  for (const project of projects) {
    const info = await detectNodeModules(project.path);

    if (info.exists) {
      report.projectsWithNodeModules++;
      report.totalSize += info.size;
      projectSizes.push({ projectPath: project.path, size: info.size });

      // 统计包管理器
      if (project.packageManager) {
        report.packageManagerDistribution[project.packageManager]++;
      }
    }
  }

  // 找出最大的 5 个
  report.largestProjects = projectSizes
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map(p => ({
      projectPath: p.projectPath,
      size: p.size
    }));

  return report;
}
```

### 总结

删除 node_modules 功能的核心要点：

1. **快速释放空间** - 直接删除，不经过回收站
2. **批量处理** - 支持多个项目同时删除
3. **进度显示** - 实时显示删除进度
4. **大小统计** - 显示释放的磁盘空间
5. **性能优化** - 使用 Worker 线程避免阻塞
6. **重新安装** - 可选的自动重新安装依赖功能

---

## 删除项目文件功能 - 技术实现方案

### 1. 跨平台删除方案

使用 `trash` npm 包实现跨平台移至回收站功能：

```typescript
// 安装依赖
// npm install trash

import trash from 'trash';
import { rm } from 'fs/promises';

interface DeleteOptions {
  permanent?: boolean; // 是否永久删除
  confirm?: boolean;   // 是否需要确认
}

// 删除项目
async function deleteProject(
  projectPath: string,
  options: DeleteOptions = {}
): Promise<void> {
  const { permanent = false } = options;

  if (permanent) {
    // 永久删除
    await rm(projectPath, { recursive: true, force: true });
  } else {
    // 移至回收站
    await trash(projectPath);
  }
}

// 批量删除
async function deleteProjects(
  projectPaths: string[],
  options: DeleteOptions = {}
): Promise<void> {
  const { permanent = false } = options;

  if (permanent) {
    await Promise.all(
      projectPaths.map(path => rm(path, { recursive: true, force: true }))
    );
  } else {
    await trash(projectPaths);
  }
}
```

### 2. IPC 通信设计

```typescript
// 主进程 - ipc/project.ts
import { ipcMain } from 'electron';
import trash from 'trash';
import { rm } from 'fs/promises';

ipcMain.handle('project:removeRecord', async (_, projectId: string) => {
  // 仅从数据库中移除记录，不删除文件
  return database.removeProject(projectId);
});

ipcMain.handle('project:deleteFile', async (_, projectId: string, permanent: boolean) => {
  const project = await database.getProject(projectId);

  if (!project) {
    throw new Error('Project not found');
  }

  // 计算文件夹大小
  const size = await calculateDirectorySize(project.path);

  // 发送确认请求到渲染进程
  const confirmed = await sendConfirmationDialog({
    title: permanent ? '永久删除项目' : '删除项目',
    message: `确定要删除项目 "${project.name}" 吗？`,
    detail: `项目路径: ${project.path}\n大小: ${formatSize(size)}`,
    dangerous: permanent
  });

  if (!confirmed) {
    return { cancelled: true };
  }

  try {
    // 执行删除
    if (permanent) {
      await rm(project.path, { recursive: true, force: true });
    } else {
      await trash(project.path);
    }

    // 从数据库中移除记录
    await database.removeProject(projectId);

    // 记录操作日志
    await logOperation({
      type: permanent ? 'delete_permanent' : 'delete_trash',
      projectId,
      projectPath: project.path,
      timestamp: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('project:batchDelete', async (_, projectIds: string[], permanent: boolean) => {
  const projects = await database.getProjects(projectIds);
  const totalSize = projects.reduce((sum, p) => sum + p.size, 0);

  const confirmed = await sendConfirmationDialog({
    title: permanent ? '永久删除多个项目' : '删除多个项目',
    message: `确定要删除 ${projects.length} 个项目吗？`,
    detail: `总大小: ${formatSize(totalSize)}`,
    dangerous: permanent,
    showProjectList: true,
    projects: projects.map(p => ({ name: p.name, path: p.path }))
  });

  if (!confirmed) {
    return { cancelled: true };
  }

  try {
    const paths = projects.map(p => p.path);

    if (permanent) {
      await Promise.all(
        paths.map(path => rm(path, { recursive: true, force: true }))
      );
    } else {
      await trash(paths);
    }

    await database.removeProjects(projectIds);

    return { success: true, deletedCount: projects.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### 3. 渲染进程实现

```typescript
// 渲染进程 - components/DeleteConfirmDialog.tsx
import { Modal, Input, Alert, List, Tag } from 'antd';
import { ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';

interface DeleteConfirmDialogProps {
  visible: boolean;
  projects: Project[];
  permanent?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  visible,
  projects,
  permanent = false,
  onConfirm,
  onCancel
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const singleProject = projects.length === 1;
  const project = singleProject ? projects[0] : null;
  const totalSize = projects.reduce((sum, p) => sum + p.size, 0);

  const handleOk = async () => {
    // 验证确认文本
    if (permanent && singleProject) {
      if (confirmText !== project.name) {
        message.error('请输入正确的项目名称以确认删除');
        return;
      }
    }

    setLoading(true);
    try {
      await onConfirm();
      setConfirmText('');
      message.success(permanent ? '项目已永久删除' : '项目已移至回收站');
    } catch (error) {
      message.error(`删除失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <DeleteOutlined style={{ color: permanent ? '#ff4d4f' : '#faad14' }} />
          {' '}
          {permanent ? '永久删除项目' : '删除项目'}
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确定删除"
      cancelText="取消"
      okButtonProps={{
        danger: true,
        disabled: permanent && singleProject && confirmText !== project.name,
        loading
      }}
      width={600}
    >
      {/* 警告提示 */}
      <Alert
        message={
          permanent
            ? '警告：此操作将永久删除项目文件，无法恢复！'
            : '项目将被移至回收站，您可以在回收站中恢复'
        }
        type={permanent ? 'error' : 'warning'}
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 单个项目删除 */}
      {singleProject && (
        <div>
          <p>您即将删除以下项目：</p>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
            <Descriptions.Item label="项目路径">
              <Typography.Text copyable>{project.path}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="项目大小">
              {formatSize(project.size)}
            </Descriptions.Item>
            {project.gitRemote && (
              <Descriptions.Item label="Git 仓库">{project.gitRemote}</Descriptions.Item>
            )}
          </Descriptions>

          {/* 永久删除需要输入项目名称确认 */}
          {permanent && (
            <div style={{ marginTop: 16 }}>
              <Alert
                message="请输入项目名称以确认删除"
                type="info"
                showIcon
                style={{ marginBottom: 8 }}
              />
              <Input
                placeholder={`输入 "${project.name}" 以确认`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onPressEnter={handleOk}
              />
            </div>
          )}
        </div>
      )}

      {/* 批量删除 */}
      {!singleProject && (
        <div>
          <p>您即将删除 {projects.length} 个项目，总大小：{formatSize(totalSize)}</p>
          <List
            size="small"
            bordered
            dataSource={projects}
            renderItem={(item) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{item.name}</strong>
                    <Tag color="default">{formatSize(item.size)}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {item.path}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}
    </Modal>
  );
};

// 使用示例
const ProjectList: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    visible: boolean;
    permanent: boolean;
  }>({
    visible: false,
    permanent: false
  });

  const handleDelete = async (permanent: boolean) => {
    setDeleteDialog({ visible: true, permanent });
  };

  const confirmDelete = async () => {
    await window.electronAPI.project.batchDelete(selectedProjects, deleteDialog.permanent);
    setDeleteDialog({ visible: false, permanent: false });
    setSelectedProjects([]);
    await refreshProjects();
  };

  return (
    <>
      <Toolbar
        onDelete={() => handleDelete(false)}
        onPermanentDelete={() => handleDelete(true)}
        selectedCount={selectedProjects.length}
      />

      {/* 项目列表 */}
      <ProjectTable
        selectedRowKeys={selectedProjects}
        onChange={(keys) => setSelectedProjects(keys)}
      />

      {/* 删除确认对话框 */}
      {selectedProjects.length > 0 && (
        <DeleteConfirmDialog
          visible={deleteDialog.visible}
          projects={projects.filter(p => selectedProjects.includes(p.id))}
          permanent={deleteDialog.permanent}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDialog({ visible: false, permanent: false })}
        />
      )}
    </>
  );
};
```

### 4. 操作日志记录

```typescript
// 日志数据结构
interface DeleteOperationLog {
  id: string;
  type: 'delete_trash' | 'delete_permanent' | 'remove_record';
  projectId: string;
  projectName: string;
  projectPath: string;
  size: number;
  timestamp: Date;
}

// 日志服务
class OperationLogService {
  private db: Database;

  async logDelete(operation: DeleteOperationLog): Promise<void> {
    this.db.prepare(`
      INSERT INTO operation_logs (id, type, project_id, project_name, project_path, size, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      operation.id,
      operation.type,
      operation.projectId,
      operation.projectName,
      operation.projectPath,
      operation.size,
      operation.timestamp.toISOString()
    );
  }

  async getRecentDeletes(limit: number = 50): Promise<DeleteOperationLog[]> {
    return this.db.prepare(`
      SELECT * FROM operation_logs
      WHERE type LIKE 'delete%'
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit);
  }

  // 支持撤销（仅限移至回收站的）
  async restoreFromTrash(projectPath: string): Promise<void> {
    // Windows: 从回收站恢复
    // macOS: 从 ~/.Trash 恢复
    // Linux: 从回收站恢复
    // 注意：这个功能比较复杂，可能需要平台特定实现
  }
}
```

### 5. 安全检查清单

在执行删除操作前，必须进行以下检查：

```typescript
async function safetyChecks(projectPath: string): Promise<{
  safe: boolean;
  error?: string;
}> {
  // 1. 检查路径是否存在
  const pathExists = await exists(projectPath);
  if (!pathExists) {
    return { safe: false, error: '项目路径不存在' };
  }

  // 2. 检查路径是否在用户主目录内
  const homedir = require('os').homedir();
  if (!projectPath.startsWith(homedir)) {
    // 可以考虑警告用户，但不阻止
    console.warn(`Deleting project outside home directory: ${projectPath}`);
  }

  // 3. 检查是否是系统目录
  const systemPaths = ['/System', '/Library', '/Windows', '/Program Files'];
  const isSystemPath = systemPaths.some(sysPath =>
    projectPath.startsWith(sysPath)
  );
  if (isSystemPath) {
    return { safe: false, error: '不能删除系统目录' };
  }

  // 4. 检查项目是否正在被其他程序使用
  // （可选，需要平台特定实现）

  return { safe: true };
}
```

### 6. UI 设计建议

```typescript
// 项目卡片上的删除按钮
<ProjectCard
  actions={
    <>
      <Button icon={<FolderOpenOutlined />}>打开</Button>
      <Button icon={<ReloadOutlined />}>刷新</Button>
      <Dropdown
        menu={{
          items: [
            {
              key: 'remove',
              label: '从列表中移除',
              icon: <MinusCircleOutlined />
            },
            {
              type: 'divider'
            },
            {
              key: 'trash',
              label: '移至回收站',
              icon: <DeleteOutlined />,
              danger: true
            },
            {
              key: 'permanent',
              label: '永久删除',
              icon: <DeleteOutlined />,
              danger: true,
              disabled: false // 根据用户设置决定是否禁用
            }
          ],
          onClick: ({ key }) => {
            if (key === 'remove') handleRemove(project.id);
            if (key === 'trash') handleDelete(project.id, false);
            if (key === 'permanent') handleDelete(project.id, true);
          }
        }}
      >
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    </>
  }
/>
```

### 7. 用户设置选项

```typescript
interface UserSettings {
  delete: {
    defaultAction: 'trash' | 'permanent' | 'ask';
    requireProjectNameConfirmation: boolean; // 永久删除时是否需要输入项目名称
    showSizeWarning: number; // 超过此大小时显示额外警告（MB）
    enablePermanentDelete: boolean; // 是否启用永久删除功能
  };
}

// 默认设置
const DEFAULT_DELETE_SETTINGS: UserSettings['delete'] = {
  defaultAction: 'trash',
  requireProjectNameConfirmation: true,
  showSizeWarning: 1000, // 1GB
  enablePermanentDelete: true
};
```

### 总结

删除项目文件功能的核心要点：

1. **安全第一**：多重确认，防止误删
2. **默认使用回收站**：给用户后悔的机会
3. **清晰的提示信息**：显示项目路径、大小等关键信息
4. **跨平台兼容**：使用 `trash` 库处理不同操作系统的回收站
5. **操作日志**：记录所有删除操作，便于审计和问题排查
6. **用户可配置**：允许用户根据自己的需求调整删除行为

---

## shadcn/ui 配置与使用

### 1. 初始化设置

#### 安装依赖
```bash
# npm
npm install -D tailwindcss postcss autoprefixer
npm install clsx tailwind-merge
npm install lucide-react

# 初始化 Tailwind CSS
npx tailwindcss init -p
```

#### 配置 components.json
```bash
npx shadcn@latest init
```

交互式配置选项：
```
Would you like to use TypeScript? yes
Which style would you like to use? › Default
Which color would you like to use as base color? › Slate
Where is your global CSS file? › src/renderer/index.css
Would you like to use CSS variables for colors? › yes
Where is your tailwind.config.js located? › tailwind.config.js
Configure the import alias for components: › @/components
Configure the import alias for utils: › @/lib
Are you using React Server Components? › no
```

### 2. 配置文件

#### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/renderer/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### src/renderer/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### src/renderer/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3. 添加组件

使用 CLI 添加需要的组件：
```bash
# 按钮组件
npx shadcn@latest add button

# 卡片组件
npx shadcn@latest add card

# 对话框组件
npx shadcn@latest add dialog

# 下拉菜单
npx shadcn@latest add dropdown-menu

# 表格
npx shadcn@latest add table

# 输入框
npx shadcn@latest add input

# 标签
npx shadcn@latest add badge

# 进度条
npx shadcn@latest add progress

# 提示框
npx shadcn@latest add alert

# 开关
npx shadcn@latest add switch
```

### 4. 使用 shadcn/ui 重写组件示例

#### Button 组件使用
```typescript
import { Button } from "@/components/ui/button"
import { Trash2, FolderOpen } from "lucide-react"

<Button variant="default">默认按钮</Button>
<Button variant="destructive">危险按钮</Button>
<Button variant="outline">边框按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="link">链接按钮</Button>

<Button size="default">默认大小</Button>
<Button size="sm">小号</Button>
<Button size="lg">大号</Button>
<Button size="icon">
  <Trash2 className="h-4 w-4" />
</Button>
```

#### Card 组件使用
```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>项目名称</CardTitle>
    <CardDescription>项目描述信息</CardDescription>
  </CardHeader>
  <CardContent>
    <p>项目内容</p>
  </CardContent>
  <CardFooter>
    <Button>操作</Button>
  </CardFooter>
</Card>
```

#### Dialog 组件使用
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认删除</DialogTitle>
      <DialogDescription>
        此操作无法撤销，确定要继续吗？
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        取消
      </Button>
      <Button variant="destructive" onClick={handleConfirm}>
        确认删除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Dropdown Menu 组件使用
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, FolderOpenType } from "lucide-react"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleOpen}>
      <FolderOpenType className="mr-2 h-4 w-4" />
      打开项目
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      删除项目
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Table 组件使用
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>项目名称</TableHead>
      <TableHead>路径</TableHead>
      <TableHead>大小</TableHead>
      <TableHead className="text-right">操作</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell className="font-medium">{project.name}</TableCell>
        <TableCell>{project.path}</TableCell>
        <TableCell>{formatSize(project.size)}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">操作</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Badge 组件使用
```typescript
import { Badge } from "@/components/ui/badge"

<Badge>默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="outline">边框</Badge>
<Badge variant="destructive">危险</Badge>

// 自定义样式
<Badge className="bg-green-500 hover:bg-green-600">
  Active
</Badge>
```

#### Alert 组件使用
```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>错误</AlertTitle>
  <AlertDescription>
    操作失败，请稍后重试
  </AlertDescription>
</Alert>

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>提示</AlertTitle>
  <AlertDescription>
    删除 node_modules 将释放磁盘空间
  </AlertDescription>
</Alert>
```

### 5. 项目卡片示例（shadcn/ui 版本）

```typescript
// src/renderer/components/ProjectCard.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FolderOpen, Terminal, Code2, Trash2, HardDrive } from "lucide-react"
import { formatSize } from "@/lib/utils"

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <CardDescription className="text-xs">
            {project.path}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <FolderOpen className="mr-2 h-4 w-4" />
              在文件管理器中打开
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Terminal className="mr-2 h-4 w-4" />
              在终端中打开
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Code2 className="mr-2 h-4 w-4" />
              在 VS Code 中打开
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              删除项目
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <HardDrive className="mr-1 h-3 w-3" />
            {formatSize(project.size)}
          </Badge>
          {project.hasNodeModules && (
            <Badge variant="outline" className="text-xs">
              node_modules
            </Badge>
          )}
          {project.gitRemote && (
            <Badge variant="outline" className="text-xs">
              Git
            </Badge>
          )}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <div>创建时间: {formatDate(project.createdAt)}</div>
          <div>最后更新: {formatDate(project.updatedAt)}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onOpen}>
            <FolderOpen className="mr-2 h-4 w-4" />
            打开
          </Button>
          <Button variant="outline" size="sm">
            <Terminal className="mr-2 h-4 w-4" />
            终端
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### 6. shadcn/ui 的优势

1. **完全可定制** - 组件代码在你的项目中，可以随意修改
2. **类型安全** - 原生 TypeScript 支持
3. **样式灵活** - 基于 Tailwind CSS，易于定制主题
4. **无障碍性** - 基于 Radix UI，内置无障碍支持
5. **按需添加** - 只添加需要的组件，减小包体积
6. **现代设计** - 遵循现代设计趋势
7. **优秀的文档** - 清晰的文档和示例
8. **活跃的社区** - 快速的问题修复和更新

### 7. 与 Ant Design 的对比

| 特性 | shadcn/ui | Ant Design |
|------|-----------|------------|
| 包大小 | 按需添加，更小 | 完整引入，较大 |
| 可定制性 | 完全可定制 | 主题定制 |
| 设计风格 | 简洁现代 | 企业级 |
| TypeScript | 原生支持 | 支持 |
| 学习曲线 | 需要了解 Tailwind CSS | 开箱即用 |
| 无障碍性 | 基于 Radix UI，优秀 | 良好 |

---

## 参考资料

- [Electron 官方文档](https://www.electronjs.org/docs)
- [React TypeScript 指南](https://react-typescript-cheatsheet.netlify.app/)
- [electron-builder 文档](https://www.electron.build/)
- [Better-SQLite3 文档](https://github.com/WiseLibs/better-sqlite3)
- [trash npm 包](https://www.npmjs.com/package/trash) - 跨平台移至回收站
- [shadcn/ui 官方文档](https://ui.shadcn.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/)
- [lucide-react 图标库](https://lucide.dev/)

---

**文档创建时间**: 2025-12-23
**最后更新**: 2025-12-23
