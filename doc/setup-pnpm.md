# 使用 pnpm 安装依赖

## 快速开始

### 1. 确保已安装 pnpm

如果没有安装，请运行：
```bash
npm install -g pnpm
```

或者使用 corepack（Node.js 16.9+）：
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. 安装项目依赖

```bash
pnpm install
```

这将安装所有依赖并生成 `pnpm-lock.yaml` 文件。

### 3. 启动开发环境

```bash
pnpm run electron:dev
```

## pnpm 优势

- **更快的安装速度** - 相比 npm 和 yarn
- **更节省磁盘空间** - 使用硬链接共享依赖
- **严格的依赖管理** - 避免幽灵依赖
- **monorepo 支持** - 优秀的 monorepo 支持

## 常用命令

```bash
# 安装依赖
pnpm install

# 添加依赖
pnpm add <package>
pnpm add -D <package>  # 开发依赖

# 运行脚本
pnpm run <script>

# 运行 npx 命令
pnpm dlx <package>

# 更新依赖
pnpm update

# 清理依赖
pnpm prune
```

## 与 npm 的差异

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm run <script>` | `pnpm run <script>` |
| `npm add <pkg>` | `pnpm add <pkg>` |
| `npx <cmd>` | `pnpm dlx <cmd>` |
| `package-lock.json` | `pnpm-lock.yaml` |

## 添加 shadcn/ui 组件

使用 pnpm 的 dlx 命令：

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
```

## 故障排查

### 问题：找不到模块

删除 node_modules 和 lock 文件后重新安装：

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 问题：权限错误

```bash
pnpm store prune
pnpm install
```

### 问题：依赖冲突

检查 `.npmrc` 配置或使用 `--force` 标志：

```bash
pnpm install --force
```

## 更多信息

- [pnpm 官方文档](https://pnpm.io)
- [为什么选择 pnpm？](https://pnpm.io/motivation)
- [pnpm vs npm](https://pnpm.io/blog/2020/05/27/one-of-the-fastest-releases-in-pnpts-history)
