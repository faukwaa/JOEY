import type { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontalIcon,
  FolderOpenIcon,
  TerminalIcon,
  Trash2Icon,
  RefreshCwIcon,
  StarIcon,
  StarOffIcon,
  DatabaseIcon,
  GitBranchIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatSize, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onOpen?: (project: Project) => void
  onRefresh?: (project: Project) => void
  onDelete?: (project: Project) => void
  onToggleFavorite?: (project: Project) => void
}

// 根据项目名称生成一致的背景色
function getProjectColor(name: string) {
  const colors = [
    'bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/30 dark:hover:bg-blue-900/30',
    'bg-green-50/50 hover:bg-green-100/50 dark:bg-green-950/30 dark:hover:bg-green-900/30',
    'bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-950/30 dark:hover:bg-purple-900/30',
    'bg-orange-50/50 hover:bg-orange-100/50 dark:bg-orange-950/30 dark:hover:bg-orange-900/30',
    'bg-pink-50/50 hover:bg-pink-100/50 dark:bg-pink-950/30 dark:hover:bg-pink-900/30',
    'bg-cyan-50/50 hover:bg-cyan-100/50 dark:bg-cyan-950/30 dark:hover:bg-cyan-900/30',
    'bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30',
    'bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function ProjectCard({
  project,
  onOpen,
  onRefresh,
  onDelete,
  onToggleFavorite,
}: ProjectCardProps) {
  const { t } = useTranslation()
  const colorClass = getProjectColor(project.name)

  return (
    <div
      className={cn(
        "group relative rounded-lg p-4 transition-all duration-200 cursor-pointer",
        colorClass
      )}
      style={{
        borderRadius: 'var(--radius)'
      } as React.CSSProperties}
    >
      {/* 头部：标题和操作菜单 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold truncate">{project.name}</h3>
            {project.favorite && (
              <StarIcon className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{project.path}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onOpen?.(project)}>
              <FolderOpenIcon className="mr-2 h-4 w-4" />
              {t('project.openInExplorer')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <TerminalIcon className="mr-2 h-4 w-4" />
              {t('project.openInTerminal')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRefresh?.(project)}>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              {t('project.refreshInfo')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite?.(project)}>
              {project.favorite ? (
                <>
                  <StarOffIcon className="mr-2 h-4 w-4" />
                  {t('project.removeFavorite')}
                </>
              ) : (
                <>
                  <StarIcon className="mr-2 h-4 w-4" />
                  {t('project.addFavorite')}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(project)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              {t('project.deleteProject')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 徽章标签 */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="secondary" className="text-xs">
          <DatabaseIcon className="mr-1 h-3 w-3" />
          {formatSize(project.size)}
        </Badge>

        {project.hasNodeModules && (
          <Badge variant="secondary" className="text-xs">
            node_modules
          </Badge>
        )}

        {project.gitBranch && (
          <Badge variant="secondary" className="text-xs">
            <GitBranchIcon className="mr-1 h-3 w-3" />
            {project.gitBranch}
          </Badge>
        )}

        {project.gitStatus === 'modified' && (
          <Badge variant="secondary" className="text-xs border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400">
            {t('project.changes', { count: project.gitChanges })}
          </Badge>
        )}

        {project.packageManager && (
          <Badge variant="secondary" className="text-xs">
            {project.packageManager}
          </Badge>
        )}
      </div>

      {/* 时间信息 */}
      <div className="text-xs text-muted-foreground space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span>{t('project.createdAt')}</span>
          <span className="font-medium">{formatDate(project.createdAt, t)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t('project.updatedAt')}</span>
          <span className="font-medium">{formatDate(project.updatedAt, t)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpen?.(project)} className="flex-1">
          <FolderOpenIcon className="mr-2 h-4 w-4" />
          {t('project.open')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onRefresh?.(project)}>
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface ProjectGridProps {
  projects: Project[]
  onOpen?: (project: Project) => void
  onRefresh?: (project: Project) => void
  onDelete?: (project: Project) => void
  onToggleFavorite?: (project: Project) => void
}

export function ProjectGrid({
  projects,
  onOpen,
  onRefresh,
  onDelete,
  onToggleFavorite,
}: ProjectGridProps) {
  const { t } = useTranslation()

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <FolderOpenIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('project.emptyState.title')}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('project.emptyState.description')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpen}
          onRefresh={onRefresh}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
