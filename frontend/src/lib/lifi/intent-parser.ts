/**
 * Intent Parser - Enhanced
 *
 * Converts natural language to structured intents with real protocol mapping.
 */

import type { ParsedIntent } from "./types";

// =============================================================================
// PATTERNS
// =============================================================================

const BRIDGE_PATTERN = /bridge\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:from\s+)?(\w+)\s+to\s+(\w+)/i;
const SWAP_PATTERN = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)(?:\s+on\s+(\w+))?/i;
const DEPOSIT_PATTERN = /deposit\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:into|on|to)\s+(\w+)(?:\s+on\s+(\w+))?/i;
const COMPLEX_BRIDGE_DEPOSIT = /bridge\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:from\s+)?(\w+)?\s*(?:to\s+)?(\w+)?\s*(?:and|then)\s+(?:deposit\s+)?(?:into\s+)?(\w+)/i;
const SUPPLY_PATTERN = /supply\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|on|into)\s+(\w+)(?:\s+on\s+(\w+))?/i;
const STAKE_PATTERN = /stake\s+(\d+(?:\.\d+)?)\s+(\w+)(?:\s+(?:on|in|into)\s+(\w+))?/i;

// =============================================================================
// ALIASES
// =============================================================================

const CHAIN_ALIASES: Record<string, string> = {
  eth: "Ethereum",
  ethereum: "Ethereum",
  mainnet: "Ethereum",
  arb: "Arbitrum",
  arbitrum: "Arbitrum",
  op: "Optimism",
  optimism: "Optimism",
  base: "Base",
  poly: "Polygon",
  polygon: "Polygon",
  matic: "Polygon",
  avax: "Avalanche",
  avalanche: "Avalanche",
  bsc: "BNB Chain",
  bnb: "BNB Chain",
  binance: "BNB Chain",
  scroll: "Scroll",
  linea: "Linea",
  gnosis: "Gnosis",
};

const TOKEN_ALIASES: Record<string, string> = {
  eth: "ETH",
  ether: "ETH",
  ethereum: "ETH",
  usdc: "USDC",
  usdt: "USDT",
  tether: "USDT",
  dai: "DAI",
  weth: "WETH",
  wbtc: "WBTC",
  btc: "WBTC",
  matic: "MATIC",
  arb: "ARB",
  op: "OP",
  steth: "stETH",
  wsteth: "wstETH",
};

const PROTOCOL_ALIASES: Record<string, string> = {
  aave: "Aave",
  compound: "Compound",
  morpho: "Morpho",
  moonwell: "Moonwell",
  seamless: "Seamless",
  lido: "Lido",
  ethena: "Ethena",
  uniswap: "Uniswap",
  sushiswap: "SushiSwap",
  sushi: "SushiSwap",
  curve: "Curve",
  balancer: "Balancer",
  yearn: "Yearn",
  stargate: "Stargate",
};

// =============================================================================
// NORMALIZERS
// =============================================================================

function normalizeChain(chain: string): string {
  return CHAIN_ALIASES[chain.toLowerCase()] || chain;
}

function normalizeToken(token: string): string {
  return TOKEN_ALIASES[token.toLowerCase()] || token.toUpperCase();
}

function normalizeProtocol(protocol: string): string {
  return PROTOCOL_ALIASES[protocol.toLowerCase()] || protocol;
}

// =============================================================================
// MAIN PARSER
// =============================================================================

export function parseIntent(input: string): ParsedIntent {
  const normalizedInput = input.toLowerCase().trim();

  // Check for complex bridge + deposit pattern
  const complexMatch = input.match(COMPLEX_BRIDGE_DEPOSIT);
  if (complexMatch) {
    return {
      action: "complex",
      amount: complexMatch[1],
      fromToken: normalizeToken(complexMatch[2]),
      fromChain: complexMatch[3] ? normalizeChain(complexMatch[3]) : "Ethereum",
      toChain: complexMatch[4] ? normalizeChain(complexMatch[4]) : "Base",
      protocol: normalizeProtocol(complexMatch[5]),
      description: input,
    };
  }

  // Try deposit/supply pattern
  const depositMatch = input.match(DEPOSIT_PATTERN) || input.match(SUPPLY_PATTERN);
  if (depositMatch) {
    return {
      action: "deposit",
      amount: depositMatch[1],
      fromToken: normalizeToken(depositMatch[2]),
      protocol: normalizeProtocol(depositMatch[3]),
      toChain: depositMatch[4] ? normalizeChain(depositMatch[4]) : undefined,
      fromChain: depositMatch[4] ? normalizeChain(depositMatch[4]) : "Base",
      description: input,
    };
  }

  // Try bridge pattern
  const bridgeMatch = input.match(BRIDGE_PATTERN);
  if (bridgeMatch) {
    return {
      action: "bridge",
      amount: bridgeMatch[1],
      fromToken: normalizeToken(bridgeMatch[2]),
      fromChain: normalizeChain(bridgeMatch[3]),
      toChain: normalizeChain(bridgeMatch[4]),
      description: input,
    };
  }

  // Try swap pattern
  const swapMatch = input.match(SWAP_PATTERN);
  if (swapMatch) {
    return {
      action: "swap",
      amount: swapMatch[1],
      fromToken: normalizeToken(swapMatch[2]),
      toToken: normalizeToken(swapMatch[3]),
      fromChain: swapMatch[4] ? normalizeChain(swapMatch[4]) : "Ethereum",
      description: input,
    };
  }

  // Try stake pattern
  const stakeMatch = input.match(STAKE_PATTERN);
  if (stakeMatch) {
    return {
      action: "deposit",
      amount: stakeMatch[1],
      fromToken: normalizeToken(stakeMatch[2]),
      protocol: stakeMatch[3] ? normalizeProtocol(stakeMatch[3]) : "Lido",
      fromChain: "Ethereum",
      description: input,
    };
  }

  // Fallback - try to extract intent from keywords
  return extractIntentFromKeywords(normalizedInput, input);
}

