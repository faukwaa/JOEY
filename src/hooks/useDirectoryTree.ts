import { useCallback } from 'react'

// 树节点类型
export interface TreeNode {
  name: string
  path: string
  depth: number
  children: TreeNode[]
  isExpanded: boolean
  hasProjects: boolean
}

export function useDirectoryTree() {
  // 将扫描过的目录列表转换为树形结构
  const buildTree = useCallback((scannedDirs: string[], rootPath: string, projectPaths: string[]): TreeNode => {
    // 找到所有包含项目或有项目子目录的目录（用于标记）
    const dirsWithProjects = new Set<string>()
    projectPaths.forEach(projectPath => {
      let currentPath = projectPath
      // 向上遍历所有父目录，直到 rootPath
      while (currentPath !== rootPath && currentPath.startsWith(rootPath)) {
        dirsWithProjects.add(currentPath)
        const lastSlashIndex = currentPath.lastIndexOf('/')
        if (lastSlashIndex === -1) break
        const parentPath = currentPath.substring(0, lastSlashIndex)
        if (parentPath === rootPath || !parentPath.startsWith(rootPath)) {
          break
        }
        currentPath = parentPath
      }
    })

    // 构建树的辅助函数
    const root: TreeNode = {
      name: rootPath.split('/').pop() || rootPath,
      path: rootPath,
      depth: 0,
      children: [],
      isExpanded: true,
      hasProjects: dirsWithProjects.has(rootPath)
    }

    // 使用 Map 存储路径到节点的映射
    const nodeMap = new Map<string, TreeNode>()
    nodeMap.set(rootPath, root)

    // 遍历所有扫描过的目录
    for (const dir of scannedDirs) {
      // 只处理属于当前根目录的路径
      if (!dir.startsWith(rootPath) || dir === rootPath) {
        continue
      }

      // 将路径拆分为部分
      const relativePath = dir.slice(rootPath.length + 1)
      const parts = relativePath.split('/')
      if (parts.length === 0 || parts[0] === '') {
        continue
      }

      // 从根节点开始，逐层创建节点
      let currentPath = rootPath
      let currentNode = root

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const newPath = i === 0 ? `${rootPath}/${part}` : `${currentPath}/${part}`

        // 只创建包含项目的节点
        if (!nodeMap.has(newPath) && dirsWithProjects.has(newPath)) {
          const newNode: TreeNode = {
            name: part,
            path: newPath,
            depth: i + 1,
            children: [],
            isExpanded: false,
            hasProjects: dirsWithProjects.has(newPath)
          }
          currentNode.children.push(newNode)
          nodeMap.set(newPath, newNode)
        }

        // 移动到新节点（如果存在）
        if (nodeMap.has(newPath)) {
          currentNode = nodeMap.get(newPath)!
          currentPath = newPath
        }
      }
    }

    return root
  }, [])

  // 切换节点的展开/折叠状态
  const toggleNode = useCallback((tree: TreeNode, nodePath: string): TreeNode => {
    const toggle = (node: TreeNode): TreeNode => {
      if (node.path === nodePath) {
        return { ...node, isExpanded: !node.isExpanded }
      }
      return {
        ...node,
        children: node.children.map(toggle)
      }
    }
    return toggle(tree)
  }, [])

  return {
    buildTree,
    toggleNode
  }
}
