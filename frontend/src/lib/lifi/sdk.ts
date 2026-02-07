/**
 * LI.FI SDK Browser Configuration
 *
 * Initializes the LI.FI SDK for use in the browser with wagmi wallet integration.
 */

import { createConfig, EVM } from "@lifi/sdk";
import type { WalletClient } from "viem";

// =============================================================================
// SUPPORTED CHAINS
// =============================================================================

export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BSC: 56,
  GNOSIS: 100,
  UNICHAIN: 130,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  LINEA: 59144,
  SCROLL: 534352,
  SUI: 9270000000000000,
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  100: "Gnosis",
  130: "Unichain",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum",
  43114: "Avalanche",
  59144: "Linea",
  534352: "Scroll",
  9270000000000000: "SUI",
};

// =============================================================================
// SDK INITIALIZATION
// =============================================================================

let sdkInitialized = false;

export function initializeLifiSDK(getWalletClient: () => Promise<WalletClient | null>) {
  if (sdkInitialized) return;

  createConfig({
    integrator: "moltrades",
    providers: [
      EVM({
        getWalletClient: async () => {
          const client = await getWalletClient();
          if (!client) {
            throw new Error("Wallet not connected");
          }
          return client;
        },
      }),
    ],
  });

  sdkInitialized = true;
}

// =============================================================================
// CHAIN UTILITIES
// =============================================================================

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Unknown (${chainId})`;
}

export function getSupportedChainIds(): number[] {
  return Object.values(CHAIN_IDS);
}

export function isChainSupported(chainId: number): boolean {
  return Object.values(CHAIN_IDS).includes(chainId as (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]);
}

// =============================================================================
// EXPLORER URLS
// =============================================================================

const EXPLORER_URLS: Record<number, string> = {
  1: "https://etherscan.io/tx/",
  10: "https://optimistic.etherscan.io/tx/",
  56: "https://bscscan.com/tx/",
  100: "https://gnosisscan.io/tx/",
  130: "https://uniscan.xyz/tx/",
  137: "https://polygonscan.com/tx/",
  8453: "https://basescan.org/tx/",
  42161: "https://arbiscan.io/tx/",
  43114: "https://snowtrace.io/tx/",
  59144: "https://lineascan.build/tx/",
  534352: "https://scrollscan.com/tx/",
};

export function buildExplorerUrl(chainId: number, txHash: string): string {
  const baseUrl = EXPLORER_URLS[chainId] || "https://blockscan.com/tx/";
  return `${baseUrl}${txHash}`;
}

// =============================================================================
// NATIVE TOKEN HELPERS
// =============================================================================

export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function isNativeToken(address: string): boolean {
  return (
    address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ||
    address.toLowerCase() === ZERO_ADDRESS.toLowerCase()
  );
}
