import { useState, useRef, useCallback } from 'react'
import type { Project } from '@/types'

// 目录扫描状态类型
export interface FolderScanState {
  scanning: boolean
  progress: { stage: string; current: number; total: number; message: string }
  cancelled: boolean
}

export function useFolderScanning() {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [folderScanStates, setFolderScanStates] = useState<Map<string, FolderScanState>>(new Map())
  const [folderScannedDirs, setFolderScannedDirs] = useState<Map<string, string[]>>(new Map())
  const scanningRefs = useRef<Map<string, boolean>>(new Map())

  // 获取当前目录的扫描状态
  const getCurrentScanState = useCallback((folder: string): FolderScanState => {
    return folderScanStates.get(folder) || {
      scanning: false,
      progress: { stage: '', current: 0, total: 0, message: '' },
      cancelled: false
    }
  }, [folderScanStates])

  // 获取当前目录的项目
  const getCurrentFolderProjects = useCallback((folder: string): Project[] => {
    return allProjects.filter(p => p.scanFolder === folder)
  }, [allProjects])

  // 开始扫描
  const startScan = useCallback(async (folder: string, onProgressUpdate?: () => void) => {
    if (!folder) return

    console.log('开始扫描:', folder)

    // 初始化当前目录的扫描状态
    setFolderScanStates(prev => {
      const newStates = new Map(prev)
      newStates.set(folder, {
        scanning: true,
        progress: { stage: 'starting', current: 0, total: 0, message: `准备扫描 ${folder.split('/').pop()}...` },
        cancelled: false
      })
      return newStates
    })
    scanningRefs.current.set(folder, true)

    // 清空该目录的项目列表，显示空状态页面（包括进度条）
    setAllProjects(prev => prev.filter(p => p.scanFolder !== folder))

    try {
      console.log('调用 window.electronAPI.scanProjects')
      const scanResult = await window.electronAPI.scanProjects([folder])
      console.log('scanProjects 返回结果:', scanResult)

      // 保存扫描过的目录
      if (scanResult.scannedDirs) {
        setFolderScannedDirs(prev => {
          const newMap = new Map(prev)
          newMap.set(folder, scanResult.scannedDirs)
          return newMap
        })
      }

      if (scanResult.projects && scanResult.projects.length > 0) {
        console.log(`找到 ${scanResult.projects.length} 个项目，开始获取详细信息`)

        const projectsWithDetails: Project[] = []

        for (let i = 0; i < scanResult.projects.length; i++) {
          const p = scanResult.projects[i] as { name: string; path: string }
          console.log(`处理第 ${i + 1}/${scanResult.projects.length} 个项目: ${p.name}`)

          // 检查是否已取消
          const currentState = folderScanStates.get(folder)
          if (currentState?.cancelled) {
            console.log('扫描已取消')
            setFolderScanStates(prev => {
              const newStates = new Map(prev)
              newStates.set(folder, {
                ...newStates.get(folder)!,
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
            scanFolder: folder,
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
            newStates.set(folder, {
              ...newStates.get(folder)!,
              progress: {
                stage: 'processing',
                current: projectsWithDetails.length,
                total: scanResult.projects.length,
                message: `正在处理: ${p.name}`
              }
            })
            return newStates
          })

          // 触发进度更新回调
          onProgressUpdate?.()
        }

        // 更新 allProjects，替换该目录的项目
        setAllProjects(prev => {
          const newProjects = prev.filter(p => p.scanFolder !== folder)
          newProjects.push(...projectsWithDetails)
          return newProjects
        })
        console.log(`扫描完成，找到 ${projectsWithDetails.length} 个项目`)

        // 保存到缓存
        try {
          const foldersResult = await window.electronAPI.getScanFolders()
          const folders = foldersResult.folders || []

          // 使用函数式更新获取最新的项目列表
          const serializedProjects = await new Promise<Project[]>((resolve) => {
            setAllProjects(prev => {
              const result = prev.filter(p => p.scanFolder !== folder).concat(projectsWithDetails)
              resolve(result)
              return result
            })
          })

          await window.electronAPI.saveProjectsCache(
            serializedProjects.map(p => ({
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
            })),
            folders
          )
          console.log('项目列表已保存到缓存')
        } catch (error) {
          console.error('保存缓存失败:', error)
        }
      } else {
        // 该目录没有项目，清空该目录的项目
        setAllProjects(prev => prev.filter(p => p.scanFolder !== folder))
      }
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      console.log('扫描 finally，结束扫描状态')
      // 结束当前目录的扫描状态
      setFolderScanStates(prev => {
        const newStates = new Map(prev)
        const currentState = newStates.get(folder)
        if (currentState) {
          newStates.set(folder, { ...currentState, scanning: false })
        }
        return newStates
      })
      scanningRefs.current.delete(folder)
    }
  }, [folderScanStates])

  // 停止扫描
  const stopScan = useCallback((folder: string) => {
    setFolderScanStates(prev => {
      const newStates = new Map(prev)
      const currentState = newStates.get(folder)
      if (currentState) {
        newStates.set(folder, { ...currentState, cancelled: true })
      }
      return newStates
    })
  }, [])

  // 设置初始项目
  const setInitialProjects = useCallback((projects: Project[]) => {
    setAllProjects(projects)
  }, [])

  // 获取某个目录的扫描路径
  const getScannedDirs = useCallback((folder: string): string[] => {
    return folderScannedDirs.get(folder) || []
  }, [folderScannedDirs])

  // 设置扫描路径（从缓存加载）
  const setScannedDirs = useCallback((folder: string, dirs: string[]) => {
    setFolderScannedDirs(prev => {
      const newMap = new Map(prev)
      newMap.set(folder, dirs)
      return newMap
    })
  }, [])

  return {
    allProjects,
    setAllProjects,
    folderScanStates,
    folderScannedDirs,
    getCurrentScanState,
    getCurrentFolderProjects,
    startScan,
    stopScan,
    setInitialProjects,
    getScannedDirs,
    setScannedDirs
  }
}
