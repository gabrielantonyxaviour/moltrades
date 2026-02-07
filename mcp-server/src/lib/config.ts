/**
 * LI.FI SDK Configuration for MCP Server
 *
 * All logging goes to stderr (MCP protocol uses stdout for JSON-RPC).
 */

import { createConfig, EVM } from '@lifi/sdk';
import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  type WalletClient,
  type PublicClient,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, arbitrum } from 'viem/chains';
import type { Address, ChainId } from './types.js';

// Define Unichain mainnet
export const unichain = defineChain({
  id: 130,
  name: 'Unichain',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://uniscan.xyz' },
  },
});

const chains: readonly [Chain, Chain, Chain] = [base, arbitrum, unichain];

let _walletClients: Record<number, WalletClient> = {};
let _publicClients: Record<number, PublicClient> = {};
let _initialized = false;

export function initializeLifiSDK(): { address: Address } {
  if (_initialized) {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    return { address: account.address as Address };
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === '0x') {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  for (const chain of chains) {
    _walletClients[chain.id] = createWalletClient({
      account,
      chain,
      transport: http(),
    });
    _publicClients[chain.id] = createPublicClient({
      chain,
      transport: http(),
    });
  }

  createConfig({
    integrator: 'ethglobal-playground',
    providers: [
      EVM({
        getWalletClient: async () => _walletClients[base.id],
        switchChain: async (chainId) =>
          _walletClients[chainId] ||
          createWalletClient({
            account,
            chain: chains.find((c) => c.id === chainId)!,
            transport: http(),
          }),
      }),
    ],
  });

  _initialized = true;
  console.error(`[Config] SDK initialized for address: ${account.address}`);

  return { address: account.address as Address };
}

export function getWalletClient(chainId: ChainId): WalletClient {
  const client = _walletClients[chainId];
  if (!client) throw new Error(`No wallet client for chain ${chainId}`);
  return client;
}

export function getPublicClient(chainId: ChainId): PublicClient {
  let client = _publicClients[chainId];
  if (!client) {
    // Dynamically create client for new chains (like Unichain)
    const chain = chains.find((c) => c.id === chainId);
    if (chain) {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      _walletClients[chainId] = createWalletClient({
        account,
        chain,
        transport: http(),
      });
      _publicClients[chainId] = createPublicClient({
        chain,
        transport: http(),
      });
      client = _publicClients[chainId];
    }
  }
  if (!client) throw new Error(`No public client for chain ${chainId}`);
  return client;
}

export const CHAIN_IDS = {
  BASE: 8453,
  ARBITRUM: 42161,
  UNICHAIN: 130,
} as const;

export const TOKEN_ADDRESSES = {
  BASE: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' as Address,
  },
  ARBITRUM: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address,
    'USDC.e': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as Address,
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address,
  },
  UNICHAIN: {
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    USDC: '0x078d782b760474a361dda0af3839290b0ef57ad6' as Address,
    USDT: '0x9151434b16b9763660705744891fa906f660ecc5' as Address,
    UNI: '0x8f187aA05619a017077f5308904739877ce9eA21' as Address,
    WSTETH: '0xc02fE7317D4eb8753a02c35fe019786854A92001' as Address,
    USDS: '0x7E10036Acc4B56d4dFCa3b77810356CE52313F9C' as Address,
  },
} as const;

// Alias functions for uniswap-v4.ts compatibility
export function walletClient(chainId: ChainId): WalletClient {
  return getWalletClient(chainId);
}

export function publicClient(chainId: ChainId): PublicClient {
  return getPublicClient(chainId);
}
