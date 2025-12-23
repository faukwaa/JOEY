import { ScanIcon, FolderIcon, Trash2Icon } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NavScan() {
  const [open, setOpen] = useState(false)
  const [folder, setFolder] = useState("")
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

  const handleSelectFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolders()
      if (result.folders && result.folders.length > 0) {
        setFolder(result.folders[0])
      }
    } catch (error) {
      console.error("选择文件夹失败:", error)
    }
  }

  const handleAddFolder = async () => {
    if (!folder) return

    try {
      // 保存到配置
      await window.electronAPI.addScanFolder(folder)
      // 重新加载列表
      await loadScanFolders()
      // 清空输入
      setFolder("")
      // 关闭对话框
      setOpen(false)
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
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <SidebarMenuButton tooltip="添加扫描目录">
              <ScanIcon />
              <span>添加扫描目录</span>
            </SidebarMenuButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加扫描目录</DialogTitle>
              <DialogDescription>
                选择要扫描的文件夹，应用将自动查找其中的项目
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input
                id="folder"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="/Users/yourname/code"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSelectFolder}
                title="选择文件夹"
              >
                <FolderIcon className="h-4 w-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setFolder("")
                }}
              >
                取消
              </Button>
              <Button type="button" onClick={handleAddFolder} disabled={!folder}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>

      {/* 显示已保存的扫描目录 */}
      {scanFolders.length > 0 && (
        <SidebarMenuSub>
          {scanFolders.map((folderPath) => (
            <SidebarMenuSubItem key={folderPath}>
              <SidebarMenuSubButton className="group/data-[collapsible=icon]:hidden">
                <FolderIcon className="h-4 w-4" />
                <span className="truncate flex-1">{folderPath}</span>
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
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenu>
  )
}
