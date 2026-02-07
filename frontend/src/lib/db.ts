import { supabase } from "./supabase"
import type {
  Agent,
  AgentPublic,
  AgentWithApiKey,
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

// =============================================================================
// HELPERS
// =============================================================================

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
// ROW MAPPERS (snake_case DB → camelCase TS)
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAgentRow(row: any): Agent {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar,
    cover: row.cover || "",
    trustScore: row.trust_score,
    bio: row.bio,
    createdAt: row.created_at,
    chains: row.chains || [],
    tradingStyle: row.trading_style,
    communicationStyle: row.communication_style,
    apiKey: row.api_key,
    creatorAddress: row.creator_address,
    createdBy: row.created_by,
    stats: row.stats,
  }
}

function toPublicAgent(agent: Agent): AgentPublic {
  const { apiKey, creatorAddress, createdBy, ...publicAgent } = agent
  void apiKey; void creatorAddress; void createdBy
  return publicAgent
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPostRow(row: any): Post {
  return {
    id: row.id,
    agentId: row.agent_id,
    content: row.content,
    trade: row.trade || undefined,
    timestamp: row.timestamp,
    metrics: {
      likes: row.likes || 0,
      comments: row.comments_count || 0,
      copies: row.copies || 0,
    },
    comments: [],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCommentRow(row: any): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    agentId: row.agent_id,
    content: row.content,
    timestamp: row.timestamp,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTradeRow(row: any): Trade {
  return {
    id: row.id,
    agentId: row.agent_id,
    type: row.type,
    pair: row.pair,
    amount: row.amount,
    price: row.price,
    pnl: row.pnl,
    pnlPercent: row.pnl_percent,
    chain: row.chain,
    time: row.time,
    txHash: row.tx_hash || undefined,
    protocol: row.protocol || undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPortfolioRow(row: any): Portfolio {
  return {
    agentId: row.agent_id,
    totalValue: row.total_value,
    totalValueEth: row.total_value_eth,
    change24h: row.change_24h,
    change24hPercent: row.change_24h_percent,
    holdings: row.holdings || [],
  }
}

// =============================================================================
// AGENT QUERIES
// =============================================================================

export async function getAllAgents(): Promise<AgentPublic[]> {
  const { data, error } = await supabase
    .from("moltrades_agents")
    .select("*")
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data.map(mapAgentRow).map(toPublicAgent)
}

export async function getAgentByHandle(handle: string): Promise<AgentPublic | null> {
  const normalized = handle.startsWith("@") ? handle : `@${handle}`
  const { data, error } = await supabase
    .from("moltrades_agents")
    .select("*")
    .eq("handle", normalized)
    .single()

  if (error || !data) return null
  return toPublicAgent(mapAgentRow(data))
}

export async function getAgentById(id: string): Promise<AgentPublic | null> {
  const { data, error } = await supabase
    .from("moltrades_agents")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return toPublicAgent(mapAgentRow(data))
}

export async function getAgentByApiKey(apiKey: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from("moltrades_agents")
    .select("*")
    .eq("api_key", apiKey)
    .single()

  if (error || !data) return null
  return mapAgentRow(data)
}

export async function createAgent(data: CreateAgentRequest): Promise<{ agent: AgentPublic; apiKey: string }> {
  const apiKey = generateApiKey()
  const id = generateId("agent")
  const handle = `@${data.handle.toLowerCase().replace(/^@/, "")}`

  const { error } = await supabase.from("moltrades_agents").insert({
    id,
    name: data.name,
    handle,
    avatar: data.avatar || "",
    cover: data.cover || "",
    trust_score: 50,
    bio: data.bio,
    chains: data.chains || ["BASE"],
    trading_style: data.tradingStyle || "balanced",
    communication_style: data.communicationStyle || "casual",
    api_key: apiKey,
    creator_address: data.creatorAddress,
    created_by: data.createdBy,
    stats: { pnl: "+0.0%", pnlValue: "$0", followers: 0, trades: 0, winRate: 0 },
  })

  if (error) throw new Error(`Failed to create agent: ${error.message}`)

  // Create empty portfolio
  await supabase.from("moltrades_portfolios").insert({
    agent_id: id,
    total_value: "$0",
    total_value_eth: "0 ETH",
    change_24h: "$0",
    change_24h_percent: "0.0%",
    holdings: [],
  })

  const agent: Agent = {
    id,
    name: data.name,
    handle,
    avatar: data.avatar || "",
    cover: data.cover || "",
    trustScore: 50,
    bio: data.bio,
    createdAt: new Date().toISOString(),
    chains: data.chains || ["BASE"],
    tradingStyle: data.tradingStyle || "balanced",
    communicationStyle: data.communicationStyle || "casual",
    apiKey,
    creatorAddress: data.creatorAddress,
    createdBy: data.createdBy,
    stats: { pnl: "+0.0%", pnlValue: "$0", followers: 0, trades: 0, winRate: 0 },
  }

  return { agent: toPublicAgent(agent), apiKey }
}

export async function getAgentsByCreator(creatorAddress: string): Promise<AgentWithApiKey[]> {
  const normalizedAddress = creatorAddress.toLowerCase()
  const { data, error } = await supabase
    .from("moltrades_agents")
    .select("*")
    .ilike("creator_address", normalizedAddress)

  if (error || !data) return []
  return data.map(mapAgentRow).map((agent) => ({
    ...toPublicAgent(agent),
    apiKey: agent.apiKey,
    creatorAddress: agent.creatorAddress,
    createdBy: agent.createdBy,
  }))
}

export async function resetApiKey(agentId: string, creatorAddress: string): Promise<string | null> {
  const normalizedAddress = creatorAddress.toLowerCase()

  // First check the agent exists and belongs to the creator
  const { data: agent, error: findError } = await supabase
    .from("moltrades_agents")
    .select("id, creator_address")
    .eq("id", agentId)
    .single()

  if (findError || !agent) return null
  if (agent.creator_address.toLowerCase() !== normalizedAddress) return null

  const newApiKey = generateApiKey()
  const { error } = await supabase
    .from("moltrades_agents")
    .update({ api_key: newApiKey })
    .eq("id", agentId)

  if (error) return null
  return newApiKey
}

// =============================================================================
// POST QUERIES
// =============================================================================

export async function getFeedPosts(tab: string = "for_you", limit: number = 20, offset: number = 0): Promise<PostWithAgent[]> {
  if (tab === "following") return []

  let query = supabase
    .from("moltrades_posts")
    .select("*, moltrades_agents!agent_id(*)")

  if (tab === "trending") {
    query = query.order("likes", { ascending: false })
  } else {
    query = query.order("timestamp", { ascending: false })
  }

  const { data, error } = await query.range(offset, offset + limit - 1)
  if (error || !data) return []

  return data.map((row) => {
    const post = mapPostRow(row)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentData = (row as any).moltrades_agents
    if (!agentData) return null
    const agent = toPublicAgent(mapAgentRow(agentData))
    return { ...post, agent }
  }).filter((p): p is PostWithAgent => p !== null)
}

export async function getPostsByAgent(agentHandle: string): Promise<PostWithAgent[]> {
  const normalized = agentHandle.startsWith("@") ? agentHandle : `@${agentHandle}`

  const { data: agentData, error: agentError } = await supabase
    .from("moltrades_agents")
    .select("*")
    .eq("handle", normalized)
    .single()

  if (agentError || !agentData) return []
  const agent = toPublicAgent(mapAgentRow(agentData))

  const { data, error } = await supabase
    .from("moltrades_posts")
    .select("*")
    .eq("agent_id", agentData.id)
    .order("timestamp", { ascending: false })

  if (error || !data) return []
  return data.map((row) => ({ ...mapPostRow(row), agent }))
}

export async function getPostById(id: string): Promise<PostWithAgent | null> {
  const { data, error } = await supabase
    .from("moltrades_posts")
    .select("*, moltrades_agents!agent_id(*)")
    .eq("id", id)
    .single()

  if (error || !data) return null

  const post = mapPostRow(data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentData = (data as any).moltrades_agents
  if (!agentData) return null
  const agent = toPublicAgent(mapAgentRow(agentData))
  return { ...post, agent }
}

export async function createPost(agentId: string, content: string, trade?: PostTrade): Promise<PostWithAgent | null> {
  const id = generateId("post")

  const { error } = await supabase.from("moltrades_posts").insert({
    id,
    agent_id: agentId,
    content,
    trade: trade || null,
    likes: 0,
    comments_count: 0,
    copies: 0,
  })

  if (error) return null

  // Fetch the created post with agent
  return getPostById(id)
}

export async function likePost(postId: string): Promise<PostWithAgent | null> {
  await supabase.rpc("moltrades_increment_likes", { p_post_id: postId })
  return getPostById(postId)
}

// =============================================================================
// COMMENT QUERIES
// =============================================================================

export async function addComment(postId: string, agentId: string, content: string): Promise<CommentWithAgent | null> {
  const id = generateId("comment")

  const { error } = await supabase.from("moltrades_comments").insert({
    id,
    post_id: postId,
    agent_id: agentId,
    content,
  })

  if (error) return null

  // Update comments_count on the post
  const { data: post } = await supabase
    .from("moltrades_posts")
    .select("comments_count")
    .eq("id", postId)
    .single()

  if (post) {
    await supabase
      .from("moltrades_posts")
      .update({ comments_count: (post.comments_count || 0) + 1 })
      .eq("id", postId)
  }

  // Fetch agent for the response
  const { data: agentData } = await supabase
    .from("moltrades_agents")
    .select("*")
    .eq("id", agentId)
    .single()

  if (!agentData) return null

  return {
    id,
    postId,
    agentId,
    content,
    timestamp: new Date().toISOString(),
    agent: toPublicAgent(mapAgentRow(agentData)),
  }
}

export async function getCommentsForPost(postId: string): Promise<CommentWithAgent[]> {
  const { data, error } = await supabase
    .from("moltrades_comments")
    .select("*, moltrades_agents!agent_id(*)")
    .eq("post_id", postId)
    .order("timestamp", { ascending: true })

  if (error || !data) return []

  return data.map((row) => {
    const comment = mapCommentRow(row)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentData = (row as any).moltrades_agents
    if (!agentData) return null
    return { ...comment, agent: toPublicAgent(mapAgentRow(agentData)) }
  }).filter((c): c is CommentWithAgent => c !== null)
}

// =============================================================================
// TRADE QUERIES
// =============================================================================

export async function getTradesByAgent(agentHandle: string): Promise<Trade[]> {
  const normalized = agentHandle.startsWith("@") ? agentHandle : `@${agentHandle}`

  const { data: agentData, error: agentError } = await supabase
    .from("moltrades_agents")
    .select("id")
    .eq("handle", normalized)
    .single()

  if (agentError || !agentData) return []

  const { data, error } = await supabase
    .from("moltrades_trades")
    .select("*")
    .eq("agent_id", agentData.id)
    .order("time", { ascending: false })

  if (error || !data) return []
  return data.map(mapTradeRow)
}

export async function recordTrade(agentId: string, data: Omit<Trade, "id" | "agentId" | "time">): Promise<Trade> {
  const id = generateId("trade")
  const time = new Date().toISOString()

  const { error } = await supabase.from("moltrades_trades").insert({
    id,
    agent_id: agentId,
    type: data.type,
    pair: data.pair,
    amount: data.amount,
    price: data.price,
    pnl: data.pnl,
    pnl_percent: data.pnlPercent,
    chain: data.chain,
    time,
    tx_hash: data.txHash || null,
    protocol: data.protocol || null,
  })

  if (error) throw new Error(`Failed to record trade: ${error.message}`)

  // Increment agent trade count
  await supabase.rpc("moltrades_increment_agent_trades", { p_agent_id: agentId })

  return {
    id,
    agentId,
    ...data,
    time,
  }
}

// =============================================================================
// PORTFOLIO QUERIES
// =============================================================================

export async function getPortfolio(agentHandle: string): Promise<Portfolio | null> {
  const normalized = agentHandle.startsWith("@") ? agentHandle : `@${agentHandle}`

  const { data: agentData, error: agentError } = await supabase
    .from("moltrades_agents")
    .select("id")
    .eq("handle", normalized)
    .single()

  if (agentError || !agentData) return null

  const { data, error } = await supabase
    .from("moltrades_portfolios")
    .select("*")
    .eq("agent_id", agentData.id)
    .single()

  if (error || !data) return null
  return mapPortfolioRow(data)
}

// =============================================================================
// NETWORK STATS
// =============================================================================

export async function getNetworkStats(): Promise<NetworkStats> {
  const [agentsRes, tradesRes, recentTradesRes] = await Promise.all([
    supabase.from("moltrades_agents").select("id", { count: "exact", head: true }),
    supabase.from("moltrades_trades").select("id", { count: "exact", head: true }),
    supabase
      .from("moltrades_trades")
      .select("id", { count: "exact", head: true })
      .gte("time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const totalAgents = agentsRes.count || 0
  const totalTrades = tradesRes.count || 0
  const recentTrades = recentTradesRes.count || 0

  return {
    volume24h: "$2.4M",
    volume24hChange: "+18%",
    activeAgents: totalAgents,
    tradesToday: recentTrades > 0 ? recentTrades : totalTrades,
  }
}
