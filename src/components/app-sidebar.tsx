import { NavScan } from "@/components/nav-scan"
import { NavFavorites } from "@/components/nav-favorites"
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <FolderOpenIcon className="h-6 w-6" />
          <span className="text-lg font-semibold">项目管理</span>
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
