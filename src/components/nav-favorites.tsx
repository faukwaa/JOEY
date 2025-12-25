import { StarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import type { Project } from "@/types"

interface NavFavoritesProps {
  projects: Project[]
  onProjectSelect: (project: Project) => void
}

export function NavFavorites({ projects, onProjectSelect }: NavFavoritesProps) {
  const { t } = useTranslation()
  const favoriteProjects = projects.filter(p => p.favorite)

  if (favoriteProjects.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('nav.favorites')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {favoriteProjects.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton onClick={() => onProjectSelect(project)}>
                <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />
                <span className="flex-1 truncate">{project.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
