import type { ParsedIntent, PhaseIntent, MultiPhaseRoute } from "@/lib/lifi/types";
import { isValidIntent } from "@/lib/lifi/intent-parser";

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isMultiPhase(
  route: ParsedIntent | MultiPhaseRoute | null
): route is MultiPhaseRoute {
  return route !== null && "phases" in route && Array.isArray(route.phases);
}

// =============================================================================
// MAIN PARSER
// =============================================================================

/**
 * Extract a ParsedIntent or MultiPhaseRoute from Claude's response text.
 *
 * Looks for a fenced code block tagged `route` containing JSON:
 *
 *   ```route
 *   { "action": "swap", "fromToken": "ETH", ... }
 *   ```
 *
 * Also supports multi-phase format:
 *
 *   ```route
 *   { "phases": [...], "description": "..." }
 *   ```
 *
 * Falls back to scanning for any JSON object that looks like a route.
 */
export function parseRouteFromResponse(
  responseText: string
): ParsedIntent | MultiPhaseRoute | null {
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
  const bareMatch = responseText.match(
    /\{[^{}]*"action"\s*:\s*"(?:bridge|swap|deposit|complex)"[^{}]*\}/
  );
  if (bareMatch) {
    const parsed = tryParseRouteJSON(bareMatch[0]);
    if (parsed) return parsed;
  }

  return null;
}

// =============================================================================
// JSON PARSING
// =============================================================================

function tryParseRouteJSON(
  jsonStr: string
): ParsedIntent | MultiPhaseRoute | null {
  try {
    const obj = JSON.parse(jsonStr.trim());

    // Check for multi-phase format first
    if (obj.phases && Array.isArray(obj.phases)) {
      return tryParseMultiPhase(obj);
    }

    // Single-phase format
    return tryParseSinglePhase(obj);
  } catch {
    return null;
  }
}

function tryParseMultiPhase(obj: Record<string, unknown>): MultiPhaseRoute | null {
  const phasesRaw = obj.phases as Record<string, unknown>[];
  if (!phasesRaw || phasesRaw.length === 0) return null;

  const phases: PhaseIntent[] = [];

  for (const p of phasesRaw) {
    if (
      !p.action ||
      !["bridge", "swap", "deposit", "complex"].includes(p.action as string)
    ) {
      continue;
    }

    const phase: PhaseIntent = {
      phase: typeof p.phase === "number" ? p.phase : phases.length + 1,
      action: p.action as PhaseIntent["action"],
      fromToken: (p.fromToken || p.from_token) as string | undefined,
      toToken: (p.toToken || p.to_token) as string | undefined,
      amount: p.amount ? String(p.amount) : undefined,
      fromChain: (p.fromChain || p.from_chain) as string | undefined,
      toChain: (p.toChain || p.to_chain) as string | undefined,
      protocol: p.protocol as string | undefined,
      description:
        (p.description as string) ||
        `${p.action} ${p.amount || ""} ${p.fromToken || ""}`.trim(),
    };

    phases.push(phase);
  }

  if (phases.length === 0) return null;

  return {
    phases,
    description:
      (obj.description as string) ||
      phases.map((p) => p.description).join(" -> "),
  };
}

function tryParseSinglePhase(obj: Record<string, unknown>): ParsedIntent | null {
  if (
    !obj.action ||
    !["bridge", "swap", "deposit", "complex"].includes(obj.action as string)
  ) {
    return null;
  }

  const intent: ParsedIntent = {
    action: obj.action as ParsedIntent["action"],
    fromToken: (obj.fromToken || obj.from_token) as string | undefined,
    toToken: (obj.toToken || obj.to_token) as string | undefined,
    amount: obj.amount ? String(obj.amount) : undefined,
    fromChain: (obj.fromChain || obj.from_chain) as string | undefined,
    toChain: (obj.toChain || obj.to_chain) as string | undefined,
    protocol: obj.protocol as string | undefined,
    description:
      (obj.description as string) ||
      `${obj.action} ${obj.amount || ""} ${obj.fromToken || ""}`.trim(),
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
}

// =============================================================================
// LOG ENTRY SCANNER
// =============================================================================

/**
 * Scans all AI text log entries for route JSON blocks.
 * Returns the last valid one (most recent AI response wins).
 */
export function parseRouteFromLogEntries(
  logEntries: Array<{ type: string; content: string }>
): ParsedIntent | MultiPhaseRoute | null {
  // Scan in reverse — last route block wins
  for (let i = logEntries.length - 1; i >= 0; i--) {
    const entry = logEntries[i];
    if (entry.type === "text") {
      const result = parseRouteFromResponse(entry.content);
      if (result) return result;
    }
  }
  return null;
}
