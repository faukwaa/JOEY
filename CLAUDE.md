# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based project management application built with React, TypeScript, and Vite. The app scans and manages local development projects with Git integration, showing project statistics, status, and metadata.

## Development Commands

```bash
# Start development server (runs both Vite dev server and Electron)
pnpm dev

# Build for production
pnpm build

# Build Electron app for distribution
pnpm electron:build

# Lint code
pnpm lint
```

## Architecture

### Electron Process Structure

The application uses a standard multi-process Electron architecture:

- **Main Process** (`src/main/index.ts`): Node.js environment, handles file system operations, IPC handlers, and window management
- **Renderer Process** (`src/App.tsx`, `src/components/`): React UI, runs in browser context
- **Preload Script** (`src/preload/index.ts`): Bridge between main and renderer, exposes safe APIs via contextBridge

### Build Configuration (vite.config.ts)

The build uses Vite with `vite-plugin-electron`:

- **Main process**: Builds to `dist-electron/main.js` as CommonJS
- **Preload script**: Builds to `dist-electron/preload.cjs` as CommonJS (required for Electron sandbox)
- **Renderer**: Standard Vite React build to `dist/`

**Critical**: Preload script must be CommonJS format (`formats: ["cjs"]`). The main process references it as `preload.cjs` not `preload.js`.

### Module System

- All code uses ES modules (`import`/`export`)
- **Do not use `require()`** in the main process - always use ES imports
- Type-only imports: `import type { Project } from '@/types'` for type definitions to avoid Vite resolution issues

### IPC Communication Pattern

Renderer communicates with main process through:

1. **Preload script** (`src/preload/index.ts`) exposes typed APIs via `contextBridge.exposeInMainWorld('electronAPI', {...})`
2. **Main process** registers handlers with `ipcMain.handle('handler-name', async (event, args) => {...})`
3. **Renderer** calls via `await window.electronAPI.handlerName(args)`

Example pattern:
```typescript
// Preload
scanProjects: (folders: string[]) => ipcRenderer.invoke('scan-projects', folders)

// Main
ipcMain.handle('scan-projects', async (_, folders: string[]) => {
  // handler logic
})

// Renderer
const result = await window.electronAPI.scanProjects(folders)
```

### Config Storage

User configuration (scan folders) is stored as JSON in:
- Path: `app.getPath('userData')/config/scan-folders.json`
- Functions: `getScanFolders()`, `saveScanFolders()`

### Component Architecture (shadcn/ui)

Uses shadcn/ui with the **radix-maia** style variant:

- Style: Flat design, minimal borders, color-based differentiation
- Border radius: Unified via `var(--radius)` CSS variable
- Components: Located in `src/components/ui/`
- Adding new components: `pnpm dlx shadcn@latest add <component-name>`

Layout follows **sidebar-07** pattern:
- `SidebarProvider` wraps app
- `AppSidebar` contains navigation components (NavMain, NavProjects, NavScan, NavUser)
- `SidebarInset` contains main content with header trigger
- Collapsible sidebar with icon-only mode

### Cross-Component Communication

Components use custom window events for loose coupling:
```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('refresh-projects'))

// Listen
useEffect(() => {
  const handleRefresh = () => { /* ... */ }
  window.addEventListener('refresh-projects', handleRefresh)
  return () => window.removeEventListener('refresh-projects', handleRefresh)
}, [])
```

### Type Definitions

Core types in `src/types.ts`:
- `Project`: Main project data structure with git info, stats, metadata
- `ProjectScanResult`: Temporary scan results
- `UserSettings`: User preferences

## File Structure Notes

- `src/main/index.ts`: Electron main process - file system, Git operations, IPC handlers
- `src/preload/index.ts`: Context bridge - declares `window.electronAPI` interface
- `src/components/`: React components (app-sidebar, nav-*, ProjectCard, ProjectListPage)
- `src/components/ui/`: shadcn/ui primitive components
- `src/lib/utils.ts`: Utility functions (cn() for className merging)

## Common Pitfalls

1. **Module Resolution**: If Vite can't resolve a type import, change to `import type { ... }`
2. **Preload Format**: Always build preload as CommonJS - ESM won't work in Electron sandbox
3. **Import Errors**: After clearing cache or big changes, delete `node_modules/.vite` cache
4. **Missing Imports**: If main process fails with "require is not defined", convert to ES imports at top of file

## Styling Notes

- Uses Tailwind CSS v4 with CSS variables for theming
- Design is intentionally flat with color-based differentiation (no heavy borders/shadows)
- Project cards use generated colors based on project name hash
- Dark mode support via `dark:` prefixed classes

## 项目开发要求

- 使用 context7 这个 mcp 去读取这些库的文档
- 使用 web-search-prime 和 web-reader 这两个 mcp 去联网搜索
- 一切都基于官方文档，请按照官方文档进行操作。
- 所有代码不需要分号的时候都不要用分号。
- 代码中不要存在未使用的量和引用。
- 每次改动都做一次commit。
- 每次代码改动后都需要进行 eslint 的检查并修复 eslint 的错误
- 所有的变量需要设置 type
- 页面设计使用 front-design skill