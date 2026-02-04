// LI.FI API mock - will be replaced with actual LI.FI SDK integration

import { Chain, Token, RouteInfo } from "./types";

// Mock supported chains
export const SUPPORTED_CHAINS: Chain[] = [
  { id: 1, name: "Ethereum", nativeCurrency: { symbol: "ETH", decimals: 18 } },
  { id: 42161, name: "Arbitrum", nativeCurrency: { symbol: "ETH", decimals: 18 } },
  { id: 10, name: "Optimism", nativeCurrency: { symbol: "ETH", decimals: 18 } },
  { id: 8453, name: "Base", nativeCurrency: { symbol: "ETH", decimals: 18 } },
  { id: 137, name: "Polygon", nativeCurrency: { symbol: "MATIC", decimals: 18 } },
  { id: 43114, name: "Avalanche", nativeCurrency: { symbol: "AVAX", decimals: 18 } },
  { id: 56, name: "BNB Chain", nativeCurrency: { symbol: "BNB", decimals: 18 } },
];

// Mock popular tokens
export const POPULAR_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, chainId: 1 },
  { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, chainId: 1 },
  { symbol: "USDT", name: "Tether USD", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, chainId: 1 },
  { symbol: "DAI", name: "Dai Stablecoin", address: "0x6B175474E89094C44Da98b954EesdeC503d6F48", decimals: 18, chainId: 1 },
  { symbol: "WBTC", name: "Wrapped BTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, chainId: 1 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, chainId: 1 },
];

// Mock DeFi protocols
export const DEFI_PROTOCOLS = [
  { name: "Aave", category: "lending", chains: [1, 42161, 10, 137] },
  { name: "Compound", category: "lending", chains: [1] },
  { name: "Uniswap", category: "dex", chains: [1, 42161, 10, 8453, 137] },
  { name: "SushiSwap", category: "dex", chains: [1, 42161, 137] },
  { name: "Curve", category: "dex", chains: [1, 42161, 10, 137] },
  { name: "Lido", category: "staking", chains: [1] },
  { name: "Stargate", category: "bridge", chains: [1, 42161, 10, 8453, 137, 43114, 56] },
];

// Mock function to get route quote
export async function getRouteQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
}): Promise<RouteInfo> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock route info
  const isCrossChain = params.fromChain !== params.toChain;
  const isSameToken = params.fromToken === params.toToken;

  let totalSteps = 0;
  if (isCrossChain) totalSteps++;
  if (!isSameToken) totalSteps++;
  if (totalSteps === 0) totalSteps = 1;

  return {
    totalSteps,
    estimatedTime: isCrossChain ? "2-5 min" : "< 1 min",
    estimatedGas: isCrossChain ? "~$5.00" : "~$3.00",
    estimatedOutput: `${params.amount} ${params.toToken}`,
  };
}

// Mock function to execute route
export async function executeRoute(
  routeId: string,
  onStepUpdate: (stepId: string, status: "executing" | "complete" | "error") => void
): Promise<{ success: boolean; txHash?: string }> {
  // Simulate step execution
  const steps = ["bridge-1", "swap-1", "deposit-1"];

  for (const step of steps) {
    onStepUpdate(step, "executing");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onStepUpdate(step, "complete");
  }

  return {
    success: true,
    txHash: "0x" + Math.random().toString(16).slice(2, 66),
  };
}

// Get chain name by ID
export function getChainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  return chain?.name || "Unknown";
}

// Get chain ID by name
export function getChainId(name: string): number | undefined {
  const normalizedName = name.toLowerCase();
  const chain = SUPPORTED_CHAINS.find(
    (c) => c.name.toLowerCase() === normalizedName
  );
  return chain?.id;
}
