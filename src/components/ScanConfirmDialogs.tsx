import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ScanConfirmDialogsProps {
  showStopConfirm: boolean
  showRescanConfirm: boolean
  scanProgressCurrent: number
  currentFolder: string
  onStopConfirm: () => void
  onStopCancel: () => void
  onRescanConfirm: () => void
  onRescanCancel: () => void
}

export function ScanConfirmDialogs({
  showStopConfirm,
  showRescanConfirm,
  scanProgressCurrent,
  currentFolder,
  onStopConfirm,
  onStopCancel,
  onRescanConfirm,
  onRescanCancel
}: ScanConfirmDialogsProps) {
  const folderName = currentFolder ? currentFolder.split('/').pop() : ''

  return (
    <>
      {/* 停止扫描确认对话框 */}
      <AlertDialog open={showStopConfirm} onOpenChange={onStopCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停止扫描？</AlertDialogTitle>
            <AlertDialogDescription>
              当前已扫描 {scanProgressCurrent} 个项目，停止后将保留这些已扫描的项目，未扫描的项目将被忽略。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onStopCancel}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={onStopConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认停止
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重新扫描确认对话框 */}
      <AlertDialog open={showRescanConfirm} onOpenChange={onRescanCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重新扫描？</AlertDialogTitle>
            <AlertDialogDescription>
              重新扫描将清空当前项目列表并重新扫描 {folderName} 目录。此操作会覆盖之前的项目数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onRescanCancel}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={onRescanConfirm}>
              确认扫描
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
