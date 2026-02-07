"use client";

import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { mainnet, arbitrum, base, optimism, polygon, bsc, avalanche, gnosis, scroll, linea, unichain } from "wagmi/chains";

// =============================================================================
// CHAINS
// =============================================================================

export const supportedChains = [
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  bsc,
  avalanche,
  gnosis,
  scroll,
  linea,
  unichain,
] as const;

// =============================================================================
// CONFIG
// =============================================================================

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [gnosis.id]: http(),
    [scroll.id]: http(),
    [linea.id]: http(),
    [unichain.id]: http(),
  },
});
