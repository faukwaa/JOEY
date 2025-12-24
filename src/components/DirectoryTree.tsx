import { useState, useCallback, useMemo, useEffect } from 'react'
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

  // 构建树
  const treeValue = useMemo(() => {
    if (scannedDirs.length > 0) {
      const newTree = buildTree(scannedDirs, scanFolder)
      return updateProjectFlags(newTree, projectPaths)
    }
    return null
  }, [scannedDirs, scanFolder, projectPaths, buildTree, updateProjectFlags])

  // 同步 tree 状态
  useEffect(() => {
    setTree(treeValue)
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
