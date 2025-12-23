import { ScanIcon, FolderIcon, Trash2Icon, PlusIcon } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export function NavScan() {
  const [scanFolders, setScanFolders] = useState<string[]>([])

  // 加载已保存的扫描目录
  const loadScanFolders = useCallback(async () => {
    try {
      const result = await window.electronAPI.getScanFolders()
      setScanFolders(result.folders || [])
    } catch (error) {
      console.error("加载扫描目录失败:", error)
    }
  }, [])

  // 加载已保存的扫描目录
  useEffect(() => {
    loadScanFolders()
  }, [loadScanFolders])

  const handleAddFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolders()
      if (result.folders && result.folders.length > 0) {
        const newFolder = result.folders[0]
        // 保存到配置
        await window.electronAPI.addScanFolder(newFolder)
        // 重新加载列表
        await loadScanFolders()
        // 触发刷新事件
        window.dispatchEvent(new CustomEvent('refresh-projects'))
      }
    } catch (error) {
      console.error("添加扫描目录失败:", error)
    }
  }

  const handleRemoveFolder = async (folderPath: string) => {
    try {
      await window.electronAPI.removeScanFolder(folderPath)
      await loadScanFolders()
    } catch (error) {
      console.error("删除扫描目录失败:", error)
    }
  }

  const handleScan = async (folderPath: string) => {
    try {
      const result = await window.electronAPI.scanProjects([folderPath])
      console.log("扫描结果:", result.projects)
      // 触发刷新事件，通知 ProjectListPage 更新项目列表
      window.dispatchEvent(new CustomEvent('refresh-projects'))
    } catch (error) {
      console.error("扫描失败:", error)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        {/* 添加扫描目录按钮 */}
        <div className="px-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleAddFolder}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            添加扫描目录
          </Button>
        </div>

        {/* 显示已保存的扫描目录 */}
        {scanFolders.length > 0 && (
          <SidebarMenu>
            {scanFolders.map((folderPath) => {
              const folderName = folderPath.split('/').pop() || folderPath
              return (
                <SidebarMenuItem key={folderPath}>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton className="group/data-[collapsible=icon]:hidden">
                        <FolderIcon className="h-4 w-4" />
                        <span className="truncate flex-1" title={folderPath}>{folderName}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleScan(folderPath)}
                            title="扫描"
                          >
                            <ScanIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleRemoveFolder(folderPath)}
                            title="删除"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </div>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
