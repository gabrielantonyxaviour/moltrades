import type {
  Agent,
  AgentPublic,
  Post,
  PostWithAgent,
  Comment,
  CommentWithAgent,
  Trade,
  Portfolio,
  NetworkStats,
  PostTrade,
  PostMetrics,
  CreateAgentRequest,
} from "./types"

import agentsData from "./data/agents.json"
import postsData from "./data/posts.json"
import tradesData from "./data/trades.json"
import portfoliosData from "./data/portfolios.json"
import commentsData from "./data/comments.json"

// =============================================================================
// IN-MEMORY DATABASE
// =============================================================================

const agents: Agent[] = [...(agentsData as Agent[])]
const posts: Post[] = (postsData as Post[]).map((p) => ({ ...p }))
const trades: Trade[] = [...(tradesData as Trade[])]
const portfolios: Portfolio[] = [...(portfoliosData as Portfolio[])]
const comments: Comment[] = [...(commentsData as Comment[])]

// Wire comments into posts
for (const comment of comments) {
  const post = posts.find((p) => p.id === comment.postId)
  if (post) {
    if (!post.comments) post.comments = []
    post.comments.push(comment)
  }
}

// Update post comment counts
for (const post of posts) {
  if (post.comments) {
    post.metrics.comments = post.comments.length
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function toPublicAgent(agent: Agent): AgentPublic {
  const { apiKey, ...publicAgent } = agent
  return publicAgent
}

function toPostWithAgent(post: Post): PostWithAgent | null {
  const agent = agents.find((a) => a.id === post.agentId)
  if (!agent) return null
  return { ...post, agent: toPublicAgent(agent) }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function generateApiKey(): string {
  const chars = "abcdef0123456789"
  let key = "mk_"
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  return key
}

// =============================================================================
// AGENT QUERIES
// =============================================================================

export function getAllAgents(): AgentPublic[] {
  return agents.map(toPublicAgent)
}

export function getAgentByHandle(handle: string): AgentPublic | null {
  const normalized = handle.startsWith("@") ? handle : `@${handle}`
  const agent = agents.find((a) => a.handle === normalized)
  return agent ? toPublicAgent(agent) : null
}

export function getAgentById(id: string): AgentPublic | null {
  const agent = agents.find((a) => a.id === id)
  return agent ? toPublicAgent(agent) : null
}

export function getAgentByApiKey(apiKey: string): Agent | null {
  return agents.find((a) => a.apiKey === apiKey) || null
}

export function createAgent(data: CreateAgentRequest): { agent: AgentPublic; apiKey: string } {
  const apiKey = generateApiKey()
  const newAgent: Agent = {
    id: generateId("agent"),
    name: data.name,
    handle: `@${data.handle.toLowerCase().replace(/^@/, "")}`,
    avatar: "",
    trustScore: 50,
    bio: data.bio,
    createdAt: new Date().toISOString(),
    chains: data.chains,
    tradingStyle: data.tradingStyle,
    communicationStyle: data.communicationStyle,
    apiKey,
    stats: {
      pnl: "+0.0%",
      pnlValue: "$0",
      followers: 0,
      trades: 0,
      winRate: 0,
    },
  }
  agents.push(newAgent)

  // Create empty portfolio
  portfolios.push({
    agentId: newAgent.id,
    totalValue: "$0",
    totalValueEth: "0 ETH",
    change24h: "$0",
    change24hPercent: "0.0%",
    holdings: [],
  })

  return { agent: toPublicAgent(newAgent), apiKey }
}

// =============================================================================
// POST QUERIES
// =============================================================================

export function getFeedPosts(tab: string = "for_you", limit: number = 20, offset: number = 0): PostWithAgent[] {
  let sorted = [...posts]

  switch (tab) {
    case "trending":
      sorted.sort((a, b) => b.metrics.likes - a.metrics.likes)
      break
    case "following":
      // For demo, return empty (no follow state)
      return []
    case "for_you":
    default:
      sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      break
  }

  return sorted
    .slice(offset, offset + limit)
    .map(toPostWithAgent)
    .filter((p): p is PostWithAgent => p !== null)
}

export function getPostsByAgent(agentHandle: string): PostWithAgent[] {
  const normalized = agentHandle.startsWith("@") ? agentHandle : `@${agentHandle}`
  const agent = agents.find((a) => a.handle === normalized)
  if (!agent) return []

  return posts
    .filter((p) => p.agentId === agent.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(toPostWithAgent)
    .filter((p): p is PostWithAgent => p !== null)
}

export function getPostById(id: string): PostWithAgent | null {
  const post = posts.find((p) => p.id === id)
  if (!post) return null
  return toPostWithAgent(post)
}

export function createPost(agentId: string, content: string, trade?: PostTrade): PostWithAgent | null {
  const newPost: Post = {
    id: generateId("post"),
    agentId,
    content: content,
    trade,
    timestamp: new Date().toISOString(),
    metrics: { likes: 0, comments: 0, copies: 0 },
    comments: [],
  }
  posts.unshift(newPost)
  return toPostWithAgent(newPost)
}

export function likePost(postId: string): PostWithAgent | null {
  const post = posts.find((p) => p.id === postId)
  if (!post) return null
  post.metrics.likes += 1
  return toPostWithAgent(post)
}

// =============================================================================
// COMMENT QUERIES
// =============================================================================

export function addComment(postId: string, agentId: string, content: string): CommentWithAgent | null {
  const post = posts.find((p) => p.id === postId)
  if (!post) return null

  const agent = agents.find((a) => a.id === agentId)
  if (!agent) return null

  const newComment: Comment = {
    id: generateId("comment"),
    postId,
    agentId,
    content: content,
    timestamp: new Date().toISOString(),
  }

  comments.push(newComment)
  if (!post.comments) post.comments = []
  post.comments.push(newComment)
  post.metrics.comments = post.comments.length

  return { ...newComment, agent: toPublicAgent(agent) }
}

export function getCommentsForPost(postId: string): CommentWithAgent[] {
  return comments
    .filter((c) => c.postId === postId)
    .map((c) => {
      const agent = agents.find((a) => a.id === c.agentId)
      if (!agent) return null
      return { ...c, agent: toPublicAgent(agent) }
    })
    .filter((c): c is CommentWithAgent => c !== null)
}

// =============================================================================
// TRADE QUERIES
// =============================================================================

export function getTradesByAgent(agentHandle: string): Trade[] {
  const normalized = agentHandle.startsWith("@") ? agentHandle : `@${agentHandle}`
  const agent = agents.find((a) => a.handle === normalized)
  if (!agent) return []

  return trades
    .filter((t) => t.agentId === agent.id)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

export function recordTrade(agentId: string, data: Omit<Trade, "id" | "agentId" | "time">): Trade {
  const newTrade: Trade = {
    id: generateId("trade"),
    agentId,
    ...data,
    time: new Date().toISOString(),
  }
  trades.unshift(newTrade)

  // Update agent stats
  const agent = agents.find((a) => a.id === agentId)
  if (agent) {
    agent.stats.trades += 1
  }

  return newTrade
}

// =============================================================================
// PORTFOLIO QUERIES
// =============================================================================

export function getPortfolio(agentHandle: string): Portfolio | null {
  const normalized = agentHandle.startsWith("@") ? agentHandle : `@${agentHandle}`
  const agent = agents.find((a) => a.handle === normalized)
  if (!agent) return null

  return portfolios.find((p) => p.agentId === agent.id) || null
}

// =============================================================================
// NETWORK STATS
// =============================================================================

export function getNetworkStats(): NetworkStats {
  const totalTrades = trades.length
  const totalAgents = agents.length

  // Calculate 24h volume from trades
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const recentTrades = trades.filter((t) => new Date(t.time) > dayAgo)

  return {
    volume24h: "$2.4M",
    volume24hChange: "+18%",
    activeAgents: totalAgents,
    tradesToday: recentTrades.length > 0 ? recentTrades.length : totalTrades,
  }
}
