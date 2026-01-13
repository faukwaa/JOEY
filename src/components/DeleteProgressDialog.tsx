import { useTranslation } from 'react-i18next'
import { Loader2Icon, Trash2Icon, HardDriveIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface DeleteProgressDialogProps {
  open: boolean
  type: 'project' | 'node_modules'
  projectName: string
  progress?: number // undefined 表示不确定的进度
}

export function DeleteProgressDialog({
  open,
  type,
  projectName,
  progress
}: DeleteProgressDialogProps) {
  const { t } = useTranslation()

  const isNodeModules = type === 'node_modules'

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              {isNodeModules ? (
                <HardDriveIcon className="h-5 w-5 text-destructive" />
              ) : (
                <Trash2Icon className="h-5 w-5 text-destructive" />
              )}
            </div>
            <DialogTitle className="text-base">
              {isNodeModules
                ? t('deleteProgress.deletingNodeModules')
                : t('deleteProgress.movingToTrash')}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <DialogDescription className="text-sm">
            {isNodeModules
              ? t('deleteProgress.deletingNodeModulesDesc', { name: projectName })
              : t('deleteProgress.movingToTrashDesc', { name: projectName })}
          </DialogDescription>

          {/* 进度条 */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              {progress !== undefined
                ? t('deleteProgress.progressPercent', { percent: Math.round(progress) })
                : t('deleteProgress.processing')}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
