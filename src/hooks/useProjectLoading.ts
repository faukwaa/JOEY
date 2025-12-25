import { useState, useCallback } from 'react'
import type { Project } from '@/types'

export function useProjectLoading() {
  const [loading, setLoading] = useState(true)

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
  const loadProjects = useCallback(async (
    onProjectsLoaded?: (projects: Project[]) => void,
    onScannedDirsLoaded?: (folder: string, dirs: string[]) => void
  ) => {
    setLoading(true)
    try {
      // 获取已保存的扫描目录
      const foldersResult = await window.electronAPI.getScanFolders()
      const folders = foldersResult.folders || []

      if (folders.length === 0) {
        // 没有配置扫描目录，显示空状态
        onProjectsLoaded?.([])
        return
      }

      // 从缓存加载
      const cache = await window.electronAPI.getProjectsCache()
      if (cache && cache.projects) {
        console.log('从缓存加载项目列表')
        let cachedProjects = convertCachedProjects(cache.projects)

        // 恢复收藏状态
        if (cache.favorites && Array.isArray(cache.favorites)) {
          cachedProjects = cachedProjects.map(p => ({
            ...p,
            favorite: cache.favorites!.includes(p.id)
          }))
        }

        onProjectsLoaded?.(cachedProjects)

        // 加载扫描过的目录
        // 优先使用 scannedDirsMap（新格式），回退到 scannedDirs（旧格式）
        const scannedDirsMap = cache.scannedDirsMap || {}
        const scannedDirs = cache.scannedDirs || []

        if (Object.keys(scannedDirsMap).length > 0) {
          // 使用新格式：从 scannedDirsMap 读取每个文件夹的扫描路径
          for (const folder of folders) {
            const folderDirs = scannedDirsMap[folder] || []
            onScannedDirsLoaded?.(folder, folderDirs)
          }
        } else if (scannedDirs.length > 0) {
          // 使用旧格式：为每个扫描根目录过滤出属于它的扫描路径
          for (const folder of folders) {
            const folderDirs = scannedDirs.filter((dir: string) =>
              dir === folder || dir.startsWith(folder + '/')
            )
            onScannedDirsLoaded?.(folder, folderDirs)
          }
        }
      } else {
        // 没有缓存，显示空状态
        onProjectsLoaded?.([])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      onProjectsLoaded?.([])
    } finally {
      setLoading(false)
    }
  }, [convertCachedProjects])

  return {
    loading,
    loadProjects
  }
}
