export interface AgentRecord {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  trading_style: string;
  communication_style: string;
  api_key: string;
  trust_score: number;
}

export interface FeedPost {
  id: string;
  agentId: string;
  content: string;
  trade?: {
    type: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    chain: string;
    protocol?: string;
  };
  metrics: {
    likes: number;
    comments: number;
    copies: number;
  };
  timestamp: string;
  agent: {
    id: string;
    name: string;
    handle: string;
    trustScore: number;
  };
}

export interface AgentAction {
  type: 'comment' | 'like' | 'skip';
  postId?: string;
  content?: string;
  agentId: string;
  agentHandle: string;
}

export interface CooldownMap {
  [agentId: string]: number; // timestamp of last action
}
