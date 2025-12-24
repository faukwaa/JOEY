import { useState, useCallback, useEffect } from 'react'
import type { Project } from '@/types'
import { ProjectList } from '@/components/ProjectList'
import { ProjectControls } from '@/components/ProjectControls'
import { EmptyProjectState } from '@/components/EmptyProjectState'
import { ScanConfirmDialogs } from '@/components/ScanConfirmDialogs'
import { useProjectActions } from '@/hooks/useProjectActions'

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
  setInitialProjects
}: ProjectListPageProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [showRescanConfirm, setShowRescanConfirm] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'size'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { handleOpenProject, handleRefreshProject, handleDeleteProject, handleToggleFavorite } = useProjectActions()

  const currentScanState = getCurrentScanState(currentScanFolder)

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
  const handleToggleFavoriteWrapper = useCallback((project: Project) => {
    handleToggleFavorite(project, (proj) => {
      setAllProjects(allProjects.map(p =>
        p.id === proj.id ? { ...p, favorite: !p.favorite } : p
      ))
    })
  }, [allProjects, handleToggleFavorite, setAllProjects])

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
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* 控制栏 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">我的项目</h1>
          </div>
          <ProjectControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            onRescan={handleScanAll}
            projectCount={currentFolderProjects.length}
          />
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
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
          onRefresh={handleRefreshProject}
          onDelete={handleDeleteProject}
          onToggleFavorite={handleToggleFavoriteWrapper}
        />
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
