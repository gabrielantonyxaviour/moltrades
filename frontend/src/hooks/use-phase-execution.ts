"use client";

import { useState, useCallback } from "react";
import type { WalletClient, PublicClient } from "viem";
import type {
  PhaseIntent,
  ComposerQuote,
  PhaseResult,
  Address,
} from "@/lib/lifi/types";
import { getQuoteFromIntent } from "@/lib/lifi/quotes";
import { executeComposerQuote, waitForBridgeCompletion } from "@/lib/lifi/execution";
import type { PhaseStatus, OverallStatus } from "@/components/core-engine/execute-button";

// =============================================================================
// STATE TYPES
// =============================================================================

export interface PhaseExecutionState {
  totalPhases: number;
  currentPhase: number;
  phaseStatus: PhaseStatus;
  overallStatus: OverallStatus;
  phaseTxHash?: string;
  phaseResults: PhaseResult[];
  error?: string;
}

const initialState: PhaseExecutionState = {
  totalPhases: 0,
  currentPhase: 1,
  phaseStatus: "idle",
  overallStatus: "idle",
  phaseResults: [],
};

// =============================================================================
// HOOK
// =============================================================================

export function usePhaseExecution(
  phases: PhaseIntent[],
  walletClient: WalletClient | null,
  publicClient: PublicClient | null,
  fromAddress: Address | null,
  onNodeStatusUpdate?: (phaseNum: number, status: string) => void
) {
  const [state, setState] = useState<PhaseExecutionState>({
    ...initialState,
    totalPhases: phases.length,
  });

  // Keep totalPhases in sync with phases prop
  if (phases.length !== state.totalPhases && state.overallStatus === "idle") {
    setState((s) => ({ ...s, totalPhases: phases.length, currentPhase: 1 }));
  }

  const executeCurrentPhase = useCallback(async () => {
    if (!walletClient || !publicClient || !fromAddress) {
      setState((s) => ({
        ...s,
        phaseStatus: "error",
        error: "Wallet not connected",
      }));
      return;
    }

    const phaseIndex = state.currentPhase - 1;
    const currentIntent = phases[phaseIndex];

    if (!currentIntent) {
      setState((s) => ({
        ...s,
        phaseStatus: "error",
        error: "No phase to execute",
      }));
      return;
    }

    // Check if this is a SUI phase (non-EVM)
    if (currentIntent.fromChain?.toUpperCase() === "SUI") {
      setState((s) => ({
        ...s,
        phaseStatus: "error",
        error:
          "SUI bridge phase requires a SUI wallet. Execute via the AI agent or connect a SUI wallet.",
      }));
      return;
    }

    try {
      // Step 1: Get quote
      setState((s) => ({
        ...s,
        phaseStatus: "quoting",
        overallStatus: "in_progress",
        error: undefined,
      }));
      onNodeStatusUpdate?.(state.currentPhase, "executing");

      const quote = await getQuoteFromIntent(currentIntent, fromAddress);

      if (!quote) {
        throw new Error("Could not get a quote for this phase");
      }

      // Step 2: Execute transaction
      setState((s) => ({ ...s, phaseStatus: "executing" }));

      const result = await executeComposerQuote(
        quote,
        walletClient,
        publicClient,
        {
          onTxSubmitted: (txHash) => {
            setState((s) => ({ ...s, phaseTxHash: txHash }));
          },
        }
      );

      // Step 3: If cross-chain, wait for bridge completion
      const isCrossChain =
        quote.action.fromChainId !== quote.action.toChainId;

      if (isCrossChain && result.status === "PENDING") {
        setState((s) => ({ ...s, phaseStatus: "bridging" }));

        await waitForBridgeCompletion(
          result.sourceTxHash,
          quote.tool,
          quote.action.fromChainId,
          quote.action.toChainId,
          {
            onStatusUpdate: () => {
              // Could update progress here
            },
          }
        );
      }

      // Step 4: Phase complete
      const phaseResult: PhaseResult = {
        phase: state.currentPhase,
        txHash: result.sourceTxHash,
        status: "complete",
      };

      onNodeStatusUpdate?.(state.currentPhase, "complete");

      const isLastPhase = state.currentPhase >= phases.length;

      setState((s) => ({
        ...s,
        phaseStatus: isLastPhase ? "complete" : "idle",
        overallStatus: isLastPhase ? "complete" : "in_progress",
        currentPhase: isLastPhase ? s.currentPhase : s.currentPhase + 1,
        phaseResults: [...s.phaseResults, phaseResult],
        phaseTxHash: undefined,
      }));
    } catch (err) {
      const error = err as Error;
      console.error("[PhaseExecution] Error:", error.message);

      onNodeStatusUpdate?.(state.currentPhase, "error");

      setState((s) => ({
        ...s,
        phaseStatus: "error",
        error: error.message,
      }));
    }
  }, [
    walletClient,
    publicClient,
    fromAddress,
    phases,
    state.currentPhase,
    onNodeStatusUpdate,
  ]);

  const reset = useCallback(() => {
    setState({
      ...initialState,
      totalPhases: phases.length,
    });
  }, [phases.length]);

  return {
    ...state,
    executeCurrentPhase,
    reset,
  };
}
