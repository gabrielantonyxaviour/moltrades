/**
 * LI.FI Composer Execution Functions
 *
 * Executes Composer quotes by sending transactionRequest directly.
 * Contract call quotes should NOT use convertQuoteToRoute/executeRoute.
 * Instead, send the transactionRequest from the quote directly to the chain.
 */

import { getStatus } from '@lifi/sdk';
import { encodeFunctionData, parseAbi, maxUint256 } from 'viem';
import { getWalletClient, getPublicClient } from './config';
import type {
  ExecutionResult,
  ExecutionStatus,
  StatusResponse,
  StatusRequest,
  HexData,
  ChainId,
} from './types';
import type { ComposerQuoteResponse } from './quote';

// =============================================================================
// CALLBACK TYPES
// =============================================================================

export interface ExecutionCallbacks {
  onTxSubmitted?: (txHash: string) => void;
  onTxConfirmed?: (txHash: string, receipt: { gasUsed: bigint; status: string }) => void;
  onBridgeProgress?: (status: string, progress: number) => void;
  onError?: (error: Error) => void;
}

export interface WaitOptions {
  pollInterval?: number;
  timeout?: number;
  onStatusUpdate?: (status: StatusResponse) => void;
}

// =============================================================================
// ERRORS
// =============================================================================

export class ExecutionError extends Error {
  constructor(
    message: string,
    public code: string,
    public step?: string,
    public txHash?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}

// =============================================================================
// MAIN EXECUTION FUNCTION
// =============================================================================

export async function executeComposerRoute(
  quote: ComposerQuoteResponse,
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const chainId = quote.action.fromChainId;

  try {
    console.log('[Execute] Chain:', chainId);
    console.log('[Execute] To:', quote.transactionRequest.to);
    console.log('[Execute] Value:', quote.transactionRequest.value);

    const walletClient = getWalletClient(chainId);
    const publicClient = getPublicClient(chainId);

    // Handle ERC20 approval if needed
    if (quote.estimate?.approvalAddress) {
      const approvalAddress = quote.estimate.approvalAddress;
      const fromToken = quote.action.fromToken.address;
      const ZERO = '0x0000000000000000000000000000000000000000';

      if (fromToken !== ZERO) {
        console.log('[Execute] Approval required for', fromToken, '→', approvalAddress);

        const erc20Abi = parseAbi(['function approve(address spender, uint256 amount) returns (bool)']);
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [approvalAddress as `0x${string}`, maxUint256],
        });

        const approveTxHash = await walletClient.sendTransaction({
          account: walletClient.account!,
          chain: walletClient.chain!,
          to: fromToken as `0x${string}`,
          data: approveData,
        });

        console.log('[Execute] Approval TX:', approveTxHash);
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
        console.log('[Execute] Approval confirmed:', approveReceipt.status);

        if (approveReceipt.status !== 'success') {
          throw new Error('Token approval failed');
        }
      }
    }

    // Send the transaction directly from the quote's transactionRequest
    console.log('[Execute] Sending main transaction...');
    const txHash = await walletClient.sendTransaction({
      account: walletClient.account!,
      chain: walletClient.chain!,
      to: quote.transactionRequest.to,
      data: quote.transactionRequest.data,
      value: BigInt(quote.transactionRequest.value),
      gas: quote.transactionRequest.gasLimit ? BigInt(quote.transactionRequest.gasLimit) : undefined,
    });

    console.log('[Execute] TX submitted:', txHash);
    callbacks?.onTxSubmitted?.(txHash);

    // Wait for confirmation
    console.log('[Execute] Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const status = receipt.status === 'success' ? 'success' : 'reverted';
    console.log('[Execute] TX confirmed:', status);
    console.log('[Execute] Gas used:', receipt.gasUsed.toString());

    callbacks?.onTxConfirmed?.(txHash, {
      gasUsed: receipt.gasUsed,
      status,
    });

    const isSameChain = quote.action.fromChainId === quote.action.toChainId;
    const txDone = receipt.status === 'success';

    const result: ExecutionResult = {
      status: txDone ? 'DONE' : 'FAILED',
      sourceTxHash: txHash as HexData,
      contractCallSucceeded: txDone,
      fallbackTriggered: false,
      explorerLinks: {
        source: buildExplorerUrl(chainId, txHash as HexData),
      },
      duration: Math.floor((Date.now() - startTime) / 1000),
    };

    // For cross-chain, the source tx is just the bridge initiation
    // We'd need to poll getStatus for the destination result
    if (!isSameChain && txDone) {
      result.status = 'PENDING';
    }

    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[Execute] Error:', err.message);
    callbacks?.onError?.(err);

    throw new ExecutionError(
      `Execution failed: ${err.message}`,
      'EXECUTION_ERROR',
      undefined,
      undefined,
      { originalError: err }
    );
  }
}

