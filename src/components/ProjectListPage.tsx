import { useState, useEffect, useCallback } from 'react'
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
  SortAscIcon,
  SortDescIcon,
  LoaderIcon,
  RefreshCwIcon,
} from 'lucide-react'

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([]) // 保存所有项目
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'size'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [scanProgress, setScanProgress] = useState({ stage: '', current: 0, total: 0, message: '' })
  const [currentScanFolder, setCurrentScanFolder] = useState<string>('') // 当前选中的扫描目录

  // 将缓存数据转换为 Project 类型
  const convertCachedProjects = useCallback((cachedProjects: unknown[]): Project[] => {
    return cachedProjects.map((p: unknown) => {
      const project = p as {
        path: string
        name: string
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
        createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
        updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
        addedAt: project.addedAt ? new Date(project.addedAt) : new Date(),
        size: project.size || 0,
        hasNodeModules: project.hasNodeModules || false,
        gitBranch: project.gitBranch,
        gitStatus: project.gitStatus,
        gitChanges: project.gitChanges,
        packageManager: project.packageManager,
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
        setProjects([])
        return
      }

      // 从缓存加载
      const cache = await window.electronAPI.getProjectsCache()
      if (cache && cache.projects) {
        console.log('从缓存加载项目列表')
        const cachedProjects = convertCachedProjects(cache.projects)
        setAllProjects(cachedProjects)
        // 如果有选中的扫描目录，只显示该目录的项目
        if (currentScanFolder) {
          const filtered = cachedProjects.filter(p => p.scanFolder === currentScanFolder)
          setProjects(filtered)
        } else {
          setProjects(cachedProjects)
        }
      } else {
        // 没有缓存，显示空状态
        setAllProjects([])
        setProjects([])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      setAllProjects([])
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [convertCachedProjects, currentScanFolder])

  // 加载项目列表
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 监听扫描进度
  useEffect(() => {
    const cleanup = window.electronAPI.onScanProgress((progress) => {
      setScanProgress(progress)
      if (progress.stage === 'complete') {
        setScanning(false)
      }
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

  // 监听过滤事件
  useEffect(() => {
    const handleFilter = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      const folder = customEvent.detail
      // 过滤项目：只显示该目录下的项目
      if (folder) {
        const filtered = allProjects.filter(p => p.scanFolder === folder)
        setProjects(filtered)
      }
    }

    window.addEventListener('filter-projects-by-folder', handleFilter)
    return () => {
      window.removeEventListener('filter-projects-by-folder', handleFilter)
    }
  }, [allProjects])

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

  // 排序项目
  const sortedProjects = [...projects].sort((a, b) => {
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
    setProjects(projects.map(p =>
      p.id === project.id ? { ...p, favorite: !p.favorite } : p
    ))
  }

  const handleScanAll = async () => {
    if (!currentScanFolder) {
      console.warn('没有选中的扫描目录')
      return
    }
    // 停止加载状态，开始扫描状态
    setLoading(false)
    setScanning(true)
    setScanProgress({ stage: 'starting', current: 0, total: 0, message: `扫描 ${currentScanFolder}...` })
    try {
      // 只扫描选中的目录
      const scanResult = await window.electronAPI.scanProjects([currentScanFolder])
      if (scanResult.projects && scanResult.projects.length > 0) {
        // 转换为 Project 类型并获取详细信息
        const projectsWithDetails = await Promise.all(
          scanResult.projects.map(async (p: { name: string; path: string }) => {
            const gitInfo = await window.electronAPI.getGitInfo(p.path)
            const stats = await window.electronAPI.getProjectStats(p.path)

            return {
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
          })
        )

        // 更新 allProjects，替换该目录的项目
        const newAllProjects = allProjects.filter(p => p.scanFolder !== currentScanFolder)
        newAllProjects.push(...projectsWithDetails)
        setAllProjects(newAllProjects)
        setProjects(projectsWithDetails)
      } else {
        // 该目录没有项目，清空显示
        const newAllProjects = allProjects.filter(p => p.scanFolder !== currentScanFolder)
        setAllProjects(newAllProjects)
        setProjects([])
      }
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">我的项目</h1>
          {scanning && (
            <div className="flex items-center gap-2 text-sm">
              <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">{scanProgress.message || '扫描中...'}</span>
              {scanProgress.current > 0 && (
                <span className="text-muted-foreground">
                  ({scanProgress.current}/{scanProgress.total})
                </span>
              )}
            </div>
          )}
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

          {/* 扫描 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanAll}
            disabled={scanning || !currentScanFolder}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? '扫描中...' : '立即扫描'}
          </Button>
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : scanning ? (
        // 扫描中，显示进度
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <LoaderIcon className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">正在扫描项目</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {scanProgress.message || '扫描中...'}
          </p>
          {scanProgress.current > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              已扫描: {scanProgress.current}/{scanProgress.total}
            </p>
          )}
        </div>
      ) : projects.length === 0 ? (
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
          {currentScanFolder && (
            <Button size="sm" onClick={handleScanAll} disabled={scanning}>
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
              立即扫描
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
    </div>
  )
}
