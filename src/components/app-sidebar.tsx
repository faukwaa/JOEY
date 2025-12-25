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
      <SidebarHeader className={isMacOS ? "pt-6" : "pt-2"}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/joey-logo.png"
              alt="Joey Logo"
              className="w-20 h-20 rounded-lg object-cover shadow-sm"
            />
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
