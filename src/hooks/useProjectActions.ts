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
  const handleRefreshProject = useCallback(async (project: Project, onUpdate?: (project: Project) => void) => {
    try {
      const result = await window.electronAPI.refreshProjectInfo(project.path)
      if (result.success && result.projectInfo && onUpdate) {
        const updatedProject: Project = {
          ...project,
          ...result.projectInfo,
          gitBranch: result.projectInfo.gitBranch,
          gitStatus: result.projectInfo.gitStatus,
          gitChanges: result.projectInfo.gitChanges
        }
        onUpdate(updatedProject)
      }
    } catch (error) {
      console.error('Failed to refresh project:', error)
    }
  }, [])

  // 删除项目
  const handleDeleteProject = useCallback((project: Project) => {
    console.log('Deleting project from list:', project.name)
    // 从项目列表中移除，不删除实际文件夹
  }, [])

  // 从磁盘删除项目
  const handleDeleteProjectFromDisk = useCallback(async (project: Project) => {
    try {
      const result = await window.electronAPI.deleteProjectFromDisk(project.path)
      return result
    } catch (error) {
      console.error('Failed to delete project from disk:', error)
      return { success: false, error: String(error) }
    }
  }, [])

  // 删除 node_modules
  const handleDeleteNodeModules = useCallback(async (project: Project, onUpdate?: (project: Project) => void) => {
    try {
      const result = await window.electronAPI.deleteNodeModules(project.path)
      if (result.success) {
        // 删除成功后刷新项目信息
        await handleRefreshProject(project, onUpdate)
      }
      return result
    } catch (error) {
      console.error('Failed to delete node_modules:', error)
      return { success: false, error: String(error) }
    }
  }, [handleRefreshProject])

  // 切换收藏状态
  const handleToggleFavorite = useCallback((project: Project, onToggle: (project: Project) => void) => {
    onToggle(project)
  }, [])

  return {
    handleOpenProject,
    handleRefreshProject,
    handleDeleteProject,
    handleDeleteProjectFromDisk,
    handleDeleteNodeModules,
    handleToggleFavorite
  }
}
