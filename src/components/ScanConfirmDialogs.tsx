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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const folderName = currentFolder ? currentFolder.split('/').pop() : ''

  return (
    <>
      <AlertDialog open={showStopConfirm} onOpenChange={onStopCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('scan.confirmStop')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('scan.confirmStopDesc', { count: scanProgressCurrent })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onStopCancel}>{t('scan.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onStopConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('scan.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRescanConfirm} onOpenChange={onRescanCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('scan.confirmRescan')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('scan.confirmRescanDesc', { name: folderName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onRescanCancel}>{t('scan.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onRescanConfirm}>
              {t('scan.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
