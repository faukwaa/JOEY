import { useState, useCallback, useEffect } from 'react'
import type { Project } from '@/types'
import { ProjectList } from '@/components/ProjectList'
import { ProjectControls } from '@/components/ProjectControls'
import { EmptyProjectState } from '@/components/EmptyProjectState'
import { ScanConfirmDialogs } from '@/components/ScanConfirmDialogs'
import { useProjectActions } from '@/hooks/useProjectActions'
import { formatSize } from '@/lib/format'

interface ProjectListPageProps {
  allProjects: Project[]
  setAllProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void
  currentFolderProjects: Project[]
  currentScanFolder: string
  folderName: string
  rootFolderName: string  // 根目录名称（用于显示扫描状态）
  loading: boolean
  getCurrentScanState: (folder: string) => { scanning: boolean; progress: { stage: string; current: number; total: number; message: string }; cancelled: boolean }
  startScan: (folder: string, onProgressUpdate?: () => void) => Promise<void>
  stopScan: (folder: string) => void
  loadProjects: (onProjectsLoaded?: (projects: Project[]) => void, onScannedDirsLoaded?: (folder: string, dirs: string[]) => void) => Promise<void>
  setInitialProjects: (projects: Project[]) => void
  saveFavorites: () => Promise<void>
  highlightedProjectId?: string
}

