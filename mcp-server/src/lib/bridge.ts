/**
 * Non-EVM → EVM Bridge via LI.FI
 *
 * Handles bridging from Solana, SUI, and Bitcoin to EVM chains.
 * Uses getQuote() (not Composer) for non-EVM source chains.
 */

import { getQuote, getStatus } from '@lifi/sdk';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { HexData, ChainId } from './types.js';

// Known non-EVM chain IDs in LI.FI
// Verified via https://li.quest/v1/chains?chainTypes=SVM,MVM
export const NON_EVM_CHAINS = {
  SOLANA: 1151111081099710,
  SUI: 9270000000000000,
} as const;

// Well-known SUI token addresses on LI.FI
export const SUI_TOKENS = {
  SUI: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
  USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
} as const;

export interface BridgeQuoteParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
}

export interface BridgeResult {
  status: 'DONE' | 'PENDING' | 'FAILED';
  sourceTxHash?: string;
  destinationTxHash?: string;
  bridge?: string;
  message: string;
}

export async function getBridgeQuote(params: BridgeQuoteParams) {
  const quote = await getQuote({
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
  });

  return {
    id: quote.id,
    tool: quote.tool,
    fromToken: quote.action.fromToken,
    toToken: quote.action.toToken,
    estimatedOutput: quote.estimate.toAmount,
    minimumOutput: quote.estimate.toAmountMin,
    executionDuration: quote.estimate.executionDuration,
    gasCosts: quote.estimate.gasCosts,
    transactionRequest: quote.transactionRequest,
  };
}

export async function waitForBridgeCompletion(
  txHash: string,
  bridge: string,
  fromChain: number,
  toChain: number,
  timeoutMs: number = 600000
): Promise<BridgeResult> {
  const pollInterval = 10000;
  const startTime = Date.now();

  console.error('[Bridge] Waiting for completion...');
  console.error('[Bridge] TX:', txHash);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await getStatus({ txHash, bridge, fromChain, toChain });
      console.error('[Bridge]', status.status, status.substatus || '');

      if (status.status === 'DONE') {
        return {
          status: 'DONE',
          sourceTxHash: txHash,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          destinationTxHash: (status.receiving as any)?.txHash,
          bridge,
          message: 'Bridge completed successfully',
        };
      }
      if (status.status === 'FAILED') {
        return {
          status: 'FAILED',
          sourceTxHash: txHash,
          bridge,
          message: `Bridge failed: ${status.substatusMessage || 'Unknown error'}`,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('[Bridge] Status check error, retrying...');
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  return {
    status: 'PENDING',
    sourceTxHash: txHash,
    bridge,
    message: 'Bridge timeout - still pending',
  };
}

// =============================================================================
// SUI Bridge Execution
// =============================================================================

const SUI_MAINNET_RPC = 'https://fullnode.mainnet.sui.io:443';

export function getSuiKeypair(): Ed25519Keypair {
  const privateKey = process.env.SUI_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SUI_PRIVATE_KEY env var is required for SUI bridge execution');
  }
  // Support both raw hex and Bech32 (suiprivkey1...) formats
  if (privateKey.startsWith('suiprivkey')) {
    return Ed25519Keypair.fromSecretKey(privateKey);
  }
  // Raw hex (strip 0x prefix if present)
  const hex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  const bytes = Uint8Array.from(Buffer.from(hex, 'hex'));
  return Ed25519Keypair.fromSecretKey(bytes);
}

export function getSuiAddress(): string {
  return getSuiKeypair().toSuiAddress();
}

export interface ExecuteSuiBridgeParams {
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAddress: string; // EVM destination address
}

export interface SuiBridgeResult {
  txHash: string;
  bridge: string;
  quoteData: {
    estimatedOutput: string;
    minimumOutput: string;
    executionDuration: number;
  };
}

export async function executeSuiBridge(params: ExecuteSuiBridgeParams): Promise<SuiBridgeResult> {
  const keypair = getSuiKeypair();
  const suiAddress = keypair.toSuiAddress();
  const client = new SuiClient({ url: SUI_MAINNET_RPC });

  console.error('[SUI Bridge] From address:', suiAddress);
  console.error('[SUI Bridge] Getting quote...');

  // Get bridge quote using SUI address as fromAddress
  const quote = await getBridgeQuote({
    fromChain: NON_EVM_CHAINS.SUI,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: suiAddress,
  });

  console.error('[SUI Bridge] Quote received, tool:', quote.tool);
  console.error('[SUI Bridge] Estimated output:', quote.estimatedOutput);

  if (!quote.transactionRequest) {
    throw new Error('No transactionRequest in bridge quote — the bridge may not support SUI execution');
  }

  // The LI.FI transactionRequest for SUI contains a base64-encoded transaction
  const txRequest = quote.transactionRequest as { data?: string };
  if (!txRequest.data) {
    throw new Error('Bridge quote transactionRequest missing data field');
  }

  console.error('[SUI Bridge] Deserializing transaction...');

  // Deserialize the transaction from base64
  const txBytes = Uint8Array.from(Buffer.from(txRequest.data, 'base64'));
  const tx = Transaction.from(txBytes);

  console.error('[SUI Bridge] Signing and executing transaction...');

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
  });

  console.error('[SUI Bridge] TX submitted:', result.digest);

  // Wait for confirmation
  await client.waitForTransaction({ digest: result.digest });
  console.error('[SUI Bridge] TX confirmed');

  return {
    txHash: result.digest,
    bridge: quote.tool,
    quoteData: {
      estimatedOutput: quote.estimatedOutput,
      minimumOutput: quote.minimumOutput,
      executionDuration: quote.executionDuration,
    },
  };
}
