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
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-sm">
              J
            </div>
            <span className="text-lg font-semibold">Joey</span>
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
