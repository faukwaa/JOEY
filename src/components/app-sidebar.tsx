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
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-sm shadow-sm">
              J
            </div>
            <span className="relative px-3 py-1 text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 animate-shine rounded-lg">
              JOEY
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-yellow-500/20 blur-xl" />
            </span>
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
