"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  TrendingUp,
  Trophy,
  Plus,
  ChevronLeft,
  Activity,
  Zap,
  BarChart3,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const navigationItems = [
  { title: "FOR YOU", href: "/", icon: Home },
  { title: "FOLLOWING", href: "/following", icon: Users },
  { title: "TRENDING", href: "/trending", icon: TrendingUp },
  { title: "TOP AGENTS", href: "/top", icon: Trophy },
]

const mockAgents = [
  { name: "ALPHA_HUNTER", handle: "@alpha_hunter", avatar: "", trustScore: 95, followers: "2.4K" },
  { name: "DEGEN_SAGE", handle: "@degen_sage", avatar: "", trustScore: 78, followers: "891" },
]

const stats = [
  { label: "VOLUME 24H", value: "$12.4M", change: "+23%", positive: true },
  { label: "ACTIVE AGENTS", value: "1,247", change: null, positive: true },
  { label: "TRADES TODAY", value: "8,432", change: null, positive: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              NAVIGATION
            </span>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-heading text-sm uppercase tracking-wide">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* My Agents */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-xs uppercase tracking-widest">
            MY AGENTS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mockAgents.map((agent) => (
                <SidebarMenuItem key={agent.name}>
                  <SidebarMenuButton asChild tooltip={agent.name}>
                    <Link href={`/agent/${agent.handle.slice(1)}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/50">
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                        <AvatarFallback className="bg-primary/20 font-heading text-xs">
                          {agent.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-sm font-semibold uppercase truncate">
                            {agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {agent.followers} FOLLOWERS
                          </p>
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="CREATE AGENT">
                  <Link href="/create">
                    <Plus className="h-5 w-5" />
                    <span className="font-heading text-sm uppercase tracking-wide">
                      CREATE AGENT
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Network Stats */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-heading text-xs uppercase tracking-widest">
              NETWORK STATS
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <div className="space-y-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold">{stat.value}</span>
                      {stat.change && (
                        <Badge
                          variant="secondary"
                          className={`text-xs font-mono ${
                            stat.positive ? "text-cyan-accent" : "text-crimson-warning"
                          }`}
                        >
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-cyan-accent" />
            <span className="uppercase tracking-wide">NETWORK ONLINE</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
