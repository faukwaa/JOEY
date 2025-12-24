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
  const buildTree = useCallback((scannedDirs: string[], rootPath: string): TreeNode => {
    // 过滤出属于当前扫描根目录的路径
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
      hasProjects: false
    }

    const nodeMap = new Map<string, TreeNode>()
    nodeMap.set(rootPath, root)

    for (const parts of relativePaths) {
      let currentPath = rootPath
      let currentNode = root

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        currentPath = i === 0 ? `${rootPath}/${part}` : `${currentPath}/${part}`

        if (!nodeMap.has(currentPath)) {
          const newNode: TreeNode = {
            name: part,
            path: currentPath,
            depth: i + 1,
            children: [],
            isExpanded: false,
            hasProjects: false
          }
          currentNode.children.push(newNode)
          nodeMap.set(currentPath, newNode)
        }

        currentNode = nodeMap.get(currentPath)!
      }
    }

    return root
  }, [])

  // 扁平化树为列表（用于渲染）
  const flattenTree = useCallback((tree: TreeNode, maxDepth: number = 2): TreeNode[] => {
    const result: TreeNode[] = []
    const stack: { node: TreeNode; depth: number }[] = [{ node: tree, depth: 0 }]

    while (stack.length > 0) {
      const { node, depth } = stack.pop()!

      if (depth > 0) {
        result.push(node)
      }

      if (node.isExpanded || depth < maxDepth) {
        // 反向添加子节点，这样正序遍历时子节点是正序的
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({ node: node.children[i], depth: depth + 1 })
        }
      }
    }

    return result
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

  // 更新节点的 hasProjects 状态
  const updateProjectFlags = useCallback((tree: TreeNode, projectPaths: string[]): TreeNode => {
    const update = (node: TreeNode): TreeNode => {
      const hasProjects = projectPaths.some(path => path.startsWith(node.path))

      return {
        ...node,
        hasProjects,
        children: node.children.map(update)
      }
    }
    return update(tree)
  }, [])

  return {
    buildTree,
    flattenTree,
    toggleNode,
    updateProjectFlags
  }
}
