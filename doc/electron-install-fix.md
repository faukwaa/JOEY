# Electron 安装问题修复指南

## 问题

```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

## 原因

Electron 需要下载二进制文件，但可能因为网络问题导致下载失败。

## 解决方案

### 1. 配置镜像源

已在 `.npmrc` 中配置淘宝镜像：

```ini
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 2. 清理并重新安装

```bash
# 删除 node_modules 和锁文件
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### 3. 手动安装 Electron 二进制文件（如果自动安装失败）

```bash
cd node_modules/electron
node install.js
```

### 4. 验证安装

```bash
npx electron --version
```

应该输出：`v28.3.3`

## 常用镜像源

### 淘宝镜像（推荐，国内速度快）
```ini
electron_mirror=https://npmmirror.com/mirrors/electron/
```

### 官方镜像
```ini
electron_mirror=https://github.com/electron/electron/releases/
```

### 其他镜像
- 阿里云：`https://npmmirror.com/mirrors/electron/`
- 腾讯云：`https://mirrors.cloud.tencent.com/electron/`

## pnpm 构建脚本

pnpm 10+ 默认不运行构建脚本，需要手动批准：

```bash
# 方法 1：允许所有构建脚本
pnpm install --shamefully-hoist

# 方法 2：手动批准特定包
pnpm approve-builds electron esbuild

# 方法 3：直接运行安装脚本
cd node_modules/electron && node install.js
```

## 验证项目运行

```bash
# 启动开发环境
pnpm run electron:dev
```

应该看到 Electron 窗口打开，并显示应用界面。

## 其他问题

### 缓存问题

如果仍然有问题，清理 pnpm 缓存：

```bash
pnpm store prune
rm -rf ~/.local/share/pnpm/store
```

### 权限问题

```bash
sudo pnpm install
# 或
chmod -R +x node_modules/.bin/
```

### 网络代理

如果使用代理，设置环境变量：

```bash
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
pnpm install
```
