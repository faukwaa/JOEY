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
        "group relative rounded-lg px-3 py-2 transition-all duration-200 hover:bg-accent/50 cursor-pointer",
        "bg-muted/30 hover:bg-muted/50 mb-2"
      )}
    >
      <div className="flex items-center gap-3">
        {/* 图标和名称 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Icon icon={icon} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-sm font-semibold truncate">{project.name}</h3>
              {project.favorite && (
                <StarIcon className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{project.path}</p>
          </div>
        </div>

        {/* 徽章标签 - 限制显示数量 */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {project.gitBranch && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
              <GitBranchIcon className="mr-0.5 h-2.5 w-2.5" />
              {project.gitBranch}
            </Badge>
          )}

          {project.gitStatus === 'modified' && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 whitespace-nowrap">
              {project.gitChanges}
            </Badge>
          )}

          {project.hasNodeModules && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
              node_modules
            </Badge>
          )}

          {project.packageManager && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
              {project.packageManager}
            </Badge>
          )}

          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
            {formatSize(project.size)}
          </Badge>
        </div>

        {/* 时间信息 - 显示创建和更新时间 */}
        <div className="flex-shrink-0 text-[10px] text-muted-foreground text-right min-w-[120px] hidden md:block">
          <div className="space-y-0.5">
            <div className="flex items-center justify-end gap-1">
              <span className="opacity-70">创建:</span>
              <span className="font-medium">{formatDate(project.createdAt)}</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <span className="opacity-70">更新:</span>
              <span className="font-medium">{formatDate(project.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* 时间信息 - 小屏幕只显示更新时间 */}
        <div className="flex-shrink-0 text-[10px] text-muted-foreground text-right min-w-[70px] md:hidden">
          {formatDate(project.updatedAt)}
        </div>

        {/* 操作按钮 - 放在最右边 */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
              >
                <MoreHorizontalIcon className="h-3.5 w-3.5" />
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
    <div className="rounded-lg overflow-hidden">
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
