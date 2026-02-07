/**
 * LI.FI Composer Execution Functions (MCP Server)
 *
 * CRITICAL: Send quote.transactionRequest directly via walletClient.sendTransaction()
 * Do NOT use convertQuoteToRoute/executeRoute for contract call quotes.
 */

import { getStatus } from '@lifi/sdk';
import { encodeFunctionData, parseAbi, maxUint256 } from 'viem';
import { getWalletClient, getPublicClient } from './config.js';
import type {
  ExecutionResult,
  ExecutionStatus,
  StatusResponse,
  HexData,
  ChainId,
} from './types.js';
import type { ComposerQuoteResponse } from './quote.js';

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

export async function executeComposerRoute(
  quote: ComposerQuoteResponse
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const chainId = quote.action.fromChainId;

  try {
    console.error('[Execute] Chain:', chainId);
    console.error('[Execute] To:', quote.transactionRequest.to);
    console.error('[Execute] Value:', quote.transactionRequest.value);

    const walletClient = getWalletClient(chainId);
    const publicClient = getPublicClient(chainId);

    // Handle ERC20 approval if needed
    if (quote.estimate?.approvalAddress) {
      const approvalAddress = quote.estimate.approvalAddress;
      const fromToken = quote.action.fromToken.address;
      const ZERO = '0x0000000000000000000000000000000000000000';

      if (fromToken !== ZERO) {
        console.error('[Execute] Approval required for', fromToken, '→', approvalAddress);

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

        console.error('[Execute] Approval TX:', approveTxHash);
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
        console.error('[Execute] Approval confirmed:', approveReceipt.status);

        if (approveReceipt.status !== 'success') {
          throw new Error('Token approval failed');
        }
      }
    }

    // Send the transaction directly from the quote's transactionRequest
    console.error('[Execute] Sending main transaction...');
    const txHash = await walletClient.sendTransaction({
      account: walletClient.account!,
      chain: walletClient.chain!,
      to: quote.transactionRequest.to,
      data: quote.transactionRequest.data,
      value: BigInt(quote.transactionRequest.value),
      gas: quote.transactionRequest.gasLimit ? BigInt(quote.transactionRequest.gasLimit) : undefined,
    });

    console.error('[Execute] TX submitted:', txHash);

    // Wait for confirmation
    console.error('[Execute] Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const status = receipt.status === 'success' ? 'success' : 'reverted';
    console.error('[Execute] TX confirmed:', status);
    console.error('[Execute] Gas used:', receipt.gasUsed.toString());

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

    if (!isSameChain && txDone) {
      result.status = 'PENDING';
    }

    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[Execute] Error:', err.message);

    throw new ExecutionError(
      `Execution failed: ${err.message}`,
      'EXECUTION_ERROR',
      undefined,
      undefined,
      { originalError: err.message }
    );
  }
}

export async function waitForCompletion(
  txHash: HexData,
  bridge: string,
  fromChain: ChainId,
  toChain: ChainId,
  timeoutMs: number = 600000
): Promise<StatusResponse> {
  const pollInterval = 10000;
  const startTime = Date.now();

  console.error('[Status] Waiting for completion...');
  console.error('[Status] TX:', txHash);
  console.error('[Status] Bridge:', bridge);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await getStatus({ txHash, bridge, fromChain, toChain });
      console.error('[Status]', status.status, status.substatus || '');

      if (status.status === 'DONE') {
        console.error('[Status] Completed successfully');
        return status as StatusResponse;
      }
      if (status.status === 'FAILED') {
        throw new ExecutionError(
          `Transaction failed: ${status.substatusMessage || 'Unknown'}`,
          'TRANSACTION_FAILED',
          undefined,
          txHash
        );
      }
      await sleep(pollInterval);
    } catch (error) {
      if (error instanceof ExecutionError) throw error;
      console.error('[Status] Not yet indexed, waiting...');
      await sleep(pollInterval);
    }
  }

  throw new ExecutionError('Transaction timeout', 'TIMEOUT', undefined, txHash);
}

export async function getTransactionStatus(
  txHash: HexData,
  bridge: string,
  fromChain: ChainId,
  toChain: ChainId
): Promise<StatusResponse> {
  const status = await getStatus({ txHash, bridge, fromChain, toChain });
  return status as StatusResponse;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildExplorerUrl(chainId: ChainId, txHash: HexData): string {
  const explorers: Record<ChainId, string> = {
    1: 'https://etherscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    56: 'https://bscscan.com/tx/',
    100: 'https://gnosisscan.io/tx/',
    130: 'https://uniscan.xyz/tx/',
    137: 'https://polygonscan.com/tx/',
    8453: 'https://basescan.org/tx/',
    42161: 'https://arbiscan.io/tx/',
    43114: 'https://snowtrace.io/tx/',
    59144: 'https://lineascan.build/tx/',
    534352: 'https://scrollscan.com/tx/',
  };
  const baseUrl = explorers[chainId] || 'https://blockscan.com/tx/';
  return `${baseUrl}${txHash}`;
}
