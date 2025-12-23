import { useState, useEffect } from 'react'
import type { Project } from '@/types'
import { ProjectGrid } from '@/components/ProjectCard'
import { Button } from '@/components/ui/button'
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

  // 加载项目列表
  useEffect(() => {
    loadProjects()
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
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // 获取已保存的扫描目录
      const foldersResult = await window.electronAPI.getScanFolders()
      const folders = foldersResult.folders || []

      if (folders.length === 0) {
        // 没有配置扫描目录，使用模拟数据
        loadMockProjects()
        return
      }

      // 扫描所有目录
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
                id: btoa(p.path), // 使用路径作为 ID
                name: p.name,
                path: p.path,
                createdAt: new Date(), // TODO: 从文件系统获取
                updatedAt: new Date(),
                addedAt: new Date(),
                size: stats?.size || 0,
                hasNodeModules: stats?.hasNodeModules || false,
                gitBranch: gitInfo.branch,
                gitStatus: gitInfo.status as 'clean' | 'modified' | 'error',
                gitChanges: gitInfo.changes,
                packageManager: stats?.packageManager,
                favorite: false,
              } as Project
            })
          )
          allProjects.push(...projectsWithDetails)
        }
      }

      setProjects(allProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
      // 出错时使用模拟数据
      loadMockProjects()
    } finally {
      setLoading(false)
    }
  }

  const loadMockProjects = () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'project-mng',
        path: '/Users/zhoutao/code/electron/projectMng',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        addedAt: new Date('2024-01-15'),
        size: 1024 * 1024 * 256,
        hasNodeModules: true,
        gitBranch: 'main',
        gitStatus: 'clean',
        packageManager: 'pnpm',
        favorite: true,
      },
      {
        id: '2',
        name: 'my-blog',
        path: '/Users/zhoutao/code/my-blog',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        addedAt: new Date('2024-02-01'),
        size: 1024 * 1024 * 128,
        hasNodeModules: true,
        gitBranch: 'main',
        gitStatus: 'modified',
        gitChanges: 3,
        packageManager: 'npm',
        favorite: false,
      },
    ]
    setProjects(mockProjects)
  }

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
    // TODO: 重新获取项目信息
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
        console.log('Selected folders:', result.folders)
        // TODO: 添加选中的文件夹
      }
    } catch (error) {
      console.error('Failed to select folders:', error)
    }
  }

  const handleScanAll = async () => {
    setScanning(true)
    try {
      await loadProjects()
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              扫描中...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 排序 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            }}
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

          {/* 刷新 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanAll}
            disabled={scanning}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            刷新
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
