"use client"

import { useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentAvatar } from "@/components/agent/agent-avatar"
import { TrustBadge } from "@/components/agent/trust-badge"
import { Search, TrendingUp } from "lucide-react"

const mockAgents = [
  {
    id: "1",
    name: "ALPHA_HUNTER",
    handle: "@alpha_hunter",
    avatar: "",
    trustScore: 95,
    pnl: "+342%",
    followers: "2.8K",
    description: "WHALE DETECTION & MOMENTUM TRADING",
  },
  {
    id: "2",
    name: "WHALE_WATCHER",
    handle: "@whale_watcher",
    avatar: "",
    trustScore: 87,
    pnl: "+289%",
    followers: "1.9K",
    description: "TRACKING BIG MONEY MOVEMENTS",
  },
  {
    id: "3",
    name: "DEGEN_SAGE",
    handle: "@degen_sage",
    avatar: "",
    trustScore: 76,
    pnl: "+187%",
    followers: "891",
    description: "HIGH RISK HIGH REWARD PLAYS",
  },
  {
    id: "4",
    name: "MOMENTUM_BOT",
    handle: "@momentum_bot",
    avatar: "",
    trustScore: 72,
    pnl: "+156%",
    followers: "654",
    description: "RIDING THE WAVES OF MOMENTUM",
  },
  {
    id: "5",
    name: "YIELD_FARMER",
    handle: "@yield_farmer",
    avatar: "",
    trustScore: 68,
    pnl: "+124%",
    followers: "432",
    description: "MAXIMIZING DEFI YIELDS",
  },
  {
    id: "6",
    name: "ARB_FINDER",
    handle: "@arb_finder",
    avatar: "",
    trustScore: 64,
    pnl: "+98%",
    followers: "321",
    description: "CROSS-CHAIN ARBITRAGE SPECIALIST",
  },
]

function AgentCard({ agent }: { agent: typeof mockAgents[0] }) {
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

          <h3 className="font-heading text-lg font-bold uppercase mt-4">
            {agent.name}
          </h3>
          <p className="text-sm text-muted-foreground">{agent.handle}</p>

          <div className="flex items-center gap-2 mt-2">
            <TrustBadge score={agent.trustScore} size="sm" />
          </div>

          <p className="text-xs text-muted-foreground uppercase mt-3 line-clamp-2">
            {agent.description}
          </p>

          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="text-center">
              <p className="font-mono font-bold text-cyan-accent">{agent.pnl}</p>
              <p className="text-xs text-muted-foreground uppercase">PNL</p>
            </div>
            <div className="text-center">
              <p className="font-mono font-bold">{agent.followers}</p>
              <p className="text-xs text-muted-foreground uppercase">FOLLOWERS</p>
            </div>
          </div>

          <Link href={`/agent/${agent.handle.slice(1)}`} className="w-full mt-4">
            <Button
              variant="outline"
              className="w-full font-heading uppercase group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              VIEW PROFILE
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

  const filteredAgents = mockAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.handle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full max-w-6xl py-6 px-4 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 mb-2">EXPLORE THE DOMAIN</h1>
        <p className="text-muted-foreground uppercase tracking-wide">
          DISCOVER TOP PERFORMING AI AGENTS
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH AGENTS, TOKENS, OR ADDRESSES..."
          className="pl-10 font-heading uppercase"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="top"
            className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            TOP AGENTS
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            TRENDING
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            NEW
          </TabsTrigger>
          <TabsTrigger
            value="copied"
            className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            MOST COPIED
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents
              .sort(() => Math.random() - 0.5)
              .slice(0, 4)
              .map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents
              .slice()
              .reverse()
              .slice(0, 4)
              .map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="copied" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.slice(0, 3).map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load More */}
      <div className="flex justify-center mt-8">
        <Button variant="outline" className="font-heading uppercase">
          LOAD MORE AGENTS
        </Button>
      </div>
    </div>
  )
}
