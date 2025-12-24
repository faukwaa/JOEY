import { FolderIcon, Trash2Icon, PlusIcon, ChevronRightIcon } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useDirectoryTree } from "@/hooks/useDirectoryTree"
import type { TreeNode } from "@/hooks/useDirectoryTree"

interface NavScanProps {
  scannedDirs: string[]
  projectPaths: string[]
  onPathSelect: (path: string) => void
}

interface ScanFolderTree {
  folder: string
  tree: TreeNode
  isExpanded: boolean
}

export function NavScan({ scannedDirs, projectPaths, onPathSelect }: NavScanProps) {
  const [scanFolders, setScanFolders] = useState<string[]>([])
  const [folderTrees, setFolderTrees] = useState<Map<string, ScanFolderTree>>(new Map())
  const [selectedPath, setSelectedPath] = useState<string>("")
  const { buildTree, toggleNode } = useDirectoryTree()

  const handleSelectPath = useCallback((path: string) => {
    setSelectedPath(path)
    // 通知项目列表当前选中的目录（用于扫描）
    window.dispatchEvent(new CustomEvent('selected-scan-folder', { detail: path }))
    // 通知项目列表过滤显示该目录的项目
    onPathSelect(path)
  }, [onPathSelect])

  // 构建所有扫描目录的树
  const folderTreesData = useMemo(() => {
    const result: ScanFolderTree[] = []
    for (const folder of scanFolders) {
      const tree = buildTree(scannedDirs, folder, projectPaths)
      const existing = folderTrees.get(folder)
      result.push({
        folder,
        tree,
        isExpanded: existing?.isExpanded || false
      })
    }
    return result
  }, [scanFolders, scannedDirs, projectPaths, buildTree, folderTrees])

  // 加载已保存的扫描目录
  const loadScanFolders = useCallback(async () => {
    try {
      const result = await window.electronAPI.getScanFolders()
      const folders = result.folders || []
      setScanFolders(folders)

      // 初始化文件夹树的展开状态
      setFolderTrees(prev => {
        const newMap = new Map(prev)
        folders.forEach(folder => {
          if (!newMap.has(folder)) {
            newMap.set(folder, { folder, tree: null as unknown as TreeNode, isExpanded: false })
          }
        })
        return newMap
      })
    } catch (error) {
      console.error("加载扫描目录失败:", error)
    }
  }, [])

  // 组件挂载时加载扫描目录
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadScanFolders()
  }, [loadScanFolders])

  // 如果扫描目录列表变化且当前没有选中，选中第一个
  useEffect(() => {
    if (!selectedPath && scanFolders.length > 0) {
      handleSelectPath(scanFolders[0])
    }
  }, [scanFolders, selectedPath, handleSelectPath])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAddFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolders()
      if (result.folders && result.folders.length > 0) {
        const newFolder = result.folders[0]
        // 保存到配置
        await window.electronAPI.addScanFolder(newFolder)
        // 重新加载列表
        await loadScanFolders()
        // 选中新添加的目录
        handleSelectPath(newFolder)
      }
    } catch (error) {
      console.error("添加扫描目录失败:", error)
    }
  }

  const handleRemoveFolder = async (folderPath: string) => {
    try {
      await window.electronAPI.removeScanFolder(folderPath)
      await loadScanFolders()
      // 如果删除的是当前选中的，选中第一个
      if (selectedPath === folderPath) {
        const remaining = scanFolders.filter(f => f !== folderPath)
        if (remaining.length > 0) {
          handleSelectPath(remaining[0])
        }
      }
    } catch (error) {
      console.error("删除扫描目录失败:", error)
    }
  }

  const handleToggleFolder = useCallback((folder: string) => {
    setFolderTrees(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(folder)
      newMap.set(folder, {
        folder,
        tree: existing?.tree || folderTreesData.find(f => f.folder === folder)?.tree || null as unknown as TreeNode,
        isExpanded: !existing?.isExpanded
      })
      return newMap
    })
  }, [folderTreesData])

  const handleToggleNode = useCallback((folder: string, nodePath: string) => {
    setFolderTrees(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(folder)
      if (existing) {
        newMap.set(folder, {
          ...existing,
          tree: toggleNode(existing.tree, nodePath)
        })
      }
      return newMap
    })
  }, [toggleNode])

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          {/* 添加扫描目录按钮 */}
          <div className="px-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleAddFolder}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              添加扫描目录
            </Button>
          </div>

          {/* 显示已保存的扫描目录 */}
          {scanFolders.length > 0 && (
            <SidebarMenu>
              {folderTreesData.map(({ folder, tree, isExpanded }) => {
                const folderName = folder.split('/').pop() || folder
                const isSelected = selectedPath === folder
                const hasChildren = tree.children.length > 0

                // 递归渲染树节点
                const renderTreeNode = (node: TreeNode): React.ReactNode => {
                  const nodeHasChildren = node.children.length > 0
                  const nodeIsSelected = selectedPath === node.path

                  return (
                    <div key={node.path}>
                      <SidebarMenuSubButton
                        className={cn(
                          "group/data-[collapsible=icon]:hidden",
                          nodeIsSelected && "bg-accent"
                        )}
                        style={{ paddingLeft: `${node.depth * 12}px` }}
                        onClick={() => handleSelectPath(node.path)}
                      >
                        {nodeHasChildren && (
                          <span
                            className="flex items-center justify-center w-4 h-4 rounded hover:bg-muted mr-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleNode(folder, node.path)
                            }}
                          >
                            <ChevronRightIcon
                              className={cn(
                                'h-3 w-3 transition-transform',
                                node.isExpanded && 'transform rotate-90'
                              )}
                            />
                          </span>
                        )}
                        {!nodeHasChildren && <span className="w-5" />}
                        <FolderIcon className={cn('h-4 w-4', node.hasProjects ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('flex-1 truncate', node.hasProjects && 'font-medium')}>
                          {node.name}
                        </span>
                      </SidebarMenuSubButton>

                      {node.isExpanded && node.children.map(child => renderTreeNode(child))}
                    </div>
                  )
                }

                return (
                  <SidebarMenuItem key={folder}>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        {/* 根文件夹 */}
                        <SidebarMenuSubButton
                          className={cn(
                            "group/data-[collapsible=icon]:hidden",
                            isSelected && "bg-accent"
                          )}
                          onClick={() => handleSelectPath(folder)}
                        >
                          {hasChildren && (
                            <span
                              className="flex items-center justify-center w-4 h-4 rounded hover:bg-muted mr-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFolder(folder)
                              }}
                            >
                              <ChevronRightIcon
                                className={cn(
                                  'h-3 w-3 transition-transform',
                                  isExpanded && 'transform rotate-90'
                                )}
                              />
                            </span>
                          )}
                          {!hasChildren && <span className="w-5" />}
                          <FolderIcon className={cn('h-4 w-4', tree.hasProjects ? 'text-primary' : 'text-muted-foreground')} />
                          <span className={cn('flex-1 truncate', tree.hasProjects && 'font-medium')} title={folder}>
                            {folderName}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFolder(folder)
                              }}
                              title="删除"
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          </div>
                        </SidebarMenuSubButton>

                        {/* 子文件夹 */}
                        {isExpanded && tree.children.map(child => renderTreeNode(child))}
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
