import { useState, useCallback, useEffect, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ProjectListPage } from "@/components/ProjectListPage"
import { ThemeProvider } from "@/components/theme-provider"
import { useFolderScanning } from "@/hooks/useFolderScanning"
import { useProjectLoading } from "@/hooks/useProjectLoading"

export function App() {
  const [selectedPath, setSelectedPath] = useState<string>("")
  const [highlightedProjectId, setHighlightedProjectId] = useState<string>("")

  const { loading, loadProjects } = useProjectLoading()
  const {
    allProjects,
    setAllProjects,
    folderScannedDirs,
    getCurrentScanState,
    startScan,
    stopScan,
    setInitialProjects,
    getScannedDirs,
    setScannedDirs,
    saveFavorites
  } = useFolderScanning()

  // 加载项目列表和扫描目录
  useEffect(() => {
    loadProjects(
      (projects) => {
        setInitialProjects(projects)
      },
      (folder: string, dirs: string[]) => {
        setScannedDirs(folder, dirs)
      }
    )
  }, [loadProjects, setInitialProjects, setScannedDirs])

  // 如果有扫描目录但当前没有选中路径，自动选中第一个
  useEffect(() => {
    if (!selectedPath && folderScannedDirs.size > 0) {
      const firstFolder = Array.from(folderScannedDirs.keys())[0]
      if (firstFolder) {
        setSelectedPath(firstFolder)
      }
    }
  // 依赖 folderScannedDirs 的引用，当它变化时触发
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderScannedDirs])

  // 处理路径选择
  const handlePathSelect = useCallback((path: string) => {
    setSelectedPath(path)
  }, [])

  // 获取当前选中路径的项目
  const getSelectedPathData = useCallback(() => {
    if (!selectedPath) {
      return { projects: [], folderName: "", scanFolder: "", rootFolderName: "" }
    }

    // 找到包含 selectedPath 的扫描根目录
    const scanFolder = Array.from(folderScannedDirs.keys()).find(folder =>
      selectedPath === folder || selectedPath.startsWith(folder + "/")
    )

    // 提取显示名称
    const folderName = selectedPath.split("/").pop() || selectedPath
    // 提取根目录名称（用于显示扫描状态）
    const rootFolderName = scanFolder ? scanFolder.split("/").pop() || scanFolder : folderName

    // 如果没有找到扫描根目录（还未扫描过），返回空项目列表
    if (!scanFolder) {
      return { projects: [], folderName, scanFolder: selectedPath, rootFolderName: folderName }
    }

    // 获取该扫描根目录下的所有项目
    const folderProjects = allProjects.filter(p => p.scanFolder === scanFolder)

    // 过滤出在 selectedPath 下的项目
    const filteredProjects = folderProjects.filter(p => {
      if (selectedPath === scanFolder) {
        return true
      }
      return p.path.startsWith(selectedPath + "/")
    })

    return { projects: filteredProjects, folderName, scanFolder, rootFolderName }
  }, [selectedPath, folderScannedDirs, allProjects])

  const { projects: currentFolderProjects, folderName, scanFolder, rootFolderName } = getSelectedPathData()

  // 获取当前扫描目录（用于扫描操作）
  const currentScanFolderForOps = scanFolder || selectedPath

  // 使用 useMemo 缓存传递给 sidebar 的数据，避免不必要的重新渲染
  const currentScannedDirs = useMemo(
    () => getScannedDirs(currentScanFolderForOps),
    [getScannedDirs, currentScanFolderForOps]
  )

  const allProjectPaths = useMemo(
    () => allProjects.map(p => p.path),
    [allProjects]
  )

  // 处理收藏项目选择
  const handleProjectSelect = useCallback((project: Project) => {
    // 找到项目所在的扫描目录
    const scanFolder = Array.from(folderScannedDirs.keys()).find(folder =>
      project.path.startsWith(folder + "/") || project.path === folder
    )

    if (scanFolder) {
      // 选择该扫描目录
      handlePathSelect(scanFolder)
      // 设置高亮项目
      setHighlightedProjectId(project.id)
      // 延迟清除高亮，以便用户能看到高亮效果
      setTimeout(() => {
        setHighlightedProjectId("")
      }, 2000)
    }
  }, [folderScannedDirs, handlePathSelect])

  return (
    <ThemeProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar
        scannedDirs={currentScannedDirs}
        projectPaths={allProjectPaths}
        allProjects={allProjects}
        onPathSelect={handlePathSelect}
        onProjectSelect={handleProjectSelect}
      />
      <SidebarInset className="h-full overflow-hidden">
        <ProjectListPage
          allProjects={allProjects}
          setAllProjects={setAllProjects}
          currentFolderProjects={currentFolderProjects}
          currentScanFolder={currentScanFolderForOps}
          folderName={folderName}
          rootFolderName={rootFolderName}
          loading={loading}
          getCurrentScanState={getCurrentScanState}
          startScan={startScan}
          stopScan={stopScan}
          loadProjects={loadProjects}
          setInitialProjects={setInitialProjects}
          saveFavorites={saveFavorites}
          highlightedProjectId={highlightedProjectId}
        />
      </SidebarInset>
    </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