// =============================================================================
// STATUS TRACKING (for cross-chain)
// =============================================================================

export async function waitForCompletion(
  txHash: HexData,
  bridge: string,
  fromChain: ChainId,
  toChain: ChainId,
  options?: WaitOptions
): Promise<StatusResponse> {
  const pollInterval = options?.pollInterval || 10000;
  const timeout = options?.timeout || 1800000;
  const startTime = Date.now();

  console.log('[Status] Waiting for completion...');
  console.log('[Status] TX:', txHash);
  console.log('[Status] Bridge:', bridge);

  while (Date.now() - startTime < timeout) {
    try {
      const status = await getStatus({ txHash, bridge, fromChain, toChain });
      console.log('[Status]', status.status, status.substatus || '');
      options?.onStatusUpdate?.(status as StatusResponse);

      if (status.status === 'DONE') {
        console.log('[Status] Completed successfully');
        return status as StatusResponse;
      }
      if (status.status === 'FAILED') {
        throw new ExecutionError(
          `Transaction failed: ${status.substatusMessage || 'Unknown'}`,
          'TRANSACTION_FAILED',
          undefined,
          txHash,
          { status }
        );
      }
      await sleep(pollInterval);
    } catch (error) {
      const err = error as Error & { response?: { data?: { code?: string } } };
      if (err instanceof ExecutionError) throw error;
      // NOT_FOUND is normal during initial indexing
      console.log('[Status] Not yet indexed, waiting...');
      await sleep(pollInterval);
    }
  }

  throw new ExecutionError('Transaction timeout', 'TIMEOUT', undefined, txHash);
}

export async function getTransactionStatus(request: StatusRequest): Promise<StatusResponse> {
  const status = await getStatus({
    txHash: request.txHash,
    bridge: request.bridge,
    fromChain: request.fromChain,
    toChain: request.toChain,
  });
  return status as StatusResponse;
}

// =============================================================================
// CONVENIENCE: Execute + wait for cross-chain completion
// =============================================================================

export async function executeAndWait(
  quote: ComposerQuoteResponse,
  callbacks?: ExecutionCallbacks,
  waitOptions?: WaitOptions
): Promise<ExecutionResult> {
  const result = await executeComposerRoute(quote, callbacks);

  // Same-chain: already done after tx confirmation
  if (result.status === 'DONE' || result.status === 'FAILED') {
    return result;
  }

  // Cross-chain: poll for bridge completion
  console.log('[Execute] Cross-chain - polling for bridge completion...');
  const finalStatus = await waitForCompletion(
    result.sourceTxHash,
    quote.tool,
    quote.action.fromChainId,
    quote.action.toChainId,
    {
      ...waitOptions,
      onStatusUpdate: (status) => {
        waitOptions?.onStatusUpdate?.(status);
        if (status.status === 'PENDING') {
          callbacks?.onBridgeProgress?.('PENDING', 50);
        }
      },
    }
  );

  return {
    ...result,
    status: finalStatus.status,
    destinationTxHash: finalStatus.receiving?.txHash,
    contractCallSucceeded: finalStatus.status === 'DONE',
    receivedTokens: finalStatus.receiving?.token
      ? {
          address: finalStatus.receiving.token.address,
          amount: finalStatus.receiving.amount || '0',
          symbol: finalStatus.receiving.token.symbol,
        }
      : undefined,
    explorerLinks: {
      ...result.explorerLinks,
      destination: finalStatus.receiving?.txHash
        ? buildExplorerUrl(quote.action.toChainId, finalStatus.receiving.txHash)
        : undefined,
      lifi: finalStatus.lifiExplorerLink,
    },
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildExplorerUrl(chainId: ChainId, txHash: HexData): string {
  const explorers: Record<ChainId, string> = {
    1: 'https://etherscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    56: 'https://bscscan.com/tx/',
    43114: 'https://snowtrace.io/tx/',
    100: 'https://gnosisscan.io/tx/',
  };
  const baseUrl = explorers[chainId] || 'https://blockscan.com/tx/';
  return `${baseUrl}${txHash}`;
}

export function isExecutionInProgress(status: ExecutionStatus): boolean {
  return status === 'PENDING' || status === 'NOT_FOUND';
}

export function isExecutionComplete(status: ExecutionStatus): boolean {
  return status === 'DONE' || status === 'FAILED';
}
