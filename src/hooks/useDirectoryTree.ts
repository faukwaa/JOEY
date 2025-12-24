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
  // 将扫描过的目录列表转换为树形结构，只包含有项目的文件夹
  const buildTree = useCallback((scannedDirs: string[], rootPath: string, projectPaths: string[]): TreeNode => {
    // 找到所有有项目的目录
    const dirsWithProjects = new Set<string>()
    projectPaths.forEach(projectPath => {
      // 找到项目所属的所有父目录
      let currentPath = projectPath
      while (currentPath !== rootPath && currentPath.startsWith(rootPath)) {
        dirsWithProjects.add(currentPath)
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
        if (parentPath === rootPath || !parentPath.startsWith(rootPath)) {
          break
        }
        currentPath = parentPath
      }
    })

    // 过滤出属于当前扫描根目录的路径（移除 dirsWithProjects.has 的检查）
    const relativePaths = scannedDirs
      .filter(dir => dir.startsWith(rootPath))
      .map(dir => dir.slice(rootPath.length).replace(/^\//, '').split('/'))
      .filter(parts => parts.length > 0 && parts[0] !== '')

    // 构建树
    const root: TreeNode = {
      name: rootPath.split('/').pop() || rootPath,
      path: rootPath,
      depth: 0,
      children: [],
      isExpanded: true,
      hasProjects: dirsWithProjects.has(rootPath)
    }

    const nodeMap = new Map<string, TreeNode>()
    nodeMap.set(rootPath, root)

    for (const parts of relativePaths) {
      let currentPath = rootPath
      let currentNode = root

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        currentPath = i === 0 ? `${rootPath}/${part}` : `${currentPath}/${part}`

        // 只添加有项目的节点
        if (!nodeMap.has(currentPath) && dirsWithProjects.has(currentPath)) {
          const newNode: TreeNode = {
            name: part,
            path: currentPath,
            depth: i + 1,
            children: [],
            isExpanded: false,
            hasProjects: dirsWithProjects.has(currentPath)
          }
          currentNode.children.push(newNode)
          nodeMap.set(currentPath, newNode)
        }

        if (nodeMap.has(currentPath)) {
          currentNode = nodeMap.get(currentPath)!
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
