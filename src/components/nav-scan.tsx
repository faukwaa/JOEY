import { FolderIcon, Trash2Icon, PlusIcon, ChevronRightIcon } from "lucide-react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
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
import type { Project } from "@/types"

interface NavScanProps {
  scannedDirs: string[]
  projectPaths: string[]
  allProjects: Project[]
  onPathSelect: (path: string) => void
  onProjectsChange?: (projects: Project[]) => void
}

export function NavScan({ scannedDirs, projectPaths, allProjects, onPathSelect, onProjectsChange }: NavScanProps) {
  const { t } = useTranslation()
  const [scanFolders, setScanFolders] = useState<string[]>([])
  const [selectedPath, setSelectedPath] = useState<string>("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { buildTree } = useDirectoryTree()
  const hasInitialized = useRef(false)

  const handleSelectPath = useCallback((path: string) => {
    setSelectedPath(path)
    // 通知项目列表当前选中的目录（用于扫描）
    window.dispatchEvent(new CustomEvent('selected-scan-folder', { detail: path }))
    // 通知项目列表过滤显示该目录的项目
    onPathSelect(path)
  }, [onPathSelect])

  // 构建所有扫描目录的树（不包含展开状态，展开状态由 expandedFolders 管理）
  const folderTreesData = useMemo(() => {
    const result: { folder: string; tree: TreeNode }[] = []
    for (const folder of scanFolders) {
      const dirsToUse = scannedDirs.length > 0 ? scannedDirs : projectPaths
      const tree = buildTree(dirsToUse, folder, projectPaths)
      result.push({ folder, tree })
    }
    return result
  }, [scanFolders, scannedDirs, projectPaths, buildTree])

  // 加载已保存的扫描目录
  useEffect(() => {
    let cancelled = false

    const loadScanFolders = async () => {
      try {
        const result = await window.electronAPI.getScanFolders()
        if (!cancelled) {
          const folders = result.folders || []
          setScanFolders(folders)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("加载扫描目录失败:", error)
        }
      }
    }

    loadScanFolders()

    return () => {
      cancelled = true
    }
  }, [])

  // 如果扫描目录列表变化且当前没有选中，选中第一个
  useEffect(() => {
    if (!hasInitialized.current && scanFolders.length > 0 && !selectedPath) {
      hasInitialized.current = true
      const firstFolder = scanFolders[0]
      // 使用 setTimeout 延迟状态更新以避免 cascading renders
      setTimeout(() => {
        setSelectedPath(firstFolder)
        // 通知项目列表当前选中的目录（用于扫描）
        window.dispatchEvent(new CustomEvent('selected-scan-folder', { detail: firstFolder }))
        // 通知项目列表过滤显示该目录的项目
        onPathSelect(firstFolder)
      }, 0)
    }
  }, [scanFolders, selectedPath, onPathSelect])

  const handleAddFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolders()
      if (result.folders && result.folders.length > 0) {
        const newFolder = result.folders[0]
        // 保存到配置
        await window.electronAPI.addScanFolder(newFolder)
        // 重新加载列表
        const loadResult = await window.electronAPI.getScanFolders()
        const folders = loadResult.folders || []
        setScanFolders(folders)
        // 选中新添加的目录
        handleSelectPath(newFolder)
      }
    } catch (error) {
      console.error("添加扫描目录失败:", error)
    }
  }

  const handleRemoveFolder = async (folderPath: string) => {
    try {
      // 找出属于该扫描目录的所有项目
      const projectsToRemove = allProjects.filter(p => p.scanFolder === folderPath || p.path.startsWith(folderPath))

      // 从缓存中删除这些项目
      if (projectsToRemove.length > 0 && onProjectsChange) {
        const updatedProjects = allProjects.filter(p => p.scanFolder !== folderPath && !p.path.startsWith(folderPath))
        onProjectsChange(updatedProjects)

        // 保存更新后的项目缓存
        const cache = await window.electronAPI.getProjectsCache()
        if (cache) {
          // 移除属于该扫描目录的项目
          const filteredProjects = (cache.projects || []).filter((p: Project) =>
            p.scanFolder !== folderPath && !p.path.startsWith(folderPath)
          )
          const filteredDirs = (cache.scannedDirs || []).filter((d: string) => !d.startsWith(folderPath))
          // 移除该扫描目录的映射
          const updatedScannedDirsMap = cache.scannedDirsMap || {}
          delete updatedScannedDirsMap[folderPath]

          await window.electronAPI.saveProjectsCache(
            filteredProjects,
            cache.folders || [],
            filteredDirs,
            undefined,
            cache.favorites,
            updatedScannedDirsMap
          )
        }
      }

      // 从配置中移除扫描目录
      await window.electronAPI.removeScanFolder(folderPath)

      // 重新加载列表
      const loadResult = await window.electronAPI.getScanFolders()
      const folders = loadResult.folders || []
      setScanFolders(folders)

      // 如果删除的是当前选中的，选中第一个
      if (selectedPath === folderPath) {
        const remaining = folders.filter(f => f !== folderPath)
        if (remaining.length > 0) {
          handleSelectPath(remaining[0])
        } else {
          setSelectedPath('')
          onPathSelect('')
        }
      }
    } catch (error) {
      console.error("删除扫描目录失败:", error)
    }
  }

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

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
              {t('scan.addFolder')}
            </Button>
          </div>

          {/* 显示已保存的扫描目录 */}
          {scanFolders.length > 0 && (
            <SidebarMenu>
              {folderTreesData.map(({ folder, tree }) => {
                const folderName = folder.split('/').pop() || folder
                const isSelected = selectedPath === folder
                const isExpanded = expandedFolders.has(folder)
                // 只显示非项目文件夹作为子节点
                const hasExpandableChildren = tree.children.some(child => !projectPaths.includes(child.path))

                // 递归渲染树节点
                const renderTreeNode = (node: TreeNode): React.ReactNode => {
                  const nodeHasExpandableChildren = node.children.some(child => !projectPaths.includes(child.path))
                  const nodeIsSelected = selectedPath === node.path
                  const nodeIsExpanded = expandedFolders.has(node.path)

                  return (
                    <div key={node.path}>
                      <SidebarMenuSubButton
                        className={cn(
                          "group/data-[collapsible=icon]:hidden",
                          nodeIsSelected && "bg-accent"
                        )}
                        style={{ paddingLeft: `${(node.depth + 1) * 12}px` }}
                        onClick={() => handleSelectPath(node.path)}
                      >
                        {nodeHasExpandableChildren && (
                          <span
                            className="flex items-center justify-center w-4 h-4 rounded hover:bg-muted mr-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFolder(node.path)
                            }}
                          >
                            <ChevronRightIcon
                              className={cn(
                                'h-3 w-3 transition-transform',
                                nodeIsExpanded && 'transform rotate-90'
                              )}
                            />
                          </span>
                        )}
                        {!nodeHasExpandableChildren && <span className="w-5" />}
                        <FolderIcon className={cn('h-4 w-4', node.hasProjects ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('flex-1 truncate', node.hasProjects && 'font-medium')}>
                          {node.name}
                        </span>
                      </SidebarMenuSubButton>

                      {/* 展开的子节点 - 只显示非项目文件夹 */}
                      {nodeIsExpanded && node.children
                        .filter(child => !projectPaths.includes(child.path))
                        .map(child => renderTreeNode(child))
                      }
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
                            "group/data-[collapsible=icon]:hidden group",
                            isSelected && "bg-accent"
                          )}
                          onClick={() => handleSelectPath(folder)}
                        >
                          {hasExpandableChildren && (
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
                          {!hasExpandableChildren && <span className="w-5" />}
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
                              title={t('scan.delete')}
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          </div>
                        </SidebarMenuSubButton>

                        {/* 子文件夹 - 只显示非项目文件夹 */}
                        {isExpanded && tree.children
                          .filter(child => !projectPaths.includes(child.path))
                          .map(child => renderTreeNode(child))
                        }
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
