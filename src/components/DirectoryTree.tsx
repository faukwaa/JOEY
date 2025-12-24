import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { TreeView } from '@/components/TreeView'
import { useDirectoryTree } from '@/hooks/useDirectoryTree'
import type { TreeNode } from '@/hooks/useDirectoryTree'

interface DirectoryTreeProps {
  scanFolder: string
  scannedDirs: string[]
  projectPaths: string[]
  onPathSelect: (path: string) => void
}

export function DirectoryTree({
  scanFolder,
  scannedDirs,
  projectPaths,
  onPathSelect
}: DirectoryTreeProps) {
  const { buildTree, toggleNode, updateProjectFlags } = useDirectoryTree()
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(scanFolder)
  const prevTreeValueRef = useRef<TreeNode | null>(null)

  // 构建树（只在依赖变化时重新构建）
  const treeValue = useMemo(() => {
    if (scannedDirs.length > 0) {
      const newTree = buildTree(scannedDirs, scanFolder)
      return updateProjectFlags(newTree, projectPaths)
    }
    return null
  }, [scannedDirs, scanFolder, projectPaths, buildTree, updateProjectFlags])

  // 同步 tree 状态，保留展开状态
  useEffect(() => {
    if (treeValue !== prevTreeValueRef.current) {
      // 如果树结构变化了，需要更新但保留展开状态
      if (prevTreeValueRef.current && tree) {
        // 收集当前展开的节点路径
        const collectExpandedPaths = (node: TreeNode): string[] => {
          const paths: string[] = []
          if (node.isExpanded && node.children.length > 0) {
            paths.push(node.path)
            node.children.forEach(child => {
              paths.push(...collectExpandedPaths(child))
            })
          }
          return paths
        }
        const expandedPaths = collectExpandedPaths(tree)

        // 将展开状态应用到新树
        const applyExpandedState = (node: TreeNode): TreeNode => {
          const isExpanded = expandedPaths.includes(node.path)
          return {
            ...node,
            isExpanded,
            children: node.children.map(applyExpandedState)
          }
        }

        setTree(applyExpandedState(treeValue))
      } else {
        setTree(treeValue)
      }
      prevTreeValueRef.current = treeValue
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeValue])

  // 处理节点选择
  const handleNodeSelect = useCallback((nodePath: string) => {
    setSelectedPath(nodePath)
    onPathSelect(nodePath)
  }, [onPathSelect])

  // 处理节点展开/折叠
  const handleNodeToggle = useCallback((nodePath: string) => {
    if (tree) {
      const newTree = toggleNode(tree, nodePath)
      setTree(newTree)
    }
  }, [tree, toggleNode])

  if (!tree || scannedDirs.length === 0) {
    return null
  }

  return (
    <TreeView
      tree={tree}
      selectedPath={selectedPath}
      onNodeSelect={handleNodeSelect}
      onNodeToggle={handleNodeToggle}
    />
  )
}
