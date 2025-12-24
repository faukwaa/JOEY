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
  GitBranchIcon,
} from 'lucide-react'
import { formatSize, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProjectListProps {
  projects: Project[]
  onOpen?: (project: Project) => void
  onRefresh?: (project: Project) => void
  onDelete?: (project: Project) => void
  onToggleFavorite?: (project: Project) => void
}

// 项目类型检测和图标配置
const projectTypeConfigs = [
  { name: 'vue', patterns: [/vue/i], icon: '🟢', color: 'text-green-600' },
  { name: 'react', patterns: [/react/i], icon: '⚛️', color: 'text-cyan-600' },
  { name: 'angular', patterns: [/angular/i], icon: '🅰️', color: 'text-red-600' },
  { name: 'nextjs', patterns: [/next/i], icon: '▲', color: 'text-gray-900 dark:text-gray-100' },
  { name: 'nuxt', patterns: [/nuxt/i], icon: '🟢', color: 'text-green-600' },
  { name: 'nodejs', patterns: [/node/i], icon: '💚', color: 'text-green-600' },
  { name: 'typescript', patterns: [/typescript?/i], icon: '🔷', color: 'text-blue-600' },
  { name: 'java', patterns: [/java|pom\.xml|build\.gradle/i], icon: '☕', color: 'text-orange-600' },
  { name: 'python', patterns: [/python|requirements\.txt|pyproject\.toml/i], icon: '🐍', color: 'text-yellow-600' },
  { name: 'go', patterns: [/go\.mod/i], icon: '🐹', color: 'text-cyan-600' },
  { name: 'rust', patterns: [/cargo\.toml|rust/i], icon: '🦀', color: 'text-orange-700' },
  { name: 'ruby', patterns: [/ruby|gemfile/i], icon: '💎', color: 'text-red-600' },
  { name: 'php', patterns: [/php|composer/i], icon: '🐘', color: 'text-indigo-600' },
  { name: 'swift', patterns: [/swift/i], icon: '🍎', color: 'text-orange-600' },
  { name: 'kotlin', patterns: [/kotlin/i], icon: '🎯', color: 'text-purple-600' },
  { name: 'flutter', patterns: [/flutter/i], icon: '🦋', color: 'text-cyan-500' },
  { name: 'dart', patterns: [/dart/i], icon: '🎯', color: 'text-blue-600' },
  { name: 'electron', patterns: [/electron/i], icon: '⚡', color: 'text-blue-600' },
  { name: 'default', patterns: [/.*/], icon: '📁', color: 'text-gray-600' },
]

// 检测项目类型
function detectProjectType(project: Project): { icon: string; color: string } {
  const pathLower = project.path.toLowerCase()
  const nameLower = project.name.toLowerCase()

  for (const config of projectTypeConfigs) {
    if (config.name === 'default') continue
    for (const pattern of config.patterns) {
      if (pattern.test(pathLower) || pattern.test(nameLower)) {
        return { icon: config.icon, color: config.color }
      }
    }
  }

  return { icon: '📁', color: 'text-gray-600' }
}

export function ProjectListItem({
  project,
  onOpen,
  onRefresh,
  onDelete,
  onToggleFavorite,
}: {
  project: Project
  onOpen?: (project: Project) => void
  onRefresh?: (project: Project) => void
  onDelete?: (project: Project) => void
  onToggleFavorite?: (project: Project) => void
}) {
  const { icon, color } = detectProjectType(project)

  return (
    <div
      className={cn(
        "group relative rounded-lg px-4 py-3 transition-all duration-200 hover:bg-accent/50 cursor-pointer border-b border-border last:border-0",
        "bg-muted/30 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-4">
        {/* 图标和名称 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={cn("text-xl flex-shrink-0", color)}>{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold truncate">{project.name}</h3>
              {project.favorite && (
                <StarIcon className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{project.path}</p>
          </div>
        </div>

        {/* 徽章标签 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {project.gitBranch && (
            <Badge variant="secondary" className="text-xs h-6 px-2">
              <GitBranchIcon className="mr-1 h-3 w-3" />
              {project.gitBranch}
            </Badge>
          )}

          {project.gitStatus === 'modified' && (
            <Badge variant="secondary" className="text-xs h-6 px-2 border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400">
              {project.gitChanges} 变更
            </Badge>
          )}

          {project.packageManager && (
            <Badge variant="secondary" className="text-xs h-6 px-2">
              {project.packageManager}
            </Badge>
          )}

          <Badge variant="secondary" className="text-xs h-6 px-2">
            {formatSize(project.size)}
          </Badge>
        </div>

        {/* 时间信息 */}
        <div className="flex-shrink-0 text-xs text-muted-foreground text-right min-w-[100px]">
          <div>{formatDate(project.updatedAt)}</div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRefresh?.(project)}
            title="刷新"
          >
            <RefreshCwIcon className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onOpen?.(project)}>
                <FolderOpenIcon className="mr-2 h-4 w-4" />
                在文件管理器中打开
              </DropdownMenuItem>
              <DropdownMenuItem>
                <TerminalIcon className="mr-2 h-4 w-4" />
                在终端中打开
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRefresh?.(project)}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                刷新信息
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite?.(project)}>
                {project.favorite ? (
                  <>
                    <StarOffIcon className="mr-2 h-4 w-4" />
                    取消收藏
                  </>
                ) : (
                  <>
                    <StarIcon className="mr-2 h-4 w-4" />
                    添加收藏
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(project)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                删除项目
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function ProjectList({
  projects,
  onOpen,
  onRefresh,
  onDelete,
  onToggleFavorite,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <FolderOpenIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">还没有项目</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          点击左侧的"添加扫描目录"按钮，选择要监控的项目文件夹。
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
      {projects.map((project) => (
        <ProjectListItem
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
