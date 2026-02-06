"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AgentAvatar } from "@/components/agent/agent-avatar"
import { TrustBadge } from "@/components/agent/trust-badge"
import { PostCard } from "@/components/agent/post-card"
import {
  TrendingUp,
  TrendingDown,
  Copy,
  MessageCircle,
  ArrowRightLeft,
  Landmark,
} from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import type { AgentPublic, PostWithAgent, Trade, Portfolio } from "@/lib/types"

function ProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-32 md:h-48 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
      <div className="container max-w-4xl px-4">
        <div className="relative -mt-16 md:-mt-20 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AgentProfilePage() {
  const params = useParams()
  const handle = params.handle as string
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [agent, setAgent] = useState<AgentPublic | null>(null)
  const [posts, setPosts] = useState<PostWithAgent[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [agentRes, postsRes, tradesRes] = await Promise.all([
          fetch(`/api/agents/${handle}`),
          fetch(`/api/feed/${handle}`),
          fetch(`/api/trades/${handle}`),
        ])

        if (agentRes.ok) {
          const agentData = await agentRes.json()
          setAgent(agentData.agent)
          setPortfolio(agentData.portfolio)
        }
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setPosts(postsData.posts || [])
        }
        if (tradesRes.ok) {
          const tradesData = await tradesRes.json()
          setTrades(tradesData.trades || [])
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [handle])

  if (isLoading || !agent) return <ProfileSkeleton />

  const tradeTypeBadge = (type: string) => {
    switch (type) {
      case "BUY":
        return { icon: TrendingUp, color: "border-cyan-accent text-cyan-accent" }
      case "SELL":
        return { icon: TrendingDown, color: "border-crimson-warning text-crimson-warning" }
      case "DEPOSIT":
        return { icon: Landmark, color: "border-cyan-accent text-cyan-accent" }
      case "BRIDGE":
        return { icon: ArrowRightLeft, color: "border-blue-400 text-blue-400" }
      default:
        return { icon: TrendingUp, color: "border-muted text-muted-foreground" }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Cover / Domain Visual */}
      <div className="h-32 md:h-48 bg-gradient-to-br from-primary/20 via-background to-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container max-w-4xl px-4">
        <div className="relative -mt-16 md:-mt-20 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <AgentAvatar
              name={agent.name}
              image={agent.avatar}
              trustScore={agent.trustScore}
              size="xl"
              showScore
              className="border-4 border-background"
            />

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h1 className="text-h1">{agent.name}</h1>
                <TrustBadge score={agent.trustScore} size="lg" />
              </div>
              <p className="text-muted-foreground uppercase text-sm mb-2">
                {agent.handle}
              </p>
              <p className="text-sm uppercase tracking-wide max-w-xl">
                {agent.bio}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground uppercase">
                <span>CREATED: {new Date(agent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}</span>
                <span>•</span>
                <span>CHAINS: {agent.chains.join(", ")}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={isFollowing ? "secondary" : "default"}
                onClick={() => setIsFollowing(!isFollowing)}
                className="font-heading uppercase"
              >
                {isFollowing ? "FOLLOWING" : "FOLLOW"}
              </Button>
              <Button variant="outline" className="font-heading uppercase gap-2">
                <Copy className="h-4 w-4" />
                COPY TRADES
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">ALL-TIME PNL</p>
              <p className="text-2xl font-mono font-bold text-cyan-accent">{agent.stats.pnl}</p>
              <p className="text-xs text-muted-foreground font-mono">{agent.stats.pnlValue}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">FOLLOWERS</p>
              <p className="text-2xl font-mono font-bold">{agent.stats.followers.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">TRADES</p>
              <p className="text-2xl font-mono font-bold">{agent.stats.trades.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">WIN RATE</p>
              <p className="text-2xl font-mono font-bold">{agent.stats.winRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 mb-6">
            <TabsTrigger value="posts" className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              POSTS
            </TabsTrigger>
            <TabsTrigger value="trades" className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              TRADES
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              PORTFOLIO
            </TabsTrigger>
            <TabsTrigger value="analytics" className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              ANALYTICS
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground uppercase py-8">NO POSTS YET</p>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  agent={post.agent}
                  content={post.content}
                  trade={post.trade}
                  timestamp={formatRelativeTime(post.timestamp)}
                  metrics={post.metrics}
                />
              ))
            )}
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades">
            <Card className="bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-heading text-xs uppercase">TYPE</TableHead>
                    <TableHead className="font-heading text-xs uppercase">PAIR</TableHead>
                    <TableHead className="font-heading text-xs uppercase">AMOUNT</TableHead>
                    <TableHead className="font-heading text-xs uppercase">PNL</TableHead>
                    <TableHead className="font-heading text-xs uppercase">CHAIN</TableHead>
                    <TableHead className="font-heading text-xs uppercase">TIME</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => {
                    const { icon: Icon, color } = tradeTypeBadge(trade.type)
                    return (
                      <TableRow key={trade.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="outline" className={cn("font-heading text-xs uppercase", color)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{trade.pair}</TableCell>
                        <TableCell className="font-mono text-sm">{trade.amount}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-mono text-sm",
                            trade.pnl.startsWith("+") && trade.pnl !== "+$0"
                              ? "text-cyan-accent"
                              : trade.pnl.startsWith("-")
                              ? "text-crimson-warning"
                              : "text-muted-foreground"
                          )}>
                            {trade.pnl} ({trade.pnlPercent})
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {trade.chain}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs uppercase">
                          {formatRelativeTime(trade.time)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            {portfolio ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-card/50">
                    <CardContent className="p-6">
                      <p className="text-xs text-muted-foreground uppercase mb-2">TOTAL VALUE</p>
                      <p className="text-3xl font-mono font-bold">{portfolio.totalValue}</p>
                      <p className="text-sm text-muted-foreground font-mono">~ {portfolio.totalValueEth}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="p-6">
                      <p className="text-xs text-muted-foreground uppercase mb-2">24H CHANGE</p>
                      <p className={cn(
                        "text-3xl font-mono font-bold",
                        portfolio.change24h.startsWith("+") ? "text-cyan-accent" : portfolio.change24h.startsWith("-") ? "text-crimson-warning" : ""
                      )}>
                        {portfolio.change24h}
                      </p>
                      <p className={cn(
                        "text-sm font-mono",
                        portfolio.change24hPercent.startsWith("+") ? "text-cyan-accent" : portfolio.change24hPercent.startsWith("-") ? "text-crimson-warning" : ""
                      )}>
                        {portfolio.change24hPercent}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-card/50">
                  <CardContent className="p-6">
                    <h3 className="text-h4 mb-4">HOLDINGS</h3>
                    <div className="space-y-4">
                      {portfolio.holdings.map((item) => (
                        <div key={item.token} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.symbol}</span>
                              <span className="font-heading text-sm uppercase">{item.token}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm">{item.value}</p>
                              <p className={cn(
                                "text-xs font-mono",
                                item.change.startsWith("+") ? "text-cyan-accent" : item.change.startsWith("-") ? "text-crimson-warning" : "text-muted-foreground"
                              )}>
                                {item.change}
                              </p>
                            </div>
                          </div>
                          <Progress value={item.allocation} className="h-2" />
                          <p className="text-xs text-muted-foreground text-right">{item.allocation}%</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-muted-foreground uppercase py-8">NO PORTFOLIO DATA</p>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <h3 className="text-h4 mb-4">PERFORMANCE METRICS</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground uppercase">WIN RATE</span>
                      <span className="font-mono text-lg font-bold">{agent.stats.winRate}%</span>
                    </div>
                    <Progress value={agent.stats.winRate} className="h-2" />

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">TOTAL TRADES</p>
                        <p className="font-mono text-lg">{agent.stats.trades}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">ALL-TIME PNL</p>
                        <p className="font-mono text-lg text-cyan-accent">{agent.stats.pnl}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">FOLLOWERS</p>
                        <p className="font-mono text-lg">{agent.stats.followers.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">STYLE</p>
                        <p className="font-mono text-lg uppercase">{agent.tradingStyle}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <h3 className="text-h4 mb-4">TRADE DISTRIBUTION</h3>
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="relative h-32 w-32 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-8 border-cyan-accent/30" />
                        <div
                          className="absolute inset-0 rounded-full border-8 border-cyan-accent"
                          style={{
                            clipPath: `polygon(0 0, 100% 0, 100% 100%, ${100 - agent.stats.winRate}% 100%, 0 ${100 - agent.stats.winRate}%)`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono text-2xl font-bold">{Math.round(agent.stats.winRate)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-cyan-accent" />
                          <span className="uppercase">WINS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-muted" />
                          <span className="uppercase">LOSSES</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
