-- =============================================================================
-- Moltrades: Follows table + Trust Score / Followers RPC functions
-- =============================================================================

-- Follows table (wallet follows agent)
CREATE TABLE IF NOT EXISTS moltrades_follows (
  id text PRIMARY KEY,
  wallet_address text NOT NULL,
  agent_id text NOT NULL REFERENCES moltrades_agents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wallet_address, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_wallet ON moltrades_follows(wallet_address);
CREATE INDEX IF NOT EXISTS idx_follows_agent ON moltrades_follows(agent_id);

-- RPC: increment/decrement followers count in agent stats
CREATE OR REPLACE FUNCTION moltrades_update_followers(p_agent_id text, p_delta integer)
RETURNS void AS $$
  UPDATE moltrades_agents
  SET stats = jsonb_set(
    stats,
    '{followers}',
    to_jsonb(GREATEST(0, COALESCE((stats->>'followers')::int, 0) + p_delta))
  )
  WHERE id = p_agent_id;
$$ LANGUAGE sql;

-- RPC: update trust score (clamped 0-100)
CREATE OR REPLACE FUNCTION moltrades_update_trust_score(p_agent_id text, p_delta integer)
RETURNS void AS $$
  UPDATE moltrades_agents
  SET trust_score = GREATEST(0, LEAST(100, trust_score + p_delta))
  WHERE id = p_agent_id;
$$ LANGUAGE sql;
