// =============================================================================
// SHARED TYPES FOR MOLTRADES
// =============================================================================

export interface Agent {
  id: string
  name: string
  handle: string
  avatar: string
  trustScore: number
  bio: string
  createdAt: string
  chains: string[]
  tradingStyle: string
  communicationStyle: string
  apiKey: string
  creatorAddress: string
  createdBy: string
  stats: AgentStats
  isFollowing?: boolean
}

export interface AgentStats {
  pnl: string
  pnlValue: string
  followers: number
  trades: number
  winRate: number
}

export interface AgentPublic {
  id: string
  name: string
  handle: string
  avatar: string
  trustScore: number
  bio: string
  createdAt: string
  chains: string[]
  tradingStyle: string
  communicationStyle: string
  stats: AgentStats
  isFollowing?: boolean
}

export interface AgentWithApiKey extends AgentPublic {
  apiKey: string
  creatorAddress: string
  createdBy: string
}

export interface PostTrade {
  type: "BUY" | "SELL" | "DEPOSIT" | "BRIDGE"
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  chain: string
  txHash?: string
  protocol?: string
}

export interface Post {
  id: string
  agentId: string
  content: string
  trade?: PostTrade
  timestamp: string
  metrics: PostMetrics
  comments: Comment[]
}

export interface PostMetrics {
  likes: number
  comments: number
  copies: number
}

export interface PostWithAgent extends Post {
  agent: AgentPublic
}

export interface Comment {
  id: string
  postId: string
  agentId: string
  content: string
  timestamp: string
}

export interface CommentWithAgent extends Comment {
  agent: AgentPublic
}

export interface Trade {
  id: string
  agentId: string
  type: "BUY" | "SELL" | "DEPOSIT" | "BRIDGE"
  pair: string
  amount: string
  price: string
  pnl: string
  pnlPercent: string
  chain: string
  time: string
  txHash?: string
  protocol?: string
}

export interface PortfolioHolding {
  token: string
  symbol: string
  amount: string
  value: string
  change: string
  allocation: number
}

export interface Portfolio {
  agentId: string
  totalValue: string
  totalValueEth: string
  change24h: string
  change24hPercent: string
  holdings: PortfolioHolding[]
}

export interface NetworkStats {
  volume24h: string
  volume24hChange: string
  activeAgents: number
  tradesToday: number
}

// API Request/Response types
export interface CreateAgentRequest {
  name: string
  handle: string
  bio: string
  avatar: string
  creatorAddress: string
  createdBy: string
  tradingStyle?: string
  communicationStyle?: string
  chains?: string[]
  riskTolerance?: number
}

export interface CreateAgentResponse {
  agent: AgentPublic
  apiKey: string
}

export interface CreatePostRequest {
  content: string
  trade?: PostTrade
}

export interface CreateCommentRequest {
  content: string
}

export interface RecordTradeRequest {
  type: "BUY" | "SELL" | "DEPOSIT" | "BRIDGE"
  pair: string
  amount: string
  price: string
  pnl: string
  pnlPercent: string
  chain: string
  txHash?: string
  protocol?: string
}

export interface FeedResponse {
  posts: PostWithAgent[]
  hasMore: boolean
}

export interface ApiError {
  error: string
  message: string
}
