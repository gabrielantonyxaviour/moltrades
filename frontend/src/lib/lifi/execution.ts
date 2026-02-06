/**
 * LI.FI Composer Execution Engine
 *
 * Handles transaction execution for Composer quotes using wagmi.
 */

import { getStatus } from "@lifi/sdk";
import { encodeFunctionData, parseAbi, maxUint256 } from "viem";
import type { WalletClient, PublicClient, Hash } from "viem";
import type {
  ComposerQuote,
  ExecutionResult,
  ExecutionStatus,
  StatusResponse,
  HexData,
  ChainId,
  ExecutionCallbacks,
} from "./types";
import { buildExplorerUrl } from "./sdk";

// =============================================================================
// EXECUTION ERROR
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
    this.name = "ExecutionError";
  }
}

// =============================================================================
// MAIN EXECUTION FUNCTION
// =============================================================================

export async function executeComposerQuote(
  quote: ComposerQuote,
  walletClient: WalletClient,
  publicClient: PublicClient,
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const chainId = quote.action.fromChainId;

  try {
    // Get the account from wallet client
    const account = walletClient.account;
    if (!account) {
      throw new ExecutionError("No account connected", "NO_ACCOUNT");
    }

    console.log("[Execute] Chain:", chainId);
    console.log("[Execute] To:", quote.transactionRequest.to);
    console.log("[Execute] Value:", quote.transactionRequest.value);

    // Handle ERC20 approval if needed
    if (quote.estimate?.approvalAddress) {
      const approvalAddress = quote.estimate.approvalAddress;
      const fromToken = quote.action.fromToken.address;
      const nativeAddresses = [
        "0x0000000000000000000000000000000000000000",
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      ];

      if (!nativeAddresses.includes(fromToken.toLowerCase())) {
        console.log("[Execute] Approval required for", fromToken, "→", approvalAddress);

        const erc20Abi = parseAbi([
          "function approve(address spender, uint256 amount) returns (bool)",
        ]);
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [approvalAddress, maxUint256],
        });

        const approveTxHash = await walletClient.sendTransaction({
          account,
          chain: walletClient.chain!,
          to: fromToken,
          data: approveData,
        });

        console.log("[Execute] Approval TX:", approveTxHash);
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveTxHash,
        });
        console.log("[Execute] Approval confirmed:", approveReceipt.status);

        if (approveReceipt.status !== "success") {
          throw new ExecutionError("Token approval failed", "APPROVAL_FAILED");
        }
      }
    }

    // Send the main transaction
    console.log("[Execute] Sending main transaction...");
    const txHash = await walletClient.sendTransaction({
      account,
      chain: walletClient.chain!,
      to: quote.transactionRequest.to,
      data: quote.transactionRequest.data,
      value: BigInt(quote.transactionRequest.value),
      gas: quote.transactionRequest.gasLimit
        ? BigInt(quote.transactionRequest.gasLimit)
        : undefined,
    });

    console.log("[Execute] TX submitted:", txHash);
    callbacks?.onTxSubmitted?.(txHash);

    // Wait for confirmation
    console.log("[Execute] Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const status = receipt.status === "success" ? "success" : "reverted";
    console.log("[Execute] TX confirmed:", status);
    console.log("[Execute] Gas used:", receipt.gasUsed.toString());

    callbacks?.onTxConfirmed?.(txHash, {
      gasUsed: receipt.gasUsed,
      status,
    });

    const isSameChain = quote.action.fromChainId === quote.action.toChainId;
    const txDone = receipt.status === "success";

    const result: ExecutionResult = {
      status: txDone ? "DONE" : "FAILED",
      sourceTxHash: txHash as HexData,
      contractCallSucceeded: txDone,
      fallbackTriggered: false,
      explorerLinks: {
        source: buildExplorerUrl(chainId, txHash),
      },
      duration: Math.floor((Date.now() - startTime) / 1000),
    };

    // For cross-chain, source tx is just the bridge initiation
    if (!isSameChain && txDone) {
      result.status = "PENDING";
    }

    return result;
  } catch (error) {
    const err = error as Error;
    console.error("[Execute] Error:", err.message);
    callbacks?.onError?.(err);

    if (err instanceof ExecutionError) {
      throw err;
    }

    throw new ExecutionError(
      `Execution failed: ${err.message}`,
      "EXECUTION_ERROR",
      undefined,
      undefined,
      { originalError: err }
    );
  }
}

// =============================================================================
// STATUS TRACKING
// =============================================================================

export async function waitForBridgeCompletion(
  txHash: HexData,
  bridge: string,
  fromChain: ChainId,
  toChain: ChainId,
  options?: {
    pollInterval?: number;
    timeout?: number;
    onStatusUpdate?: (status: StatusResponse) => void;
  }
): Promise<StatusResponse> {
  const pollInterval = options?.pollInterval || 10000;
  const timeout = options?.timeout || 1800000; // 30 minutes
  const startTime = Date.now();

  console.log("[Status] Waiting for completion...");
  console.log("[Status] TX:", txHash);
  console.log("[Status] Bridge:", bridge);

  while (Date.now() - startTime < timeout) {
    try {
      const status = await getStatus({ txHash, bridge, fromChain, toChain });
      console.log("[Status]", status.status, status.substatus || "");
      options?.onStatusUpdate?.(status as StatusResponse);

      if (status.status === "DONE") {
        console.log("[Status] Completed successfully");
        return status as StatusResponse;
      }

      if (status.status === "FAILED") {
        throw new ExecutionError(
          `Transaction failed: ${status.substatusMessage || "Unknown"}`,
          "TRANSACTION_FAILED",
          undefined,
          txHash,
          { status }
        );
      }

      await sleep(pollInterval);
    } catch (error) {
      const err = error as Error;
      if (err instanceof ExecutionError) throw error;

      // NOT_FOUND is normal during initial indexing
      console.log("[Status] Not yet indexed, waiting...");
      await sleep(pollInterval);
    }
  }

  throw new ExecutionError("Transaction timeout", "TIMEOUT", undefined, txHash);
}

// =============================================================================
// FULL EXECUTION WITH WAIT
// =============================================================================

export async function executeAndWait(
  quote: ComposerQuote,
  walletClient: WalletClient,
  publicClient: PublicClient,
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  const result = await executeComposerQuote(quote, walletClient, publicClient, callbacks);

  // Same-chain: already done
  if (result.status === "DONE" || result.status === "FAILED") {
    return result;
  }

  // Cross-chain: poll for bridge completion
  console.log("[Execute] Cross-chain - polling for bridge completion...");

  const finalStatus = await waitForBridgeCompletion(
    result.sourceTxHash,
    quote.tool,
    quote.action.fromChainId,
    quote.action.toChainId,
    {
      onStatusUpdate: (status) => {
        if (status.status === "PENDING") {
          callbacks?.onBridgeProgress?.("PENDING", 50);
        }
      },
    }
  );

  return {
    ...result,
    status: finalStatus.status,
    destinationTxHash: finalStatus.receiving?.txHash,
    contractCallSucceeded: finalStatus.status === "DONE",
    receivedTokens: finalStatus.receiving?.token
      ? {
          address: finalStatus.receiving.token.address,
          amount: finalStatus.receiving.amount || "0",
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

export function isExecutionInProgress(status: ExecutionStatus): boolean {
  return status === "PENDING" || status === "NOT_FOUND";
}

export function isExecutionComplete(status: ExecutionStatus): boolean {
  return status === "DONE" || status === "FAILED";
}
