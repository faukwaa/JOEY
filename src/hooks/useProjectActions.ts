import { useCallback } from 'react'
import type { Project } from '@/types'

export function useProjectActions() {
  // 打开项目文件夹
  const handleOpenProject = useCallback(async (project: Project) => {
    try {
      const result = await window.electronAPI.openProjectFolder(project.path)
      if (result.success) {
        console.log('Project opened successfully')
      }
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }, [])

  // 刷新单个项目
  const handleRefreshProject = useCallback(async (project: Project) => {
    console.log('Refreshing project:', project.name)
    // TODO: 重新获取单个项目信息
  }, [])

  // 删除项目
  const handleDeleteProject = useCallback((project: Project) => {
    console.log('Deleting project:', project.name)
    // TODO: 实现删除逻辑
  }, [])

  // 切换收藏状态
  const handleToggleFavorite = useCallback((project: Project, onToggle: (project: Project) => void) => {
    onToggle(project)
  }, [])

  return {
    handleOpenProject,
    handleRefreshProject,
    handleDeleteProject,
    handleToggleFavorite
  }
}
