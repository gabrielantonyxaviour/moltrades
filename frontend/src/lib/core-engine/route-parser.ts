import type { ParsedIntent } from "@/lib/lifi/types";
import { isValidIntent } from "@/lib/lifi/intent-parser";

/**
 * Extract a ParsedIntent from Claude's response text.
 *
 * Looks for a fenced code block tagged `route` containing JSON:
 *
 *   ```route
 *   { "action": "swap", "fromToken": "ETH", ... }
 *   ```
 *
 * Falls back to scanning for any JSON object that looks like a route.
 */
export function parseRouteFromResponse(responseText: string): ParsedIntent | null {
  // 1. Try ```route ... ``` fenced block
  const fencedMatch = responseText.match(/```route\s*\n([\s\S]*?)\n\s*```/);
  if (fencedMatch) {
    const parsed = tryParseRouteJSON(fencedMatch[1]);
    if (parsed) return parsed;
  }

  // 2. Try ```json ... ``` fenced block that looks like a route
  const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/g);
  if (jsonMatch) {
    for (const block of jsonMatch) {
      const inner = block.replace(/```json\s*\n/, "").replace(/\n\s*```/, "");
      const parsed = tryParseRouteJSON(inner);
      if (parsed) return parsed;
    }
  }

  // 3. Try to find a bare JSON object with "action" field
  const bareMatch = responseText.match(/\{[^{}]*"action"\s*:\s*"(?:bridge|swap|deposit|complex)"[^{}]*\}/);
  if (bareMatch) {
    const parsed = tryParseRouteJSON(bareMatch[0]);
    if (parsed) return parsed;
  }

  return null;
}

function tryParseRouteJSON(jsonStr: string): ParsedIntent | null {
  try {
    const obj = JSON.parse(jsonStr.trim());

    // Must have an action field
    if (!obj.action || !["bridge", "swap", "deposit", "complex"].includes(obj.action)) {
      return null;
    }

    const intent: ParsedIntent = {
      action: obj.action,
      fromToken: obj.fromToken || obj.from_token,
      toToken: obj.toToken || obj.to_token,
      amount: obj.amount ? String(obj.amount) : undefined,
      fromChain: obj.fromChain || obj.from_chain,
      toChain: obj.toChain || obj.to_chain,
      protocol: obj.protocol,
      description: obj.description || `${obj.action} ${obj.amount || ""} ${obj.fromToken || ""}`.trim(),
    };

    if (isValidIntent(intent)) {
      return intent;
    }

    // Even if not fully valid, return it if it has action + some data
    // so we can show a partial flow
    if (intent.fromToken && intent.amount) {
      return intent;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Scans all AI text log entries for route JSON blocks.
 * Returns the last valid one (most recent AI response wins).
 */
export function parseRouteFromLogEntries(
  logEntries: Array<{ type: string; content: string }>
): ParsedIntent | null {
  // Scan in reverse — last route block wins
  for (let i = logEntries.length - 1; i >= 0; i--) {
    const entry = logEntries[i];
    if (entry.type === "text") {
      const intent = parseRouteFromResponse(entry.content);
      if (intent) return intent;
    }
  }
  return null;
}
