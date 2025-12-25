import { useMemo } from 'react'
import { NavScan } from "@/components/nav-scan"
import { NavFavorites } from "@/components/nav-favorites"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { FolderOpenIcon } from "lucide-react"
import type { Project } from "@/types"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  scannedDirs: string[]
  projectPaths: string[]
  allProjects: Project[]
  onPathSelect: (path: string) => void
  onProjectSelect: (project: Project) => void
}

export function AppSidebar({ scannedDirs, projectPaths, allProjects, onPathSelect, onProjectSelect, ...props }: AppSidebarProps) {
  const isMacOS = useMemo(() => window.navigator.userAgent.includes('Mac OS X'), [])

  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarHeader className={isMacOS ? "pt-4" : ""}>
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <FolderOpenIcon className="h-6 w-6" />
            <span className="text-lg font-semibold">项目管理</span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavScan
          scannedDirs={scannedDirs}
          projectPaths={projectPaths}
          onPathSelect={onPathSelect}
        />
        <NavFavorites
          projects={allProjects}
          onProjectSelect={onProjectSelect}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
