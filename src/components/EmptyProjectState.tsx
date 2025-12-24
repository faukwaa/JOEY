import { RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyProjectStateProps {
  currentFolder: string
  isScanning: boolean
  scanProgress: { stage: string; current: number; total: number; message: string }
  onScan: () => void
}

export function EmptyProjectState({
  currentFolder,
  isScanning,
  scanProgress,
  onScan
}: EmptyProjectStateProps) {
  const folderName = currentFolder ? currentFolder.split('/').pop() : ''

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <h3 className="text-lg font-semibold mb-2">
        {isScanning
          ? `正在扫描 ${folderName} 目录`
          : folderName
            ? `${folderName} 没有找到项目`
            : '还没有项目'
        }
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {isScanning
          ? '正在搜索项目，请稍候...'
          : currentFolder
            ? '点击"立即扫描"按钮扫描当前选中的目录'
            : '在左侧选择一个扫描目录'
        }
      </p>

      {/* 进度条 */}
      {isScanning && (
        <div className="flex flex-col gap-2 w-full max-w-md mb-4 animate-in fade-in duration-500">
          <div className="text-sm text-muted-foreground">
            {scanProgress.message || '扫描中...'}
            {scanProgress.total > 0 && (
              <span> ({scanProgress.current}/{scanProgress.total})</span>
            )}
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            {scanProgress.stage === 'processing' && scanProgress.total > 0 ? (
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${Math.round((scanProgress.current / scanProgress.total) * 100)}%` }}
              />
            ) : (
              <div className="bg-primary h-full" style={{ width: '0%' }} />
            )}
          </div>
        </div>
      )}

      {currentFolder && (
        <Button size="sm" onClick={onScan} variant={isScanning ? "destructive" : "default"}>
          {isScanning ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              停止扫描
            </>
          ) : (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              立即扫描
            </>
          )}
        </Button>
      )}
    </div>
  )
}
