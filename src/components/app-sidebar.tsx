import { useMemo } from 'react'
import { NavScan } from "@/components/nav-scan"
import { NavFavorites } from "@/components/nav-favorites"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Project } from "@/types"
import joeyLogo from "/joey-logo.png"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  scannedDirs: string[]
  projectPaths: string[]
  allProjects: Project[]
  onPathSelect: (path: string) => void
  onProjectSelect: (project: Project) => void
  onProjectsChange?: (projects: Project[]) => void
}

export function AppSidebar({ scannedDirs, projectPaths, allProjects, onPathSelect, onProjectSelect, onProjectsChange, ...props }: AppSidebarProps) {
  const isMacOS = useMemo(() => window.navigator.userAgent.includes('Mac OS X'), [])

  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarHeader className={isMacOS ? "pt-6" : "pt-2"}>
        <div className="flex items-center justify-between px-4 py-1">
          <div className="flex items-center gap-3">
            <img
              src={joeyLogo}
              alt="Joey Logo"
              className="w-20 h-20 rounded-lg object-cover shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavScan
          scannedDirs={scannedDirs}
          projectPaths={projectPaths}
          allProjects={allProjects}
          onPathSelect={onPathSelect}
          onProjectsChange={onProjectsChange}
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
