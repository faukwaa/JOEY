# 快速开始指南

## 项目已创建完成！

### 📁 项目结构

```
projectMng/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   ├── ipc/           # IPC 通信处理
│   │   ├── services/      # 后台服务（待实现）
│   │   └── database/      # 数据库（待实现）
│   ├── renderer/          # React 渲染进程
│   │   ├── App.tsx        # 应用入口
│   │   ├── main.tsx       # React 入口
│   │   ├── index.css      # 全局样式
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面（待实现）
│   │   ├── hooks/         # 自定义 Hooks（待实现）
│   │   ├── store/         # 状态管理（待实现）
│   │   └── lib/           # 工具函数
│   ├── preload/           # 预加载脚本
│   │   └── index.ts       # API 暴露
│   └── shared/            # 共享代码
│       └── types.ts       # 类型定义
├── doc/                   # 文档
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── components.json        # shadcn/ui 配置
└── tsconfig.json
```

### 🚀 启动项目

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发环境**
   ```bash
   pnpm run electron:dev
   ```

   这将：
   - 启动 Vite 开发服务器（端口 5173）
   - 启动 Electron 应用
   - 自动打开开发者工具

### 🎨 添加 shadcn/ui 组件

项目已配置好 shadcn/ui，你可以按需添加组件：

```bash
# 基础组件
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input

# 复杂组件
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add table

# 其他组件
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add alert
pnpm dlx shadcn@latest add progress
pnpm dlx shadcn@latest add switch
```

组件将被添加到 `src/renderer/components/ui/` 目录。

### 📝 下一步开发

#### 1. 添加第一个 shadcn/ui 组件

```bash
pnpm dlx shadcn@latest add button
```

然后在 `src/renderer/App.tsx` 中使用：

```tsx
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="container mx-auto p-8">
      <Button>点击我</Button>
    </div>
  )
}
```

#### 2. 实现 IPC 通信功能

在 `src/main/ipc/project.ts` 中实现具体的 IPC 处理逻辑：

```typescript
ipcMain.handle('project:getAll', async () => {
  // 从数据库获取所有项目
  return database.getAllProjects()
})
```

#### 3. 创建项目列表页面

创建 `src/renderer/pages/Home.tsx`：

```tsx
export function Home() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    window.electronAPI.project.getAll().then(setProjects)
  }, [])

  return (
    <div>
      <h1>我的项目</h1>
      {/* 项目列表 */}
    </div>
  )
}
```

### 🛠️ 可用命令

- `pnpm run dev` - 仅启动 Vite 开发服务器
- `pnpm run electron:dev` - 启动 Electron + Vite（开发模式）
- `pnpm run build` - 构建渲染进程
- `pnpm run electron:build` - 打包 Electron 应用
- `pnpm run lint` - 运行 ESLint

### 📚 重要文件说明

- `src/main/index.ts` - Electron 主进程入口
- `src/preload/index.ts` - 预加载脚本，暴露安全的 API 到渲染进程
- `src/renderer/App.tsx` - React 应用根组件
- `src/main/ipc/project.ts` - IPC 通信处理器
- `src/shared/types.ts` - TypeScript 类型定义

### ⚡ 热重载

开发环境下，修改渲染进程代码会自动热重载。
修改主进程代码需要重启 Electron 应用。

### 🐛 调试

- 渲染进程：使用 Chrome DevTools（自动打开）
- 主进程：查看终端输出

### 💡 提示

1. 所有 IPC 通信通过 `window.electronAPI` 进行
2. 组件使用 `@/` 别名导入（如 `@/components/ui/button`）
3. 样式使用 Tailwind CSS 类名
4. shadcn/ui 组件按需添加，减小包体积

### 📖 更多资源

- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Vite 文档](https://vitejs.dev)

---

**开始开发吧！** 🚀
