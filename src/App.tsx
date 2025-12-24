import { useState, useCallback, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ProjectListPage } from "@/components/ProjectListPage"
import { useFolderScanning } from "@/hooks/useFolderScanning"
import { useProjectLoading } from "@/hooks/useProjectLoading"

export function App() {
  const [selectedPath, setSelectedPath] = useState<string>("")

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
    setScannedDirs
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

  // 处理路径选择
  const handlePathSelect = useCallback((path: string) => {
    setSelectedPath(path)
  }, [])

  // 获取当前选中路径的项目
  const getSelectedPathData = useCallback(() => {
    if (!selectedPath) {
      return { projects: [], folderName: "", scanFolder: "" }
    }

    // 找到包含 selectedPath 的扫描根目录
    const scanFolder = Array.from(folderScannedDirs.keys()).find(folder =>
      selectedPath === folder || selectedPath.startsWith(folder + "/")
    )

    // 提取显示名称
    const folderName = selectedPath.split("/").pop() || selectedPath

    // 如果没有找到扫描根目录（还未扫描过），返回空项目列表
    if (!scanFolder) {
      return { projects: [], folderName, scanFolder: selectedPath }
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

    return { projects: filteredProjects, folderName, scanFolder }
  }, [selectedPath, folderScannedDirs, allProjects])

  const { projects: currentFolderProjects, folderName, scanFolder } = getSelectedPathData()

  // 获取当前扫描目录（用于扫描操作）
  const currentScanFolderForOps = scanFolder || selectedPath

  return (
    <SidebarProvider>
      <AppSidebar
        scannedDirs={getScannedDirs(currentScanFolderForOps)}
        projectPaths={allProjects.map(p => p.path)}
        onPathSelect={handlePathSelect}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    项目管理
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>我的项目</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <ProjectListPage
            allProjects={allProjects}
            setAllProjects={setAllProjects}
            currentFolderProjects={currentFolderProjects}
            currentScanFolder={currentScanFolderForOps}
            folderName={folderName}
            loading={loading}
            getCurrentScanState={getCurrentScanState}
            startScan={startScan}
            stopScan={stopScan}
            loadProjects={loadProjects}
            setInitialProjects={setInitialProjects}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
