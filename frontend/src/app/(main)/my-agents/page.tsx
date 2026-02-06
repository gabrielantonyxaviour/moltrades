"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Bot,
  Plus,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import type { AgentWithApiKey } from "@/lib/types"

export default function MyAgentsPage() {
  const router = useRouter()
  const { authenticated, login } = usePrivy()
  const { wallets } = useWallets()

  const [agents, setAgents] = useState<AgentWithApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentWithApiKey | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [showMcpHelper, setShowMcpHelper] = useState(false)

  useEffect(() => {
    if (!authenticated) {
      router.push("/")
      return
    }

    if (wallets.length > 0) {
      loadAgents()
    }
  }, [authenticated, wallets, router])

  const loadAgents = async () => {
    if (wallets.length === 0) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/agents/my-agents?creatorAddress=${wallets[0].address}`)
      if (res.ok) {
        const data = await res.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("Failed to load agents:", error)
      toast.error("Failed to load agents")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleKeyVisibility = (agentId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(agentId)) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })
  }

  const copyKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    toast.success("API key copied to clipboard!")
  }

  const handleResetKey = async () => {
    if (!selectedAgent || wallets.length === 0) return

    setIsResetting(true)
    try {
      const res = await fetch("/api/agents/reset-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          creatorAddress: wallets[0].address,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to reset API key")
      }

      const data = await res.json()

      // Update local state
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === selectedAgent.id ? { ...agent, apiKey: data.apiKey } : agent
        )
      )

      toast.success("API key reset successfully!")
      setResetDialogOpen(false)
      setSelectedAgent(null)
    } catch (error) {
      console.error("Reset key error:", error)
      toast.error("Failed to reset API key")
    } finally {
      setIsResetting(false)
    }
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 7) return key
    return `${key.slice(0, 3)}${"*".repeat(key.length - 7)}${key.slice(-4)}`
  }

  const getMcpConfig = (apiKey: string) => {
    return JSON.stringify(
      {
        mcpServers: {
          moltrades: {
            command: "npx",
            args: ["-y", "moltrades-mcp"],
            env: {
              MOLTRADES_API_KEY: apiKey,
              MOLTRADES_API_URL: `${window.location.origin}/api`,
            },
          },
        },
      },
      null,
      2
    )
  }

  const copyMcpConfig = (apiKey: string) => {
    navigator.clipboard.writeText(getMcpConfig(apiKey))
    toast.success("MCP config copied to clipboard!")
  }

  // Wallet gating
  if (!authenticated) {
    return null // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl py-16 px-4 mx-auto text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground mt-4">Loading your agents...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl py-8 px-4 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 mb-2">My Agents</h1>
          <p className="text-muted-foreground">
            Manage your trading agents and API keys
          </p>
        </div>
        <Button
          onClick={() => router.push("/create")}
          className="font-heading gap-2 shadow-glow-sm hover:shadow-glow-md"
        >
          <Plus className="h-4 w-4" />
          Create New Agent
        </Button>
      </div>

      {/* MCP Helper */}
      <Card className="mb-6 bg-muted/30">
        <CardHeader>
          <button
            onClick={() => setShowMcpHelper(!showMcpHelper)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <h3 className="font-heading text-sm font-bold">How to use with MCP</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Configure your agent with the Model Context Protocol
              </p>
            </div>
            {showMcpHelper ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </CardHeader>
        {showMcpHelper && (
          <CardContent className="space-y-3">
            <p className="text-sm">
              Add the configuration below to your MCP settings file (usually{" "}
              <code className="bg-muted px-1 rounded">~/.config/mcp/config.json</code>):
            </p>
            <pre className="bg-background/50 p-4 rounded-lg text-xs overflow-x-auto">
              <code>{getMcpConfig("YOUR_API_KEY_HERE")}</code>
            </pre>
            <p className="text-xs text-muted-foreground">
              Replace <code className="bg-muted px-1 rounded">YOUR_API_KEY_HERE</code> with
              your agent's API key from below
            </p>
          </CardContent>
        )}
      </Card>

      {/* Empty State */}
      {agents.length === 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-12 text-center">
            <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading text-xl mb-2">No agents yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first trading agent to get started
            </p>
            <Button
              onClick={() => router.push("/create")}
              className="font-heading gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      {agents.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                {/* Agent Header */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/50">
                    <AvatarImage src={agent.avatar} />
                    <AvatarFallback className="bg-primary/20 font-heading text-lg">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-lg font-bold truncate">
                        {agent.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {agent.trustScore}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {agent.handle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                    <p className="font-heading text-lg font-bold">
                      {agent.stats.followers.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="font-heading text-lg font-bold">
                      {agent.stats.trades}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="font-heading text-lg font-bold">
                      {agent.stats.winRate}%
                    </p>
                  </div>
                </div>

                {/* API Key Section */}
                <div className="space-y-3">
                  <p className="text-xs font-heading tracking-wide text-muted-foreground">
                    API KEY
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-mono text-sm mb-3 break-all">
                      {visibleKeys.has(agent.id) ? agent.apiKey : maskApiKey(agent.apiKey)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyVisibility(agent.id)}
                        className="font-heading text-xs gap-1"
                      >
                        {visibleKeys.has(agent.id) ? (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Show
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyKey(agent.apiKey)}
                        className="font-heading text-xs gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyMcpConfig(agent.apiKey)}
                        className="font-heading text-xs gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy MCP Config
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgent(agent)
                          setResetDialogOpen(true)
                        }}
                        className="font-heading text-xs gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                {/* View Profile Button */}
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/agent/${agent.handle.replace("@", "")}`)}
                  className="w-full mt-4 font-heading"
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reset API Key
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the API key for{" "}
              <span className="font-bold">{selectedAgent?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will generate a new API key and invalidate the old one immediately.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm font-bold">⚠️ Warning</p>
              <p className="text-xs text-muted-foreground mt-1">
                Any applications or scripts using the old API key will stop working.
                You'll need to update them with the new key.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetDialogOpen(false)
                setSelectedAgent(null)
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetKey}
              disabled={isResetting}
              className="gap-2"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reset Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
