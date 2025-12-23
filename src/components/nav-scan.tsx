/* eslint-disable react-hooks/set-state-in-effect */
import { FolderIcon, Trash2Icon, PlusIcon } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
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
  const [selectedFolder, setSelectedFolder] = useState<string>("全部") // 默认选中"全部"
  const isInitializedRef = useRef(false)

  // 加载已保存的扫描目录
  const loadScanFolders = useCallback(async () => {
    try {
      const result = await window.electronAPI.getScanFolders()
      const folders = result.folders || []
      setScanFolders(folders)
      // 首次加载时触发一次过滤，显示所有项目
      if (!isInitializedRef.current) {
        window.dispatchEvent(new CustomEvent('filter-projects-by-folder', { detail: '' }))
        isInitializedRef.current = true
      }
    } catch (error) {
      console.error("加载扫描目录失败:", error)
    }
  }, [])

  // 组件挂载时加载扫描目录
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
      // 如果删除的是当前选中的，选中第一个
      if (selectedFolder === folderPath) {
        setSelectedFolder(scanFolders.length > 1 ? scanFolders[0] : "")
      }
    } catch (error) {
      console.error("删除扫描目录失败:", error)
    }
  }

  const handleSelectFolder = (folderPath: string) => {
    setSelectedFolder(folderPath)
    // 如果选中"全部"，传递空字符串；否则传递目录路径
    const filterValue = folderPath === '全部' ? '' : folderPath
    window.dispatchEvent(new CustomEvent('filter-projects-by-folder', { detail: filterValue }))
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
            {/* "全部"选项 */}
            <SidebarMenuItem>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    className={cn(
                      "group/data-[collapsible=icon]:hidden",
                      selectedFolder === "全部" && "bg-accent"
                    )}
                    onClick={() => handleSelectFolder("全部")}
                  >
                    <FolderIcon className="h-4 w-4" />
                    <span className="flex-1">全部</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>

            {scanFolders.map((folderPath) => {
              const folderName = folderPath.split('/').pop() || folderPath
              const isSelected = selectedFolder === folderPath
              return (
                <SidebarMenuItem key={folderPath}>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={cn(
                          "group/data-[collapsible=icon]:hidden",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => handleSelectFolder(folderPath)}
                      >
                        <FolderIcon className="h-4 w-4" />
                        <span className="truncate flex-1" title={folderPath}>{folderName}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFolder(folderPath)
                            }}
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
