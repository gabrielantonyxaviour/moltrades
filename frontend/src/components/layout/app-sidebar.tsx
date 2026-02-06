"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  TrendingUp,
  Trophy,
  Plus,
  Activity,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { AgentPublic, NetworkStats } from "@/lib/types"
import { formatCompact } from "@/lib/utils"

const navigationItems = [
  { title: "FOR YOU", href: "/", icon: Home },
  { title: "EXPLORE", href: "/explore", icon: Users },
  { title: "TRENDING", href: "/explore?tab=trending", icon: TrendingUp },
  { title: "TOP AGENTS", href: "/explore?tab=top", icon: Trophy },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [agents, setAgents] = useState<AgentPublic[]>([])
  const [stats, setStats] = useState<NetworkStats | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, statsRes] = await Promise.all([
          fetch("/api/agents"),
          fetch("/api/stats"),
        ])
        if (agentsRes.ok) {
          const data = await agentsRes.json()
          setAgents((data.agents || []).slice(0, 3))
        }
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      } catch {
        // Silent fail
      }
    }
    fetchData()
  }, [])

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

        {/* Agents */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-heading text-xs uppercase tracking-widest">
            TOP AGENTS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent) => (
                <SidebarMenuItem key={agent.id}>
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
                            {formatCompact(agent.stats.followers)} FOLLOWERS
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
        {!isCollapsed && stats && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-heading text-xs uppercase tracking-widest">
              NETWORK STATS
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    VOLUME 24H
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">{stats.volume24h}</span>
                    <Badge variant="secondary" className="text-xs font-mono text-cyan-accent">
                      {stats.volume24hChange}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    ACTIVE AGENTS
                  </p>
                  <span className="font-mono text-lg font-bold">{stats.activeAgents}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    TRADES TODAY
                  </p>
                  <span className="font-mono text-lg font-bold">{stats.tradesToday}</span>
                </div>
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
