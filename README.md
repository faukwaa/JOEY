# JOEY

<div align="center">
  <img src="public/joey-logo.png" alt="JOEY Logo" width="120" height="120">

  **A modern project management application for developers**

  [English](#english) | [中文](#chinese)
</div>

---

## English

### Overview

JOEY is an Electron-based project management application designed for developers. It helps you scan, organize, and manage local development projects with Git integration, showing project statistics, status, and metadata at a glance.

### Features

- **Project Scanning**
  - Automatically scan multiple folders for projects
  - Smart project detection (Git repos, package.json, and more)
  - Recursive scanning with configurable depth

- **Git Integration**
  - Display current branch name
  - Show working tree status (clean/modified)
  - Count uncommitted changes

- **Project Statistics**
  - Project size calculation
  - Creation and modification timestamps
  - Package manager detection (npm/yarn/pnpm/bun)
  - node_modules presence indicator

- **Project Operations**
  - Open in file explorer
  - Open in terminal
  - Refresh project info
  - Mark as favorite
  - Delete project (move to trash)
  - Delete node_modules

- **User Interface**
  - Clean, modern design with shadcn/ui
  - Collapsible sidebar with icon-only mode
  - Dark/Light theme support
  - Custom title bar
  - Responsive grid layout

### Tech Stack

- **Framework**: Electron 39 + React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript
- **UI Components**: shadcn/ui (radix-maia variant)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Build Electron app for distribution
pnpm electron:build

# Lint code
pnpm lint
```

### Project Structure

```
projectMng/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload script (context bridge)
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui primitives
│   │   └── ...        # Feature components
│   ├── App.tsx        # Root component
│   └── main.tsx       # Entry point
├── public/            # Static assets
└── dist-electron/     # Built Electron files
```

### License

MIT

---

## Chinese

### 简介

JOEY 是一款为开发者设计的 Electron 项目管理应用。它帮助你扫描、组织和管理本地开发项目，集成 Git 功能，展示项目统计、状态和元数据。

### 功能特点

- **项目扫描**
  - 自动扫描多个文件夹中的项目
  - 智能项目检测（Git 仓库、package.json 等）
  - 可配置深度的递归扫描

- **Git 集成**
  - 显示当前分支名称
  - 显示工作区状态（干净/已修改）
  - 统计未提交的变更数量

- **项目统计**
  - 项目大小计算
  - 创建和修改时间戳
  - 包管理器检测（npm/yarn/pnpm/bun）
  - node_modules 存在指示

- **项目操作**
  - 在文件管理器中打开
  - 在终端中打开
  - 刷新项目信息
  - 收藏项目
  - 删除项目（移至回收站）
  - 删除 node_modules

- **用户界面**
  - 简洁现代的设计（shadcn/ui）
  - 可折叠侧边栏（支持图标模式）
  - 深色/浅色主题支持
  - 自定义标题栏
  - 响应式网格布局

### 技术栈

- **框架**: Electron 39 + React 19
- **构建工具**: Vite 7
- **语言**: TypeScript
- **UI 组件**: shadcn/ui (radix-maia 风格)
- **样式**: Tailwind CSS v4
- **图标**: Lucide React

### 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 构建 Electron 应用
pnpm electron:build

# 代码检查
pnpm lint
```

### 项目结构

```
projectMng/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本（上下文桥接）
│   ├── components/     # React 组件
│   │   ├── ui/        # shadcn/ui 基础组件
│   │   └── ...        # 功能组件
│   ├── App.tsx        # 根组件
│   └── main.tsx       # 入口文件
├── public/            # 静态资源
└── dist-electron/     # 构建的 Electron 文件
```

### 许可证

MIT
