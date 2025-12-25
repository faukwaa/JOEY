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
import { Icon } from '@iconify/react'
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
  { name: 'vue', patterns: [/vue/i], icon: 'logos:vue' },
  { name: 'react', patterns: [/react/i], icon: 'logos:react' },
  { name: 'angular', patterns: [/angular/i], icon: 'logos:angular-icon' },
  { name: 'nextjs', patterns: [/next\.?js/i], icon: 'logos:nextjs-icon' },
  { name: 'nuxt', patterns: [/nuxt/i], icon: 'logos:nuxt-icon' },
  { name: 'nodejs', patterns: [/node/i], icon: 'logos:nodejs-icon' },
  { name: 'typescript', patterns: [/typescript?/i], icon: 'logos:typescript-icon' },
  { name: 'javascript', patterns: [/javascript|js/i], icon: 'logos:javascript' },
  { name: 'java', patterns: [/java|pom\.xml|build\.gradle/i], icon: 'logos:openjdk' },
  { name: 'python', patterns: [/python|requirements\.txt|pyproject\.toml/i], icon: 'logos:python' },
  { name: 'go', patterns: [/go\.mod/i], icon: 'logos:go' },
  { name: 'rust', patterns: [/cargo\.toml|rust/i], icon: 'logos:rust' },
  { name: 'ruby', patterns: [/ruby|gemfile/i], icon: 'logos:ruby' },
  { name: 'php', patterns: [/php|composer/i], icon: 'logos:php' },
  { name: 'swift', patterns: [/swift/i], icon: 'logos:swift' },
  { name: 'kotlin', patterns: [/kotlin/i], icon: 'logos:kotlin' },
  { name: 'flutter', patterns: [/flutter/i], icon: 'logos:flutter' },
  { name: 'dart', patterns: [/dart/i], icon: 'logos:dart' },
  { name: 'electron', patterns: [/electron/i], icon: 'logos:electron' },
  { name: 'vite', patterns: [/vite/i], icon: 'logos:vitejs' },
  { name: 'webpack', patterns: [/webpack/i], icon: 'logos:webpack' },
  { name: 'nestjs', patterns: [/nest/i], icon: 'logos:nestjs' },
  { name: 'svelte', patterns: [/svelte/i], icon: 'logos:svelte-icon' },
  { name: 'docker', patterns: [/docker/i], icon: 'logos:docker-icon' },
  { name: 'linux', patterns: [/linux/i], icon: 'logos:linux-tux' },
  { name: 'android', patterns: [/android/i], icon: 'logos:android-icon' },
  { name: 'apple', patterns: [/ios|macos|apple/i], icon: 'logos:apple' },
  { name: 'default', patterns: [/.*/], icon: 'logos:file-icon' },
]

// 检测项目类型
function detectProjectType(project: Project): string {
  const pathLower = project.path.toLowerCase()
  const nameLower = project.name.toLowerCase()

  for (const config of projectTypeConfigs) {
    if (config.name === 'default') continue
    for (const pattern of config.patterns) {
      if (pattern.test(pathLower) || pattern.test(nameLower)) {
        return config.icon
      }
    }
  }

  return 'logos:file-icon'
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
  const icon = detectProjectType(project)

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
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <Icon icon={icon} className="w-7 h-7" />
          </div>
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