export function ProjectListPage({
  allProjects,
  setAllProjects,
  currentFolderProjects,
  currentScanFolder,
  folderName,
  rootFolderName,
  loading,
  getCurrentScanState,
  startScan,
  stopScan,
  loadProjects,
  setInitialProjects,
  saveFavorites,
  highlightedProjectId
}: ProjectListPageProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [showRescanConfirm, setShowRescanConfirm] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'size'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { handleOpenProject, handleOpenTerminal, handleOpenVSCode, handleOpenQoder, handleRefreshProject, handleDeleteProject, handleDeleteProjectFromDisk, handleDeleteNodeModules } = useProjectActions()

  const currentScanState = getCurrentScanState(currentScanFolder)

  // 处理项目刷新并更新列表
  const handleRefreshAndUpdate = useCallback(async (project: Project) => {
    await handleRefreshProject(project, (updatedProject) => {
      setAllProjects(allProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      ))
    })
  }, [handleRefreshProject, allProjects, setAllProjects])

  // 处理删除 node_modules 并更新列表
  const handleDeleteNodeModulesAndUpdate = useCallback(async (project: Project) => {
    const result = await handleDeleteNodeModules(project, (updatedProject) => {
      setAllProjects(allProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      ))
    })
    if (!result.success) {
      console.error('Failed to delete node_modules:', result.error)
    }
  }, [handleDeleteNodeModules, allProjects, setAllProjects])

  // 处理从磁盘删除项目
  const handleDeleteFromDiskAndUpdate = useCallback(async (project: Project) => {
    const result = await handleDeleteProjectFromDisk(project)
    if (result.success) {
      // 从项目列表中移除
      setAllProjects(allProjects.filter(p => p.id !== project.id))
    } else {
      console.error('Failed to delete project from disk:', result.error)
    }
    return result
  }, [handleDeleteProjectFromDisk, allProjects, setAllProjects])

  // 处理从列表中删除项目
  const handleDeleteFromListAndUpdate = useCallback((project: Project) => {
    handleDeleteProject(project)
    // 从项目列表中移除
    setAllProjects(allProjects.filter(p => p.id !== project.id))
  }, [handleDeleteProject, allProjects, setAllProjects])

  // 排序项目
  const sortedProjects = [...currentFolderProjects].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime()
        break
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 计算总大小
  const totalSize = currentFolderProjects.reduce((sum, project) => sum + project.size, 0)

  // 监听扫描进度
  useEffect(() => {
    const cleanup = window.electronAPI.onScanProgress(() => {
      return
    })
    return cleanup
  }, [])

  // 监听自定义事件来刷新项目列表
  useEffect(() => {
    const handleRefresh = () => {
      loadProjects((projects) => {
        setInitialProjects(projects)
      })
    }

    window.addEventListener('refresh-projects', handleRefresh)
    return () => {
      window.removeEventListener('refresh-projects', handleRefresh)
    }
  }, [loadProjects, setInitialProjects])

  // 处理项目操作
  const handleToggleFavoriteWrapper = useCallback(async (project: Project) => {
    // 先计算更新后的项目列表
    const updatedProjects = allProjects.map(p =>
      p.id === project.id ? { ...p, favorite: !p.favorite } : p
    )

    // 更新状态
    setAllProjects(updatedProjects)

    // 保存收藏状态到缓存（直接传递更新后的项目列表）
    await saveFavorites(updatedProjects)
  }, [allProjects, setAllProjects, saveFavorites])

  // 处理停止扫描
  const handleStopScan = () => {
    setShowStopConfirm(true)
  }

  const confirmStopScan = () => {
    setShowStopConfirm(false)
    stopScan(currentScanFolder)
  }

  const cancelStopScan = () => {
    setShowStopConfirm(false)
  }

  // 处理扫描
  const confirmRescan = () => {
    setShowRescanConfirm(false)
    startScan(currentScanFolder)
  }

  const cancelRescan = () => {
    setShowRescanConfirm(false)
  }

  const handleScanAll = () => {
    if (!currentScanFolder) {
      console.warn('没有选中的扫描目录')
      return
    }
    // 如果当前目录正在扫描，显示停止确认对话框
    if (currentScanState.scanning) {
      handleStopScan()
      return
    }
    // 如果当前目录已有项目，显示重新扫描确认对话框
    if (currentFolderProjects.length > 0) {
      setShowRescanConfirm(true)
      return
    }
    // 否则直接开始扫描
    startScan(currentScanFolder)
  }

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden relative">
      {/* 项目列表区域 - 可滚动 */}
      <div className="flex-1 overflow-auto px-4 pt-16 pb-16">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : currentScanState.scanning ? (
          // 扫描中，显示进度条（即使有旧项目也显示进度）
          <EmptyProjectState
            currentFolder={folderName}
            scanningFolderName={rootFolderName}
            isScanning={true}
            scanProgress={currentScanState.progress}
            onScan={handleScanAll}
          />
        ) : currentFolderProjects.length === 0 ? (
          <EmptyProjectState
            currentFolder={folderName}
            isScanning={false}
            scanProgress={currentScanState.progress}
            onScan={handleScanAll}
          />
        ) : (
          <ProjectList
            projects={sortedProjects}
            onOpen={handleOpenProject}
            onOpenTerminal={handleOpenTerminal}
            onOpenVSCode={handleOpenVSCode}
            onOpenQoder={handleOpenQoder}
            onRefresh={handleRefreshAndUpdate}
            onDelete={handleDeleteFromListAndUpdate}
            onDeleteFromDisk={handleDeleteFromDiskAndUpdate}
            onToggleFavorite={handleToggleFavoriteWrapper}
            onDeleteNodeModules={handleDeleteNodeModulesAndUpdate}
            highlightedProjectId={highlightedProjectId}
          />
        )}
      </div>

      {/* 控制栏 - 固定顶部，半透明模糊 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end px-4 py-3 bg-background/40 backdrop-blur-lg border-b">
        <ProjectControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          onRescan={handleScanAll}
          projectCount={currentFolderProjects.length}
        />
      </div>

      {/* 统计信息 - 固定底部，半透明模糊 */}
      {currentFolderProjects.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 text-sm text-muted-foreground bg-background/40 backdrop-blur-lg border-t">
          <span>
            共 <span className="font-semibold text-foreground">{currentFolderProjects.length}</span> 个项目
          </span>
          <span>
            占用 <span className="font-semibold text-foreground">{formatSize(totalSize)}</span>
          </span>
        </div>
      )}

      {/* 确认对话框 */}
      <ScanConfirmDialogs
        showStopConfirm={showStopConfirm}
        showRescanConfirm={showRescanConfirm}
        scanProgressCurrent={currentScanState.progress.current}
        currentFolder={folderName}
        onStopConfirm={confirmStopScan}
        onStopCancel={cancelStopScan}
        onRescanConfirm={confirmRescan}
        onRescanCancel={cancelRescan}
      />
    </div>
  )
}
