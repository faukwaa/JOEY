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
  PlusIcon,
  LoaderIcon,
  RefreshCwIcon,
} from 'lucide-react'

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'size'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [scanProgress, setScanProgress] = useState({ stage: '', current: 0, total: 0, message: '' })

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

  // 扫描项目（强制重新扫描）
  const scanProjects = useCallback(async (folders: string[]): Promise<Project[]> => {
    const allProjects: Project[] = []

    for (const folder of folders) {
      const scanResult = await window.electronAPI.scanProjects([folder])
      if (scanResult.projects && scanResult.projects.length > 0) {
        // 转换为 Project 类型并获取详细信息
        const projectsWithDetails = await Promise.all(
          scanResult.projects.map(async (p: { name: string; path: string }) => {
            // 获取 git 信息
            const gitInfo = await window.electronAPI.getGitInfo(p.path)

            // 获取项目文件信息
            const stats = await window.electronAPI.getProjectStats(p.path)

            return {
              id: encodeURIComponent(p.path),
              name: p.name,
              path: p.path,
              createdAt: new Date(),
              updatedAt: new Date(),
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
        allProjects.push(...projectsWithDetails)
      }
    }

    return allProjects
  }, [])

  // 加载项目列表（优先使用缓存）
  const loadProjects = useCallback(async (forceScan = false) => {
    setLoading(true)
    try {
      // 获取已保存的扫描目录
      const foldersResult = await window.electronAPI.getScanFolders()
      const folders = foldersResult.folders || []

      if (folders.length === 0) {
        // 没有配置扫描目录，显示空状态
        setProjects([])
        return
      }

      // 如果不是强制扫描，先尝试从缓存加载
      if (!forceScan) {
        const cache = await window.electronAPI.getProjectsCache()
        if (cache && cache.projects && cache.projects.length > 0) {
          // 检查缓存的文件夹是否与当前配置的文件夹一致
          const cachedFolders = cache.folders || []
          const foldersMatch = folders.length === cachedFolders.length &&
            folders.every((f: string) => cachedFolders.includes(f))

          if (foldersMatch) {
            console.log('从缓存加载项目列表')
            setProjects(convertCachedProjects(cache.projects))
            return
          }
        }
      }

      // 没有缓存或强制扫描，进行扫描
      console.log(forceScan ? '强制扫描项目...' : '首次扫描项目...')
      const scannedProjects = await scanProjects(folders)
      setProjects(scannedProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [convertCachedProjects, scanProjects])

  // 加载项目列表
  useEffect(() => {
    loadProjects(false)
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
      loadProjects(false)
    }

    window.addEventListener('refresh-projects', handleRefresh)
    return () => {
      window.removeEventListener('refresh-projects', handleRefresh)
    }
  }, [loadProjects])

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

  const handleAddProject = async () => {
    try {
      const result = await window.electronAPI.selectFolders()
      if (result.folders && result.folders.length > 0) {
        const newFolder = result.folders[0]
        // 保存到配置
        await window.electronAPI.addScanFolder(newFolder)
        // 重新加载列表
        await loadProjects(false)
        // 触发刷新事件
        window.dispatchEvent(new CustomEvent('refresh-projects'))
      }
    } catch (error) {
      console.error('Failed to select folders:', error)
    }
  }

  const handleScanAll = async () => {
    setScanning(true)
    setScanProgress({ stage: 'starting', current: 0, total: 0, message: '开始扫描...' })
    try {
      await loadProjects(true) // 强制扫描
    } catch (error) {
      console.error('Scan failed:', error)
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
            disabled={scanning}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            扫描
          </Button>

          {/* 添加项目 */}
          <Button size="sm" onClick={handleAddProject}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加项目
          </Button>
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <PlusIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">还没有项目</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            点击左侧的"添加扫描目录"按钮，选择要监控的项目文件夹。
          </p>
          <Button size="sm" onClick={handleAddProject}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加扫描目录
          </Button>
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
