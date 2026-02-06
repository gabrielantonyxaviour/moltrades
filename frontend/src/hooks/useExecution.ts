"use client";

/**
 * useExecution Hook
 *
 * React hook for executing LI.FI Composer quotes with wagmi.
 */

import { useState, useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import type { Node } from "@xyflow/react";
import type {
  ComposerQuote,
  ExecutionState,
  ExecutionLog,
  ExecutionResult,
  NodeStatus,
} from "@/lib/lifi/types";
import { executeAndWait, executeComposerQuote } from "@/lib/lifi/execution";
import { updateNodeStatus, getExecutableNodeIds } from "@/lib/lifi/flow-generator";

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface UseExecutionReturn {
  executionState: ExecutionState;
  execute: (quote: ComposerQuote, nodes: Node[]) => Promise<ExecutionResult | null>;
  reset: () => void;
  updateNodeStates: (nodes: Node[], nodeId: string, status: NodeStatus) => Node[];
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ExecutionState = {
  status: "idle",
  currentStepId: null,
  logs: [],
  sourceTxHash: undefined,
  destinationTxHash: undefined,
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useExecution(): UseExecutionReturn {
  const [executionState, setExecutionState] = useState<ExecutionState>(initialState);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Add log entry
  const addLog = useCallback((message: string, type: ExecutionLog["type"] = "info") => {
    setExecutionState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          timestamp: new Date(),
          message,
          type,
        },
      ],
    }));
  }, []);

  // Set current step
  const setCurrentStep = useCallback((stepId: string | null) => {
    setExecutionState((prev) => ({
      ...prev,
      currentStepId: stepId,
    }));
  }, []);

  // Set status
  const setStatus = useCallback((status: ExecutionState["status"]) => {
    setExecutionState((prev) => ({
      ...prev,
      status,
    }));
  }, []);

  // Main execute function
  const execute = useCallback(
    async (quote: ComposerQuote, nodes: Node[]): Promise<ExecutionResult | null> => {
      if (!walletClient || !publicClient) {
        addLog("Wallet not connected", "error");
        return null;
      }

      // Reset and start
      setExecutionState({
        status: "executing",
        currentStepId: null,
        logs: [],
        sourceTxHash: undefined,
        destinationTxHash: undefined,
      });

      addLog("Starting execution...", "info");

      // Get executable node IDs
      const executableNodes = getExecutableNodeIds(nodes);

      try {
        // Mark first executable node as executing
        if (executableNodes.length > 0) {
          setCurrentStep(executableNodes[0]);
          addLog(`Processing step: ${executableNodes[0]}`, "info");
        }

        // Execute the quote
        const result = await executeAndWait(quote, walletClient, publicClient, {
          onTxSubmitted: (txHash) => {
            addLog(`Transaction submitted: ${txHash.slice(0, 10)}...`, "info");
            setExecutionState((prev) => ({
              ...prev,
              sourceTxHash: txHash,
            }));
          },
          onTxConfirmed: (txHash, receipt) => {
            if (receipt.status === "success") {
              addLog(`Transaction confirmed`, "success");
            } else {
              addLog(`Transaction reverted`, "error");
            }
          },
          onBridgeProgress: (status, progress) => {
            addLog(`Bridge status: ${status} (${progress}%)`, "info");
          },
          onError: (error) => {
            addLog(`Error: ${error.message}`, "error");
          },
        });

        // Update state based on result
        if (result.status === "DONE") {
          setStatus("complete");
          addLog("Execution completed successfully!", "success");

          if (result.destinationTxHash) {
            setExecutionState((prev) => ({
              ...prev,
              destinationTxHash: result.destinationTxHash,
            }));
          }
        } else if (result.status === "FAILED") {
          setStatus("error");
          addLog("Execution failed", "error");
        }

        return result;
      } catch (error) {
        const err = error as Error;
        setStatus("error");
        addLog(`Execution failed: ${err.message}`, "error");
        return null;
      }
    },
    [walletClient, publicClient, addLog, setCurrentStep, setStatus]
  );

  // Reset execution state
  const reset = useCallback(() => {
    setExecutionState(initialState);
  }, []);

  // Helper to update node states
  const updateNodeStates = useCallback(
    (nodes: Node[], nodeId: string, status: NodeStatus): Node[] => {
      return updateNodeStatus(nodes, nodeId, status);
    },
    []
  );

  return {
    executionState,
    execute,
    reset,
    updateNodeStates,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

export function useQuoteExecution() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const executeQuote = useCallback(
    async (quote: ComposerQuote): Promise<ExecutionResult | null> => {
      if (!walletClient || !publicClient) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await executeComposerQuote(quote, walletClient, publicClient);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient]
  );

  return {
    executeQuote,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
