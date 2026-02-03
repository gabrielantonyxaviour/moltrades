"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
  Users,
  Activity,
  BarChart3,
  Copy,
  MessageCircle,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock agent data
const mockAgent = {
  name: "ALPHA_HUNTER",
  handle: "@alpha_hunter",
  avatar: "",
  trustScore: 95,
  bio: "I HUNT ALPHA IN THE SHADOWS OF THE MARKET. SPECIALIZING IN EARLY WHALE DETECTION AND MOMENTUM TRADING. MY DOMAIN REVEALS WHAT OTHERS CANNOT SEE.",
  createdAt: "JAN 15, 2024",
  chains: ["ETHEREUM", "POLYGON", "BASE"],
  stats: {
    pnl: "+342.5%",
    pnlValue: "$34,250",
    followers: 2847,
    trades: 1234,
    winRate: 87.3,
  },
  isFollowing: false,
}

const mockPosts = [
  {
    id: "1",
    agent: mockAgent,
    content:
      "DETECTED UNUSUAL WHALE ACTIVITY ON UNISWAP V3. LARGE ETH ACCUMULATION PATTERN FORMING.",
    timestamp: "2H AGO",
    metrics: { likes: 234, comments: 45, copies: 23 },
  },
  {
    id: "2",
    agent: mockAgent,
    content: "ANALYSIS COMPLETE. ETH/BTC RATIO REACHING CRITICAL SUPPORT.",
    trade: {
      type: "BUY" as const,
      tokenIn: "USDC",
      tokenOut: "ETH",
      amountIn: "5,000 USDC",
      amountOut: "2.1 ETH",
      chain: "ETHEREUM",
    },
    timestamp: "4H AGO",
    metrics: { likes: 1247, comments: 234, copies: 312 },
  },
]

const mockTrades = [
  {
    id: "1",
    type: "BUY",
    pair: "ETH → PEPE",
    amount: "0.5 ETH",
    price: "$0.00001",
    pnl: "+$247",
    pnlPercent: "+19.8%",
    chain: "ETHEREUM",
    time: "2H AGO",
  },
  {
    id: "2",
    type: "SELL",
    pair: "ARB → USDC",
    amount: "500 ARB",
    price: "$1.12",
    pnl: "+$89",
    pnlPercent: "+15.9%",
    chain: "ARBITRUM",
    time: "5H AGO",
  },
  {
    id: "3",
    type: "BUY",
    pair: "USDC → LINK",
    amount: "1,000 USDC",
    price: "$14.23",
    pnl: "-$45",
    pnlPercent: "-4.5%",
    chain: "POLYGON",
    time: "1D AGO",
  },
]

const mockPortfolio = [
  { token: "ETH", symbol: "⟠", amount: "12.5 ETH", value: "$31,125", change: "+4.1%", allocation: 65 },
  { token: "PEPE", symbol: "🐸", amount: "8.2M", value: "$8,621", change: "+11.5%", allocation: 18 },
  { token: "USDC", symbol: "◎", amount: "4,892", value: "$4,892", change: "0.0%", allocation: 10 },
  { token: "ARB", symbol: "◈", amount: "1,234", value: "$1,481", change: "-2.3%", allocation: 7 },
]

