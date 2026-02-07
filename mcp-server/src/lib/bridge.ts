/**
 * Non-EVM → EVM Bridge via LI.FI
 *
 * Handles bridging from Solana, SUI, and Bitcoin to EVM chains.
 * Uses getQuote() (not Composer) for non-EVM source chains.
 */

import { getQuote, getStatus } from '@lifi/sdk';
import type { HexData, ChainId } from './types.js';

// Known non-EVM chain IDs in LI.FI
export const NON_EVM_CHAINS = {
  SOLANA: 1151111081099710,
  SUI: 101,  // LI.FI's SUI chain ID - may need verification
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
          destinationTxHash: status.receiving?.txHash,
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
