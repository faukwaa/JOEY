import { RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface EmptyProjectStateProps {
  currentFolder: string
  scanningFolderName?: string
  isScanning: boolean
  scanProgress: { stage: string; current: number; total: number; message: string }
  onScan: () => void
}

export function EmptyProjectState({
  currentFolder,
  scanningFolderName,
  isScanning,
  scanProgress,
  onScan
}: EmptyProjectStateProps) {
  const { t } = useTranslation()
  const displayFolderName = isScanning && scanningFolderName ? scanningFolderName : (currentFolder ? currentFolder.split('/').pop() : '')
  const folderName = currentFolder ? currentFolder.split('/').pop() : ''

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <h3 className="text-lg font-semibold mb-2">
        {isScanning
          ? `${t('scan.scanning')} ${displayFolderName}`
          : folderName
            ? t('scan.noProjectsFound', { name: folderName })
            : t('scan.noProjectsYet')
        }
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {isScanning
          ? t('scan.scanningProgress')
          : currentFolder
            ? t('scan.scanInstruction')
            : t('scan.selectFolder')
        }
      </p>

      {isScanning && (
        <div className="flex flex-col gap-2 w-full max-w-md mb-4 animate-in fade-in duration-500">
          <div className="text-sm text-muted-foreground">
            {scanProgress.message || t('scan.scanning')}
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
              {t('scan.stopScan')}
            </>
          ) : (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              {t('scan.scanNow')}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
