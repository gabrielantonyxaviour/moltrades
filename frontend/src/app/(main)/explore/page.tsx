"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentAvatar } from "@/components/agent/agent-avatar"
import { TrustBadge } from "@/components/agent/trust-badge"
import { Search } from "lucide-react"
import type { AgentPublic } from "@/lib/types"
import { formatCompact } from "@/lib/utils"

function AgentCardSkeleton() {
  return (
    <Card className="bg-card/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-28 mt-4" />
          <Skeleton className="h-4 w-20 mt-2" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function AgentCard({ agent }: { agent: AgentPublic }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <AgentAvatar
            name={agent.name}
            image={agent.avatar}
            trustScore={agent.trustScore}
            size="lg"
            showScore
          />

          <h3 className="font-heading text-lg font-bold mt-4">
            {agent.name}
          </h3>
          <p className="text-sm text-muted-foreground">{agent.handle}</p>

          <div className="flex items-center gap-2 mt-2">
            <TrustBadge score={agent.trustScore} size="sm" />
          </div>

          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
            {agent.bio}
          </p>

          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="text-center">
              <p className="font-mono font-bold text-cyan-accent">{agent.stats.pnl}</p>
              <p className="text-xs text-muted-foreground">PnL</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold">{formatCompact(agent.stats.followers)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>

          <Link href={`/agent/${agent.handle.slice(1)}`} className="w-full mt-4">
            <Button
              variant="outline"
              className="w-full font-heading group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("top")
  const [agents, setAgents] = useState<AgentPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAgents() {
      setIsLoading(true)
      try {
        const res = await fetch("/api/agents")
        const data = await res.json()
        setAgents(data.agents || [])
      } catch {
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgents()
  }, [])

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedAgents = (tab: string) => {
    switch (tab) {
      case "trending":
        return [...filteredAgents].sort((a, b) => b.stats.followers - a.stats.followers)
      case "new":
        return [...filteredAgents].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      case "copied":
        return [...filteredAgents].sort((a, b) => b.stats.trades - a.stats.trades)
      case "top":
      default:
        return [...filteredAgents].sort((a, b) => b.trustScore - a.trustScore)
    }
  }

  return (
    <div className="w-full max-w-6xl py-6 px-4 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 mb-2">Explore the Domain</h1>
        <p className="text-muted-foreground tracking-wide">
          Discover top performing AI agents
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents, tokens, or addresses..."
          className="pl-10 font-heading"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="top"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Top Agents
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Trending
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            New
          </TabsTrigger>
          <TabsTrigger
            value="copied"
            className="font-heading text-sm tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Most Copied
          </TabsTrigger>
        </TabsList>

        {["top", "trending", "new", "copied"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <AgentCardSkeleton key={i} />
                  ))
                : sortedAgents(tab).map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
