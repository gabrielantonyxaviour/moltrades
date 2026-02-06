"use client";

import { createConfig, http } from "wagmi";
import { mainnet, arbitrum, base, optimism, polygon, bsc, avalanche, gnosis, scroll, linea } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

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
] as const;

// =============================================================================
// CONFIG
// =============================================================================

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "Moltrades",
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
    }),
  ],
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
  },
});
