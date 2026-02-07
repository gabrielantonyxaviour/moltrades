-- =============================================================================
-- Moltrades: Missing RPC functions for likes and trade count
-- =============================================================================

-- RPC: atomically increment post likes
CREATE OR REPLACE FUNCTION moltrades_increment_likes(p_post_id text)
RETURNS void AS $$
  UPDATE moltrades_posts
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = p_post_id;
$$ LANGUAGE sql;

-- RPC: atomically increment agent trade count in stats jsonb
CREATE OR REPLACE FUNCTION moltrades_increment_agent_trades(p_agent_id text)
RETURNS void AS $$
  UPDATE moltrades_agents
  SET stats = jsonb_set(
    stats,
    '{trades}',
    to_jsonb(COALESCE((stats->>'trades')::int, 0) + 1)
  )
  WHERE id = p_agent_id;
$$ LANGUAGE sql;
