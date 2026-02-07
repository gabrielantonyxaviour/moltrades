import { createClient } from '@supabase/supabase-js';
import { MoltradesApiClient } from './api-client.js';
import { generateComment } from './inference.js';
import { buildSystemPrompt, buildCommentPrompt } from './prompts.js';
import type { AgentRecord, FeedPost, AgentAction, CooldownMap } from './types.js';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per agent
const cooldowns: CooldownMap = {};

// Track which posts an agent has already commented on
const commentedPosts: Record<string, Set<string>> = {};

export async function runCycle(): Promise<AgentAction[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  // 1. Get all agents with API keys
  const { data: agents, error } = await supabase
    .from('moltrades_agents')
    .select('id, name, handle, bio, avatar, trading_style, communication_style, api_key, trust_score');

  if (error || !agents || agents.length === 0) {
    console.log('[Engine] No agents found or error:', error?.message);
    return [];
  }

  // 2. Pick 1-3 random agents (respecting cooldowns)
  const now = Date.now();
  const availableAgents = agents.filter(
    (a: AgentRecord) => !cooldowns[a.id] || now - cooldowns[a.id] > COOLDOWN_MS
  );

  if (availableAgents.length === 0) {
    console.log('[Engine] All agents on cooldown');
    return [];
  }

  const numAgents = Math.min(
    Math.floor(Math.random() * 3) + 1,
    availableAgents.length
  );

  // Shuffle and pick
  const shuffled = availableAgents.sort(() => Math.random() - 0.5);
  const selectedAgents = shuffled.slice(0, numAgents) as AgentRecord[];

  const actions: AgentAction[] = [];

  for (const agent of selectedAgents) {
    try {
      const action = await processAgent(agent);
      if (action) {
        actions.push(action);
        cooldowns[agent.id] = Date.now();
      }
    } catch (err) {
      console.error(`[Engine] Error processing agent ${agent.handle}:`, err);
    }

    // Random delay between agents (1-3 seconds)
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
  }

  return actions;
}

async function processAgent(agent: AgentRecord): Promise<AgentAction | null> {
  const apiUrl = process.env.MOLTRADES_API_URL || 'http://localhost:3002';
  const client = new MoltradesApiClient(apiUrl, agent.api_key);

  // 10% chance of "just browsing" (no action)
  if (Math.random() < 0.1) {
    console.log(`[Engine] ${agent.handle} is just browsing`);
    return { type: 'skip', agentId: agent.id, agentHandle: agent.handle };
  }

  // Browse the feed
  const posts = await client.browseFeed(20);

  if (posts.length === 0) {
    console.log(`[Engine] No posts in feed for ${agent.handle}`);
    return null;
  }

  // Initialize comment tracking for this agent
  if (!commentedPosts[agent.id]) {
    commentedPosts[agent.id] = new Set();
  }

  // Filter: no own posts, no already-commented
  const candidates = posts.filter(
    (p) => p.agent.id !== agent.id && !commentedPosts[agent.id].has(p.id)
  );

  if (candidates.length === 0) {
    console.log(`[Engine] No eligible posts for ${agent.handle}`);
    return null;
  }

  // Pick a random post (weighted toward newer posts)
  const post = candidates[Math.floor(Math.random() * Math.min(candidates.length, 5))];

  // Generate a comment using AI
  const systemPrompt = buildSystemPrompt(agent);
  const userPrompt = buildCommentPrompt(post);
  const comment = await generateComment(systemPrompt, userPrompt);

  if (!comment) {
    console.log(`[Engine] Empty comment generated for ${agent.handle}`);
    return null;
  }

  // Post the comment
  await client.commentOnPost(post.id, comment);
  commentedPosts[agent.id].add(post.id);
  console.log(`[Engine] ${agent.handle} commented on ${post.id}: "${comment.substring(0, 50)}..."`);

  // 50% chance to also like the post
  if (Math.random() < 0.5) {
    try {
      await client.likePost(post.id);
      console.log(`[Engine] ${agent.handle} liked ${post.id}`);
    } catch {
      // Silent fail for likes
    }
  }

  return {
    type: 'comment',
    postId: post.id,
    content: comment,
    agentId: agent.id,
    agentHandle: agent.handle,
  };
}
