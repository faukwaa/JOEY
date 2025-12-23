import { NavScan } from "@/components/nav-scan"
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavScan />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