// =============================================================================
// KEYWORD EXTRACTION
// =============================================================================

function extractIntentFromKeywords(normalizedInput: string, originalInput: string): ParsedIntent {
  // Check for action keywords
  const hasBridge = /bridge/i.test(normalizedInput);
  const hasSwap = /swap|exchange|trade/i.test(normalizedInput);
  const hasDeposit = /deposit|supply|stake|lend/i.test(normalizedInput);
  const hasAnd = /and|then/i.test(normalizedInput);

  // Extract amount
  const amountMatch = normalizedInput.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? amountMatch[1] : undefined;

  // Extract tokens
  const tokens: string[] = [];
  for (const [alias] of Object.entries(TOKEN_ALIASES)) {
    if (normalizedInput.includes(alias)) {
      tokens.push(normalizeToken(alias));
    }
  }

  // Extract chains
  const chains: string[] = [];
  for (const [alias] of Object.entries(CHAIN_ALIASES)) {
    if (normalizedInput.includes(alias)) {
      chains.push(normalizeChain(alias));
    }
  }

  // Extract protocols
  let protocol: string | undefined;
  for (const [alias, name] of Object.entries(PROTOCOL_ALIASES)) {
    if (normalizedInput.includes(alias)) {
      protocol = name;
      break;
    }
  }

  // Determine action
  if (hasBridge && hasDeposit && hasAnd) {
    return {
      action: "complex",
      amount,
      fromToken: tokens[0],
      fromChain: chains[0] || "Ethereum",
      toChain: chains[1] || "Base",
      protocol: protocol || "Aave",
      description: originalInput,
    };
  }

  if (hasDeposit) {
    return {
      action: "deposit",
      amount,
      fromToken: tokens[0] || "ETH",
      protocol: protocol || "Aave",
      fromChain: chains[0] || "Base",
      toChain: chains[0] || "Base",
      description: originalInput,
    };
  }

  if (hasSwap) {
    return {
      action: "swap",
      amount,
      fromToken: tokens[0] || "ETH",
      toToken: tokens[1] || "USDC",
      fromChain: chains[0] || "Ethereum",
      description: originalInput,
    };
  }

  if (hasBridge) {
    return {
      action: "bridge",
      amount,
      fromToken: tokens[0] || "ETH",
      fromChain: chains[0] || "Ethereum",
      toChain: chains[1] || "Base",
      description: originalInput,
    };
  }

  // Default to complex
  return {
    action: "complex",
    amount,
    fromToken: tokens[0] || "ETH",
    fromChain: chains[0] || "Ethereum",
    toChain: chains[1] || chains[0] || "Base",
    protocol,
    description: originalInput,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export function isValidIntent(intent: ParsedIntent): boolean {
  if (!intent.amount || parseFloat(intent.amount) <= 0) {
    return false;
  }

  if (!intent.fromToken) {
    return false;
  }

  switch (intent.action) {
    case "bridge":
      return !!intent.fromChain && !!intent.toChain;
    case "swap":
      return !!intent.toToken;
    case "deposit":
      return !!intent.protocol;
    case "complex":
      return true;
    default:
      return false;
  }
}

export function getIntentSummary(intent: ParsedIntent): string {
  switch (intent.action) {
    case "bridge":
      return `Bridge ${intent.amount} ${intent.fromToken} from ${intent.fromChain} to ${intent.toChain}`;
    case "swap":
      return `Swap ${intent.amount} ${intent.fromToken} for ${intent.toToken} on ${intent.fromChain}`;
    case "deposit":
      return `Deposit ${intent.amount} ${intent.fromToken} into ${intent.protocol}`;
    case "complex":
      if (intent.protocol) {
        return `Bridge ${intent.amount} ${intent.fromToken} to ${intent.toChain} and deposit into ${intent.protocol}`;
      }
      return `Complex operation: ${intent.description}`;
    default:
      return intent.description;
  }
}

// =============================================================================
// SUGGESTIONS
// =============================================================================

export function getSuggestions(): string[] {
  return [
    "Bridge 0.1 ETH from Ethereum to Base",
    "Swap 100 USDC to ETH on Arbitrum",
    "Deposit 0.1 ETH into Aave on Base",
    "Bridge 0.5 ETH to Base and deposit into Morpho",
    "Supply 50 USDC to Moonwell on Base",
  ];
}
