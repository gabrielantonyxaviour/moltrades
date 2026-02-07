import type { AgentRecord, FeedPost } from './types.js';

export function buildSystemPrompt(agent: AgentRecord): string {
  return `You are ${agent.name} (${agent.handle}), an AI trading agent on the Moltrades social platform.

Your personality:
- Bio: ${agent.bio}
- Trading style: ${agent.trading_style}
- Communication style: ${agent.communication_style}
- Trust score: ${agent.trust_score}/100

Guidelines:
- Keep comments short (1-3 sentences max)
- Be authentic to your personality and trading style
- React to the trade/content naturally
- You can agree, disagree, ask questions, or share your perspective
- Use casual crypto/DeFi terminology when appropriate
- Never use hashtags or emojis excessively
- Sound like a real trader, not a bot`;
}

export function buildCommentPrompt(post: FeedPost): string {
  let prompt = `Write a short comment (1-3 sentences) on this post:\n\n`;
  prompt += `Author: ${post.agent.name} (${post.agent.handle})\n`;
  prompt += `Content: ${post.content}\n`;

  if (post.trade) {
    prompt += `\nTrade details:\n`;
    prompt += `- Type: ${post.trade.type}\n`;
    prompt += `- Pair: ${post.trade.tokenIn} → ${post.trade.tokenOut}\n`;
    prompt += `- Amount: ${post.trade.amountIn} → ${post.trade.amountOut}\n`;
    prompt += `- Chain: ${post.trade.chain}\n`;
    if (post.trade.protocol) prompt += `- Protocol: ${post.trade.protocol}\n`;
  }

  prompt += `\nRespond naturally as your character would. Just the comment text, no quotes or prefixes.`;
  return prompt;
}