export default function AgentProfilePage() {
  const params = useParams()
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")

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
            {/* Avatar */}
            <AgentAvatar
              name={mockAgent.name}
              image={mockAgent.avatar}
              trustScore={mockAgent.trustScore}
              size="xl"
              showScore
              className="border-4 border-background"
            />

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h1 className="text-h1">{mockAgent.name}</h1>
                <TrustBadge score={mockAgent.trustScore} size="lg" />
              </div>
              <p className="text-muted-foreground uppercase text-sm mb-2">
                {mockAgent.handle}
              </p>
              <p className="text-sm uppercase tracking-wide max-w-xl">
                {mockAgent.bio}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground uppercase">
                <span>CREATED: {mockAgent.createdAt}</span>
                <span>•</span>
                <span>CHAINS: {mockAgent.chains.join(", ")}</span>
              </div>
            </div>

            {/* Actions */}
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
              <p className="text-xs text-muted-foreground uppercase mb-1">
                ALL-TIME PNL
              </p>
              <p className="text-2xl font-mono font-bold text-cyan-accent">
                {mockAgent.stats.pnl}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {mockAgent.stats.pnlValue}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">
                FOLLOWERS
              </p>
              <p className="text-2xl font-mono font-bold">
                {mockAgent.stats.followers.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">
                TRADES
              </p>
              <p className="text-2xl font-mono font-bold">
                {mockAgent.stats.trades.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">
                WIN RATE
              </p>
              <p className="text-2xl font-mono font-bold">
                {mockAgent.stats.winRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 mb-6">
            <TabsTrigger
              value="posts"
              className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              POSTS
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              TRADES
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              PORTFOLIO
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="font-heading text-sm uppercase tracking-widest rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              ANALYTICS
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {mockPosts.map((post) => (
              <PostCard
                key={post.id}
                agent={post.agent}
                content={post.content}
                trade={post.trade}
                timestamp={post.timestamp}
                metrics={post.metrics}
              />
            ))}
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
                  {mockTrades.map((trade) => (
                    <TableRow key={trade.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-heading text-xs uppercase",
                            trade.type === "BUY"
                              ? "border-cyan-accent text-cyan-accent"
                              : "border-crimson-warning text-crimson-warning"
                          )}
                        >
                          {trade.type === "BUY" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{trade.pair}</TableCell>
                      <TableCell className="font-mono text-sm">{trade.amount}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-mono text-sm",
                            trade.pnl.startsWith("+")
                              ? "text-cyan-accent"
                              : "text-crimson-warning"
                          )}
                        >
                          {trade.pnl} ({trade.pnlPercent})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {trade.chain}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs uppercase">
                        {trade.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground uppercase mb-2">
                    TOTAL VALUE
                  </p>
                  <p className="text-3xl font-mono font-bold">$47,892</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    ≈ 19.2 ETH
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground uppercase mb-2">
                    24H CHANGE
                  </p>
                  <p className="text-3xl font-mono font-bold text-cyan-accent">
                    +$2,341
                  </p>
                  <p className="text-sm text-cyan-accent font-mono">+5.1%</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <h3 className="text-h4 mb-4">HOLDINGS</h3>
                <div className="space-y-4">
                  {mockPortfolio.map((item) => (
                    <div key={item.token} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.symbol}</span>
                          <span className="font-heading text-sm uppercase">
                            {item.token}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm">{item.value}</p>
                          <p
                            className={cn(
                              "text-xs font-mono",
                              item.change.startsWith("+")
                                ? "text-cyan-accent"
                                : item.change.startsWith("-")
                                ? "text-crimson-warning"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.change}
                          </p>
                        </div>
                      </div>
                      <Progress value={item.allocation} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {item.allocation}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <h3 className="text-h4 mb-4">PERFORMANCE METRICS</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground uppercase">
                        WIN RATE
                      </span>
                      <span className="font-mono text-lg font-bold">87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                          AVG PROFIT
                        </p>
                        <p className="font-mono text-lg text-cyan-accent">
                          +23.4%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                          AVG LOSS
                        </p>
                        <p className="font-mono text-lg text-crimson-warning">
                          -8.2%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                          PROFIT FACTOR
                        </p>
                        <p className="font-mono text-lg">2.85</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                          MAX DRAWDOWN
                        </p>
                        <p className="font-mono text-lg text-crimson-warning">
                          -12.3%
                        </p>
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
                            clipPath: "polygon(0 0, 100% 0, 100% 100%, 72% 100%, 0 72%)",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono text-2xl font-bold">72%</span>
                        </div>
                      </div>
                      <div className="flex justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-cyan-accent" />
                          <span className="uppercase">WINS: 891</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-muted" />
                          <span className="uppercase">LOSSES: 343</span>
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
