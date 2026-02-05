/**
 * LI.FI SDK Configuration for Node.js Script Environment
 *
 * Initializes the SDK with EVM provider using a private key wallet.
 * Exposes wallet client for direct transaction submission (needed for Composer quotes).
 */

import { createConfig, EVM } from '@lifi/sdk';
import {
  createWalletClient,
  createPublicClient,
  http,
  type WalletClient,
  type PublicClient,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, arbitrum } from 'viem/chains';
import type { Address, ChainId } from './types';

const chains: readonly [Chain, Chain] = [base, arbitrum];

let _walletClients: Record<number, WalletClient> = {};
let _publicClients: Record<number, PublicClient> = {};

export function initializeLifiSDK(): { address: Address } {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === '0x') {
    throw new Error('PRIVATE_KEY not set in .env file');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  // Pre-create wallet and public clients for each chain
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

  console.log(`[Config] SDK initialized for address: ${account.address}`);
  console.log(`[Config] Supported chains: Base (8453), Arbitrum (42161)`);

  return { address: account.address as Address };
}

export function getWalletClient(chainId: ChainId): WalletClient {
  const client = _walletClients[chainId];
  if (!client) throw new Error(`No wallet client for chain ${chainId}`);
  return client;
}

export function getPublicClient(chainId: ChainId): PublicClient {
  const client = _publicClients[chainId];
  if (!client) throw new Error(`No public client for chain ${chainId}`);
  return client;
}

export const CHAIN_IDS = {
  BASE: 8453,
  ARBITRUM: 42161,
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
} as const;
// Integrator: ethglobal-playground (whitelisted)
