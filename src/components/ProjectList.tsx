import { useState, useEffect, useRef } from 'react'
import type { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  MoreHorizontalIcon,
  FolderOpenIcon,
  TerminalIcon,
  Trash2Icon,
  RefreshCwIcon,
  StarIcon,
  StarOffIcon,
  GitBranchIcon,
  DeleteIcon,
  Code2Icon,
} from 'lucide-react'
import { Icon } from '@iconify/react'
import { formatSize, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProjectListProps {
  projects: Project[]
  onOpen?: (project: Project) => void
  onOpenTerminal?: (project: Project) => void
  onOpenVSCode?: (project: Project) => void
  onOpenQoder?: (project: Project) => void
  onRefresh?: (project: Project) => void
  onDelete?: (project: Project) => void
  onDeleteFromDisk?: (project: Project) => void
  onToggleFavorite?: (project: Project) => void
  onDeleteNodeModules?: (project: Project) => void
  highlightedProjectId?: string
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
  onOpenTerminal,
  onOpenVSCode,
  onOpenQoder,
  onRefresh,
  onDelete,
  onDeleteFromDisk,
  onToggleFavorite,
  onDeleteNodeModules,
  isHighlighted,
}: {
  project: Project
  onOpen?: (project: Project) => void
  onOpenTerminal?: (project: Project) => void
  onOpenVSCode?: (project: Project) => void
  onOpenQoder?: (project: Project) => void
  onRefresh?: (project: Project) => void
  onDelete?: (project: Project) => void
  onDeleteFromDisk?: (project: Project) => void
  onToggleFavorite?: (project: Project) => void
  onDeleteNodeModules?: (project: Project) => void
  isHighlighted?: boolean
}) {
  const icon = detectProjectType(project)
  const [showDeleteFromListConfirm, setShowDeleteFromListConfirm] = useState(false)
  const [showDeleteFromDiskConfirm, setShowDeleteFromDiskConfirm] = useState(false)
  const [showDeleteNodeModulesConfirm, setShowDeleteNodeModulesConfirm] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  // 滚动到高亮项目
  useEffect(() => {
    if (isHighlighted && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted])

  return (
    <div
      ref={itemRef}
      className={cn(
        "group relative rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-accent/50 cursor-pointer",
        "bg-muted/30 hover:bg-muted/50 mb-2",
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-in fade-in duration-300"
      )}
    >
      {/* 主布局：小屏幕竖向，大屏幕横向 */}
      <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center gap-2 lg:gap-3">

        {/* 左侧：图标、名称、路径、时间 */}
        <div className="flex flex-col gap-1 flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2">
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

          {/* 时间信息 */}
          <div className="text-[10px] text-muted-foreground pl-7">
            <div className="flex items-center gap-3">
              <span>创建: {formatDate(project.createdAt)}</span>
              <span>更新: {formatDate(project.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* 中间：徽章标签 */}
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
          {project.gitBranch && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400">
              <GitBranchIcon className="mr-0.5 h-2.5 w-2.5" />
              {project.gitBranch}
            </Badge>
          )}

          {project.gitStatus === 'modified' && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 whitespace-nowrap">
              {project.gitChanges} commits
            </Badge>
          )}

          {project.hasNodeModules && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400">
              node_modules
            </Badge>
          )}

          {project.packageManager && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400">
              {project.packageManager}
            </Badge>
          )}

          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 whitespace-nowrap text-slate-600 bg-slate-50 dark:bg-slate-950/30 dark:text-slate-400">
            {formatSize(project.size)}
          </Badge>
        </div>

        {/* 右侧：操作按钮 - 始终在最右边 */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto sm:ml-2">
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
              {/* 打开方式子菜单 */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderOpenIcon className="mr-2 h-4 w-4" />
                  打开方式
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onOpen?.(project)}>
                    <FolderOpenIcon className="mr-2 h-4 w-4" />
                    文件管理器
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenTerminal?.(project)}>
                    <TerminalIcon className="mr-2 h-4 w-4" />
                    终端
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenVSCode?.(project)}>
                    <Icon icon="logos:visual-studio-code" className="mr-2 h-4 w-4" />
                    VSCode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenQoder?.(project)}>
                    <Code2Icon className="mr-2 h-4 w-4" />
                    Qoder
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

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
              {project.hasNodeModules && (
                <>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteNodeModulesConfirm(true)}
                    className="text-orange-600 focus:text-orange-600 dark:text-orange-400"
                  >
                    <DeleteIcon className="mr-2 h-4 w-4" />
                    删除 node_modules
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setShowDeleteFromListConfirm(true)}
                className="text-muted-foreground focus:text-muted-foreground"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                从列表中删除
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteFromDiskConfirm(true)}
                className="text-destructive focus:text-destructive"
              >
                <DeleteIcon className="mr-2 h-4 w-4" />
                移到回收站
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        open={showDeleteFromListConfirm}
        onOpenChange={setShowDeleteFromListConfirm}
        title="从列表中删除"
        description={`确定要从列表中删除项目 "${project.name}" 吗？此操作不会删除实际的文件夹。`}
        confirmText="删除"
        onConfirm={() => onDelete?.(project)}
        variant="default"
      />
      <ConfirmDialog
        open={showDeleteFromDiskConfirm}
        onOpenChange={setShowDeleteFromDiskConfirm}
        title="移到回收站"
        description={`确定要将项目 "${project.name}" 移到回收站吗？此操作将项目文件夹移动到系统回收站，可以从中恢复。`}
        confirmText="移到回收站"
        onConfirm={() => onDeleteFromDisk?.(project)}
        variant="destructive"
      />
      <ConfirmDialog
        open={showDeleteNodeModulesConfirm}
        onOpenChange={setShowDeleteNodeModulesConfirm}
        title="删除 node_modules"
        description={`确定要删除项目 "${project.name}" 的 node_modules 目录吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={() => onDeleteNodeModules?.(project)}
        variant="destructive"
      />
    </div>
  )
}

export function ProjectList({
  projects,
  onOpen,
  onOpenTerminal,
  onOpenVSCode,
  onOpenQoder,
  onRefresh,
  onDelete,
  onDeleteFromDisk,
  onToggleFavorite,
  onDeleteNodeModules,
  highlightedProjectId,
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
          onOpenTerminal={onOpenTerminal}
          onOpenVSCode={onOpenVSCode}
          onOpenQoder={onOpenQoder}
          onRefresh={onRefresh}
          onDelete={onDelete}
          onDeleteFromDisk={onDeleteFromDisk}
          onToggleFavorite={onToggleFavorite}
          onDeleteNodeModules={onDeleteNodeModules}
          isHighlighted={project.id === highlightedProjectId}
        />
      ))}
    </div>
  )
}
