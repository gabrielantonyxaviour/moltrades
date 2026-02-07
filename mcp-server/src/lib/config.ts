/**
 * LI.FI SDK Configuration for MCP Server
 *
 * All logging goes to stderr (MCP protocol uses stdout for JSON-RPC).
 */

import { createConfig, EVM, Solana } from '@lifi/sdk';
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
import {
  mainnet,
  optimism,
  bsc,
  gnosis,
  polygon,
  base,
  arbitrum,
  avalanche,
  linea,
  scroll,
} from 'viem/chains';
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

const chains: readonly Chain[] = [
  mainnet,
  optimism,
  bsc,
  gnosis,
  unichain,
  polygon,
  base,
  arbitrum,
  avalanche,
  linea,
  scroll,
];

// Lookup map for fast chain resolution by ID
const chainById = new Map<number, Chain>(chains.map((c) => [c.id, c]));

let _walletClients: Record<number, WalletClient> = {};
let _publicClients: Record<number, PublicClient> = {};
let _initialized = false;

function ensureClientsForChain(chainId: number, account: ReturnType<typeof privateKeyToAccount>): void {
  if (_walletClients[chainId]) return;
  const chain = chainById.get(chainId);
  if (!chain) return;
  _walletClients[chainId] = createWalletClient({
    account,
    chain,
    transport: http(),
  });
  _publicClients[chainId] = createPublicClient({
    chain,
    transport: http(),
  });
}

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
    ensureClientsForChain(chain.id, account);
  }

  const providers: Parameters<typeof createConfig>[0]['providers'] = [
    EVM({
      getWalletClient: async () => _walletClients[base.id],
      switchChain: async (chainId) => {
        if (_walletClients[chainId]) return _walletClients[chainId];
        // Dynamically create client for any known chain
        const chain = chainById.get(chainId);
        if (chain) {
          ensureClientsForChain(chainId, account);
          return _walletClients[chainId];
        }
        // Fallback: create client with a generic chain definition
        const dynamicChain = defineChain({
          id: chainId,
          name: `Chain ${chainId}`,
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: [] } },
        });
        const client = createWalletClient({
          account,
          chain: dynamicChain,
          transport: http(),
        });
        _walletClients[chainId] = client;
        return client;
      },
    }),
  ];

  // Register Solana provider if key is available
  const solanaKey = process.env.SOLANA_PRIVATE_KEY;
  if (solanaKey) {
    try {
      providers.push(Solana());
      console.error('[Config] Solana provider registered');
    } catch (e) {
      console.error('[Config] Solana provider registration failed:', e);
    }
  }

  createConfig({
    integrator: 'ethglobal-playground',
    providers,
  });

  _initialized = true;
  console.error(`[Config] SDK initialized for address: ${account.address}`);

  return { address: account.address as Address };
}

export function getWalletClient(chainId: ChainId): WalletClient {
  let client = _walletClients[chainId];
  if (!client) {
    // Dynamically create client for known chains
    const chain = chainById.get(chainId);
    if (chain) {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      ensureClientsForChain(chainId, account);
      client = _walletClients[chainId];
    }
  }
  if (!client) throw new Error(`No wallet client for chain ${chainId}. Supported chains: ${[...chainById.keys()].join(', ')}`);
  return client;
}

export function getPublicClient(chainId: ChainId): PublicClient {
  let client = _publicClients[chainId];
  if (!client) {
    const chain = chainById.get(chainId);
    if (chain) {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      ensureClientsForChain(chainId, account);
      client = _publicClients[chainId];
    }
  }
  if (!client) throw new Error(`No public client for chain ${chainId}. Supported chains: ${[...chainById.keys()].join(', ')}`);
  return client;
}

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
} as const;

export const TOKEN_ADDRESSES = {
  ETHEREUM: {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
    stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as Address,
    wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address,
    USDe: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3' as Address,
    sUSDe: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497' as Address,
    eETH: '0x35fA164735182de50811E8e2E824cFb9B6118ac2' as Address,
    weETH: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee' as Address,
  },
  OPTIMISM: {
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address,
  },
  BSC: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address,
  },
  GNOSIS: {
    WETH: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1' as Address,
    USDC: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83' as Address,
  },
  POLYGON: {
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' as Address,
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address,
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' as Address,
  },
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
  AVALANCHE: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as Address,
  },
  LINEA: {
    WETH: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f' as Address,
  },
  SCROLL: {
    WETH: '0x5300000000000000000000000000000000000004' as Address,
    USDC: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4' as Address,
  },
  UNICHAIN: {
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6' as Address,
    USDT: '0x9151434b16b9763660705744891fA906F660EcC5' as Address,
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
