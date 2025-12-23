import {
  BlocksIcon,
  ComponentIcon,
  GitCompareArrowsIcon,
  LayoutDashboardIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { NavScan } from "@/components/nav-scan"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// 团队数据
const teams = [
  {
    name: "项目管理",
    logo: LayoutDashboardIcon,
    plan: "免费版",
  },
]

// 主导航数据
const mainNavItems = [
  {
    title: "仪表盘",
    url: "#",
    icon: LayoutDashboardIcon,
    isActive: true,
  },
  {
    title: "我的项目",
    url: "#",
    icon: BlocksIcon,
    items: [
      { title: "所有项目", url: "#" },
      { title: "收藏的项目", url: "#" },
      { title: "归档的项目", url: "#" },
    ],
  },
  {
    title: "组件",
    url: "#",
    icon: ComponentIcon,
    items: [
      { title: "按钮", url: "#" },
      { title: "卡片", url: "#" },
      { title: "表单", url: "#" },
    ],
  },
  {
    title: "版本控制",
    url: "#",
    icon: GitCompareArrowsIcon,
    items: [
      { title: "提交历史", url: "#" },
      { title: "分支管理", url: "#" },
      { title: "合并请求", url: "#" },
    ],
  },
]

// 项目数据
const projects = [
  {
    name: "ProjectMng",
    url: "#",
    icon: LayoutDashboardIcon,
  },
  {
    name: "我的博客",
    url: "#",
    icon: BlocksIcon,
  },
  {
    name: "设计系统",
    url: "#",
    icon: ComponentIcon,
  },
]

// 用户数据
const user = {
  name: "开发者",
  email: "developer@example.com",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavScan />
        <NavMain items={mainNavItems} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
