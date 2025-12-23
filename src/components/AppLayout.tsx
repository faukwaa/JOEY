import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  SearchIcon,
  SettingsIcon,
  FolderIcon,
  StarIcon,
  TagIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: ReactNode
  title?: string
}

export function AppLayout({ children, title = '项目管理' }: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <FolderIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索项目..."
              className="pl-9"
            />
          </div>

          {/* 设置按钮 */}
          <Button variant="ghost" size="icon">
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-4">
          <nav className="space-y-1">
            <SidebarItem icon={<FolderIcon className="h-4 w-4" />} label="所有项目" count={12} active />
            <SidebarItem icon={<StarIcon className="h-4 w-4" />} label="收藏项目" count={3} />
            <SidebarItem icon={<TagIcon className="h-4 w-4" />} label="标签" />
          </nav>

          <div className="mt-6">
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase">
              统计
            </h3>
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">项目总数</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">总大小</span>
                <span className="font-medium">2.4 GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">有 Git</span>
                <span className="font-medium">10</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="flex h-8 items-center justify-between border-t bg-muted px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>12 个项目</span>
          <span>总计 2.4 GB</span>
        </div>
        <div>
          已就绪
        </div>
      </footer>
    </div>
  )
}

interface SidebarItemProps {
  icon: ReactNode
  label: string
  count?: number
  active?: boolean
}

function SidebarItem({ icon, label, count, active }: SidebarItemProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <Badge
          variant={active ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {count}
        </Badge>
      )}
    </button>
  )
}
