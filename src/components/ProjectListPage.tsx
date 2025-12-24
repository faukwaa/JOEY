import { useState, useEffect, useCallback, useRef } from 'react'
import type { Project } from '@/types'
import { ProjectGrid } from '@/components/ProjectCard'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  SortAscIcon,
  SortDescIcon,
  RefreshCwIcon,
} from 'lucide-react'

// 目录扫描状态类型
interface FolderScanState {
  scanning: boolean
  progress: { stage: string; current: number; total: number; message: string }
  cancelled: boolean
}

export function ProjectListPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]) // 保存所有目录的项目
  const [loading, setLoading] = useState(true)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [showRescanConfirm, setShowRescanConfirm] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'size'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentScanFolder, setCurrentScanFolder] = useState<string>('') // 当前选中的扫描目录
  const [folderScanStates, setFolderScanStates] = useState<Map<string, FolderScanState>>(new Map()) // 每个目录的扫描状态
  const scanningRefs = useRef<Map<string, boolean>>(new Map()) // 每个目录的扫描状态 ref

  // 获取当前目录的项目
  const currentFolderProjects = allProjects.filter(p => p.scanFolder === currentScanFolder)

  // 获取当前目录的扫描状态
  const currentScanState = folderScanStates.get(currentScanFolder) || {
    scanning: false,
    progress: { stage: '', current: 0, total: 0, message: '' },
    cancelled: false
  }

  // 将缓存数据转换为 Project 类型
  const convertCachedProjects = useCallback((cachedProjects: unknown[]): Project[] => {
    return cachedProjects.map((p: unknown) => {
      const project = p as {
        path: string
        name: string
        scanFolder?: string
        createdAt?: string
        updatedAt?: string
        addedAt?: string
        size?: number
        hasNodeModules?: boolean
        gitBranch?: string
        gitStatus?: string
        gitChanges?: number
        packageManager?: string
        favorite?: boolean
      }
      return {
        id: encodeURIComponent(project.path),
        name: project.name,
        path: project.path,
        scanFolder: project.scanFolder,
        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
        updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
        addedAt: project.addedAt ? new Date(project.addedAt) : new Date(),
        size: project.size || 0,
        hasNodeModules: project.hasNodeModules || false,
        gitBranch: project.gitBranch,
        gitStatus: project.gitStatus as 'clean' | 'modified' | 'error' | 'no-git' | undefined,
        gitChanges: project.gitChanges,
        packageManager: project.packageManager as 'npm' | 'yarn' | 'pnpm' | 'bun' | undefined,
        favorite: project.favorite || false,
      }
    })
  }, [])

  // 加载项目列表（只从缓存加载，不自动扫描）
  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      // 获取已保存的扫描目录
      const foldersResult = await window.electronAPI.getScanFolders()
      const folders = foldersResult.folders || []

      if (folders.length === 0) {
        // 没有配置扫描目录，显示空状态
        setAllProjects([])
        return
      }

      // 从缓存加载
      const cache = await window.electronAPI.getProjectsCache()
      if (cache && cache.projects) {
        console.log('从缓存加载项目列表')
        const cachedProjects = convertCachedProjects(cache.projects)
        setAllProjects(cachedProjects)
      } else {
        // 没有缓存，显示空状态
        setAllProjects([])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      setAllProjects([])
    } finally {
      setLoading(false)
    }
  }, [convertCachedProjects])

  // 加载项目列表
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 监听扫描进度
  useEffect(() => {
    const cleanup = window.electronAPI.onScanProgress(() => {
      // 忽略主进程的所有进度事件，每个目录的扫描状态由前端独立维护
      return
    })
    return cleanup
  }, [])

  // 监听自定义事件来刷新项目列表
  useEffect(() => {
    const handleRefresh = () => {
      loadProjects()
    }

    window.addEventListener('refresh-projects', handleRefresh)
    return () => {
      window.removeEventListener('refresh-projects', handleRefresh)
    }
  }, [loadProjects])

  // 监听选中的扫描目录变化
  useEffect(() => {
    const handleSelectedFolder = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      const folder = customEvent.detail
      setCurrentScanFolder(folder)
    }

    window.addEventListener('selected-scan-folder', handleSelectedFolder)
    return () => {
      window.removeEventListener('selected-scan-folder', handleSelectedFolder)
    }
  }, [])

  // 排序项目（对当前目录的项目排序）
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

  // 处理项目操作
  const handleOpenProject = async (project: Project) => {
    try {
      const result = await window.electronAPI.openProjectFolder(project.path)
      if (result.success) {
        console.log('Project opened successfully')
      }
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }

  const handleRefreshProject = async (project: Project) => {
    console.log('Refreshing project:', project.name)
    // TODO: 重新获取单个项目信息
  }

  const handleDeleteProject = (project: Project) => {
    console.log('Deleting project:', project.name)
    // TODO: 实现删除逻辑
  }

  const handleToggleFavorite = (project: Project) => {
    setAllProjects(allProjects.map(p =>
      p.id === project.id ? { ...p, favorite: !p.favorite } : p
    ))
  }

  const handleStopScan = () => {
    setShowStopConfirm(true)
  }

  const confirmStopScan = () => {
    setShowStopConfirm(false)
    // 标记当前目录的扫描为已取消
    setFolderScanStates(prev => {
      const newStates = new Map(prev)
      const currentState = newStates.get(currentScanFolder)
      if (currentState) {
        newStates.set(currentScanFolder, { ...currentState, cancelled: true })
      }
      return newStates
    })
  }

  const cancelStopScan = () => {
    setShowStopConfirm(false)
  }

  const confirmRescan = () => {
    setShowRescanConfirm(false)
    startScan()
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
    startScan()
  }

  const startScan = async () => {
    if (!currentScanFolder) return

    console.log('开始扫描:', currentScanFolder)

    // 初始化当前目录的扫描状态
    setFolderScanStates(prev => {
      const newStates = new Map(prev)
      newStates.set(currentScanFolder, {
        scanning: true,
        progress: { stage: 'starting', current: 0, total: 0, message: `准备扫描 ${currentScanFolder.split('/').pop()}...` },
        cancelled: false
      })
      return newStates
    })
    scanningRefs.current.set(currentScanFolder, true)

    setLoading(false)

    try {
      console.log('调用 window.electronAPI.scanProjects')
      // 只扫描选中的目录
      const scanResult = await window.electronAPI.scanProjects([currentScanFolder])
      console.log('scanProjects 返回结果:', scanResult)

      if (scanResult.projects && scanResult.projects.length > 0) {
        console.log(`找到 ${scanResult.projects.length} 个项目，开始获取详细信息`)

        // 转换为 Project 类型并获取详细信息
        const projectsWithDetails: Project[] = []

        for (let i = 0; i < scanResult.projects.length; i++) {
          const p = scanResult.projects[i] as { name: string; path: string }
          console.log(`处理第 ${i + 1}/${scanResult.projects.length} 个项目: ${p.name}`)

          // 检查是否已取消
          const currentState = folderScanStates.get(currentScanFolder)
          if (currentState?.cancelled) {
            console.log('扫描已取消')
            setFolderScanStates(prev => {
              const newStates = new Map(prev)
              newStates.set(currentScanFolder, {
                ...newStates.get(currentScanFolder)!,
                progress: { stage: 'cancelled', current: projectsWithDetails.length, total: scanResult.projects.length, message: '扫描已取消' }
              })
              return newStates
            })
            break
          }

          console.log('  获取 git info...')
          const gitInfo = await window.electronAPI.getGitInfo(p.path)
          console.log('  获取 stats...')
          const stats = await window.electronAPI.getProjectStats(p.path)

          const project = {
            id: encodeURIComponent(p.path),
            name: p.name,
            path: p.path,
            scanFolder: currentScanFolder,
            createdAt: stats?.createdAt ? new Date(stats.createdAt) : new Date(),
            updatedAt: stats?.updatedAt ? new Date(stats.updatedAt) : new Date(),
            addedAt: new Date(),
            size: stats?.size || 0,
            hasNodeModules: stats?.hasNodeModules || false,
            gitBranch: gitInfo.branch,
            gitStatus: gitInfo.status as 'clean' | 'modified' | 'error' | 'no-git',
            gitChanges: gitInfo.changes,
            packageManager: stats?.packageManager,
            favorite: false,
          } as Project

          projectsWithDetails.push(project)
          console.log(`  项目 ${p.name} 处理完成`)

          // 更新当前目录的进度
          setFolderScanStates(prev => {
            const newStates = new Map(prev)
            newStates.set(currentScanFolder, {
              ...newStates.get(currentScanFolder)!,
              progress: {
                stage: 'processing',
                current: projectsWithDetails.length,
                total: scanResult.projects.length,
                message: `正在处理: ${p.name}`
              }
            })
            return newStates
          })
        }

        // 更新 allProjects，替换该目录的项目
        const newAllProjects = allProjects.filter(p => p.scanFolder !== currentScanFolder)
        newAllProjects.push(...projectsWithDetails)
        setAllProjects(newAllProjects)
        console.log(`扫描完成，找到 ${projectsWithDetails.length} 个项目`)

        // 保存到缓存（包括 scanFolder 信息）
        try {
          // 获取当前所有扫描目录
          const foldersResult = await window.electronAPI.getScanFolders()
          const folders = foldersResult.folders || []
          // 保存序列化后的项目数据
          const serializedProjects = newAllProjects.map(p => ({
            name: p.name,
            path: p.path,
            scanFolder: p.scanFolder,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            addedAt: p.addedAt.toISOString(),
            size: p.size,
            hasNodeModules: p.hasNodeModules,
            gitBranch: p.gitBranch,
            gitStatus: p.gitStatus,
            gitChanges: p.gitChanges,
            packageManager: p.packageManager,
            favorite: p.favorite,
          }))
          await window.electronAPI.saveProjectsCache(serializedProjects, folders)
          console.log('项目列表已保存到缓存')
        } catch (error) {
          console.error('保存缓存失败:', error)
        }
      } else {
        // 该目录没有项目，清空该目录的项目
        const newAllProjects = allProjects.filter(p => p.scanFolder !== currentScanFolder)
        setAllProjects(newAllProjects)
      }
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      console.log('扫描 finally，结束扫描状态')
      // 结束当前目录的扫描状态
      setFolderScanStates(prev => {
        const newStates = new Map(prev)
        const currentState = newStates.get(currentScanFolder)
        if (currentState) {
          newStates.set(currentScanFolder, { ...currentState, scanning: false })
        }
        return newStates
      })
      scanningRefs.current.delete(currentScanFolder)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* 控制栏 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">我的项目</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 排序 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  {sortOrder === 'asc' ? (
                    <SortAscIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDescIcon className="h-4 w-4 mr-2" />
                  )}
                  {sortBy === 'name' && '按名称'}
                  {sortBy === 'size' && '按大小'}
                  {sortBy === 'createdAt' && '按创建时间'}
                  {sortBy === 'updatedAt' && '按更新时间'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  按名称
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('size')}>
                  按大小
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('createdAt')}>
                  按创建时间
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('updatedAt')}>
                  按更新时间
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? '降序' : '升序'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 重新扫描 - 只在有项目时显示 */}
            {currentFolderProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleScanAll}
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                重新扫描
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : currentFolderProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <h3 className="text-lg font-semibold mb-2">
            {currentScanFolder ? `${currentScanFolder.split('/').pop()} 没有找到项目` : '还没有项目'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            {currentScanFolder
              ? '点击"立即扫描"按钮扫描当前选中的目录'
              : '在左侧选择一个扫描目录'
            }
          </p>
          {/* 进度条 */}
          {currentScanState.scanning && (
            <div className="flex flex-col gap-2 w-full max-w-md mb-4 animate-in fade-in duration-500">
              <div className="text-sm text-muted-foreground">
                {currentScanState.progress.message || '扫描中...'}
                {currentScanState.progress.total > 0 && (
                  <span> ({currentScanState.progress.current}/{currentScanState.progress.total})</span>
                )}
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                {currentScanState.progress.stage === 'processing' && currentScanState.progress.total > 0 ? (
                  <div
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.round((currentScanState.progress.current / currentScanState.progress.total) * 100)}%` }}
                  />
                ) : (
                  <div className="bg-primary h-full" style={{ width: '0%' }} />
                )}
              </div>
            </div>
          )}
          {currentScanFolder && (
            <Button
              size="sm"
              onClick={handleScanAll}
              variant={currentScanState.scanning ? "destructive" : "default"}
            >
              {currentScanState.scanning ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  停止扫描
                </>
              ) : (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  立即扫描
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <ProjectGrid
          projects={sortedProjects}
          onOpen={handleOpenProject}
          onRefresh={handleRefreshProject}
          onDelete={handleDeleteProject}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* 停止扫描确认对话框 */}
      <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停止扫描？</AlertDialogTitle>
            <AlertDialogDescription>
              当前已扫描 {currentScanState.progress.current} 个项目，停止后将保留这些已扫描的项目，未扫描的项目将被忽略。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelStopScan}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStopScan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认停止
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重新扫描确认对话框 */}
      <AlertDialog open={showRescanConfirm} onOpenChange={setShowRescanConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重新扫描？</AlertDialogTitle>
            <AlertDialogDescription>
              重新扫描将清空当前项目列表并重新扫描 {currentScanFolder?.split('/').pop()} 目录。此操作会覆盖之前的项目数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRescan}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRescan}>
              确认扫描
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
