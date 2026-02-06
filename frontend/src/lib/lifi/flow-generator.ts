/**
 * Flow Generator for LI.FI Quotes
 *
 * Converts LI.FI quote responses into horizontal ReactFlow nodes and edges.
 */

import { Node, Edge } from "@xyflow/react";
import type { ComposerQuote, RouteStep, RouteInfo, ParsedIntent } from "./types";
import { getChainName } from "./sdk";
import { formatTokenAmount, formatDuration, getTotalGasCostUSD } from "./quotes";

// =============================================================================
// TYPES
// =============================================================================

export interface FlowGenerationResult {
  nodes: Node[];
  edges: Edge[];
  route: RouteInfo;
}

// =============================================================================
// MAIN FLOW GENERATOR
// =============================================================================

export function generateFlowFromQuote(quote: ComposerQuote): FlowGenerationResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let xPosition = 0;
  const yPosition = 200;
  const xGap = 300;

  // Input node
  const inputId = "input-1";
  nodes.push({
    id: inputId,
    type: "tokenInput",
    position: { x: xPosition, y: yPosition },
    data: {
      label: "Starting Balance",
      token: quote.action.fromToken.symbol,
      amount: formatTokenAmount(quote.action.fromAmount, quote.action.fromToken.decimals),
      usdValue: quote.action.fromToken.priceUSD
        ? formatUsdValue(quote.action.fromAmount, quote.action.fromToken.decimals, quote.action.fromToken.priceUSD)
        : undefined,
      chain: getChainName(quote.action.fromChainId),
      status: "idle",
    },
  });

  let previousNodeId = inputId;
  xPosition += xGap;

  // Process included steps
  const steps = quote.includedSteps || [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const nodeId = `step-${i + 1}`;

    const nodeData = generateNodeFromStep(step, nodeId, xPosition, yPosition);
    if (nodeData) {
      nodes.push(nodeData.node);

      // Create edge from previous node
      edges.push({
        id: `e-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        animated: true,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      });

      previousNodeId = nodeId;
      xPosition += xGap;
    }
  }

  // If no steps but it's a cross-chain operation, add a bridge node
  if (steps.length === 0 && quote.action.fromChainId !== quote.action.toChainId) {
    const bridgeId = "bridge-1";
    nodes.push({
      id: bridgeId,
      type: "bridge",
      position: { x: xPosition, y: yPosition },
      data: {
        label: `Bridge to ${getChainName(quote.action.toChainId)}`,
        fromChain: getChainName(quote.action.fromChainId),
        toChain: getChainName(quote.action.toChainId),
        provider: quote.toolDetails?.name || "LI.FI",
        estimatedTime: formatDuration(quote.estimate?.executionDuration || 0),
        fee: `~$${getTotalGasCostUSD(quote)}`,
        status: "idle",
      },
    });

    edges.push({
      id: `e-${previousNodeId}-${bridgeId}`,
      source: previousNodeId,
      target: bridgeId,
      animated: true,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
    });

    previousNodeId = bridgeId;
    xPosition += xGap;
  }

  // Check for contract calls (deposit operations)
  if (quote.contractCalls && quote.contractCalls.length > 0) {
    const depositId = "deposit-1";
    nodes.push({
      id: depositId,
      type: "deposit",
      position: { x: xPosition, y: yPosition },
      data: {
        label: "Deposit",
        protocol: extractProtocolName(quote),
        token: quote.action.toToken.symbol,
        amount: formatTokenAmount(quote.estimate?.toAmount || "0", quote.action.toToken.decimals),
        receiveToken: extractOutputToken(quote),
        status: "idle",
      },
    });

    edges.push({
      id: `e-${previousNodeId}-${depositId}`,
      source: previousNodeId,
      target: depositId,
      animated: true,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
    });

    previousNodeId = depositId;
    xPosition += xGap;
  }

  // Output node
  const outputId = "output-1";
  nodes.push({
    id: outputId,
    type: "output",
    position: { x: xPosition, y: yPosition },
    data: {
      label: "Final Balance",
      token: extractFinalToken(quote),
      amount: formatTokenAmount(quote.estimate?.toAmount || "0", quote.action.toToken.decimals),
      usdValue: quote.action.toToken.priceUSD
        ? formatUsdValue(quote.estimate?.toAmount || "0", quote.action.toToken.decimals, quote.action.toToken.priceUSD)
        : undefined,
      chain: getChainName(quote.action.toChainId),
      status: "idle",
    },
  });

  edges.push({
    id: `e-${previousNodeId}-${outputId}`,
    source: previousNodeId,
    target: outputId,
    animated: true,
    style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
  });

  // Calculate route info
  const route: RouteInfo = {
    totalSteps: nodes.length - 2, // Exclude input and output
    estimatedTime: formatDuration(quote.estimate?.executionDuration || 0),
    estimatedGas: `~$${getTotalGasCostUSD(quote)}`,
    estimatedOutput: `${formatTokenAmount(quote.estimate?.toAmount || "0", quote.action.toToken.decimals)} ${extractFinalToken(quote)}`,
  };

  return { nodes, edges, route };
}

// =============================================================================
// STEP TO NODE CONVERSION
// =============================================================================

function generateNodeFromStep(
  step: RouteStep,
  nodeId: string,
  xPosition: number,
  yPosition: number
): { node: Node } | null {
  const stepType = step.type;

  switch (stepType) {
    case "bridge":
    case "cross":
      return {
        node: {
          id: nodeId,
          type: "bridge",
          position: { x: xPosition, y: yPosition },
          data: {
            label: `Bridge to ${getChainName(step.action.toChainId)}`,
            fromChain: getChainName(step.action.fromChainId),
            toChain: getChainName(step.action.toChainId),
            provider: step.toolDetails?.name || step.tool || "LI.FI",
            estimatedTime: formatDuration(step.estimate?.executionDuration || 0),
            fee: step.estimate?.feeCosts?.[0]
              ? `~$${step.estimate.feeCosts[0].amountUSD}`
              : undefined,
            status: "idle",
          },
        },
      };

    case "swap":
      return {
        node: {
          id: nodeId,
          type: "swap",
          position: { x: xPosition, y: yPosition },
          data: {
            label: `${step.action.fromToken.symbol} → ${step.action.toToken.symbol}`,
            fromToken: step.action.fromToken.symbol,
            toToken: step.action.toToken.symbol,
            fromAmount: formatTokenAmount(step.action.fromAmount, step.action.fromToken.decimals),
            toAmount: formatTokenAmount(step.estimate?.toAmount || "0", step.action.toToken.decimals),
            dex: step.toolDetails?.name || step.tool || "DEX",
            rate: calculateRate(step),
            priceImpact: "< 0.1%",
            status: "idle",
          },
        },
      };

    case "protocol":
    case "custom":
      return {
        node: {
          id: nodeId,
          type: "deposit",
          position: { x: xPosition, y: yPosition },
          data: {
            label: step.toolDetails?.name || "Protocol",
            protocol: step.toolDetails?.name || step.tool || "Protocol",
            token: step.action.fromToken.symbol,
            amount: formatTokenAmount(step.action.fromAmount, step.action.fromToken.decimals),
            receiveToken: step.action.toToken.symbol,
            status: "idle",
          },
        },
      };

    default:
      return null;
  }
}

// =============================================================================
// INTENT-BASED FLOW (Fallback when no quote yet)
// =============================================================================

export function generateFlowFromIntent(intent: ParsedIntent): FlowGenerationResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let xPosition = 0;
  const yPosition = 200;
  const xGap = 300;

  // Input node
  const inputId = "input-1";
  nodes.push({
    id: inputId,
    type: "tokenInput",
    position: { x: xPosition, y: yPosition },
    data: {
      label: "Starting Balance",
      token: intent.fromToken || "ETH",
      amount: intent.amount || "0",
      chain: intent.fromChain || "Ethereum",
      status: "pending",
    },
  });

  let previousNodeId = inputId;
  xPosition += xGap;

  // Add appropriate intermediate nodes based on intent
  switch (intent.action) {
    case "bridge": {
      const bridgeId = "bridge-1";
      nodes.push({
        id: bridgeId,
        type: "bridge",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Bridge to ${intent.toChain || "Base"}`,
          fromChain: intent.fromChain || "Ethereum",
          toChain: intent.toChain || "Base",
          provider: "LI.FI",
          estimatedTime: "~3 min",
          status: "pending",
        },
      });
      edges.push({
        id: `e-${previousNodeId}-${bridgeId}`,
        source: previousNodeId,
        target: bridgeId,
        animated: true,
      });
      previousNodeId = bridgeId;
      xPosition += xGap;
      break;
    }

    case "swap": {
      const swapId = "swap-1";
      nodes.push({
        id: swapId,
        type: "swap",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `${intent.fromToken || "ETH"} → ${intent.toToken || "USDC"}`,
          fromToken: intent.fromToken || "ETH",
          toToken: intent.toToken || "USDC",
          fromAmount: intent.amount || "0",
          dex: "Uniswap",
          status: "pending",
        },
      });
      edges.push({
        id: `e-${previousNodeId}-${swapId}`,
        source: previousNodeId,
        target: swapId,
        animated: true,
      });
      previousNodeId = swapId;
      xPosition += xGap;
      break;
    }

    case "deposit": {
      const depositId = "deposit-1";
      nodes.push({
        id: depositId,
        type: "deposit",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Deposit to ${intent.protocol || "Aave"}`,
          protocol: intent.protocol || "Aave",
          token: intent.fromToken || "ETH",
          amount: intent.amount || "0",
          status: "pending",
        },
      });
      edges.push({
        id: `e-${previousNodeId}-${depositId}`,
        source: previousNodeId,
        target: depositId,
        animated: true,
      });
      previousNodeId = depositId;
      xPosition += xGap;
      break;
    }

    case "complex": {
      // Bridge
      const bridgeId = "bridge-1";
      nodes.push({
        id: bridgeId,
        type: "bridge",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Bridge to ${intent.toChain || "Base"}`,
          fromChain: intent.fromChain || "Ethereum",
          toChain: intent.toChain || "Base",
          provider: "LI.FI",
          status: "pending",
        },
      });
      edges.push({
        id: `e-${previousNodeId}-${bridgeId}`,
        source: previousNodeId,
        target: bridgeId,
        animated: true,
      });
      previousNodeId = bridgeId;
      xPosition += xGap;

      // Deposit
      const depositId = "deposit-1";
      nodes.push({
        id: depositId,
        type: "deposit",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Deposit to ${intent.protocol || "Aave"}`,
          protocol: intent.protocol || "Aave",
          token: intent.fromToken || "ETH",
          status: "pending",
        },
      });
      edges.push({
        id: `e-${previousNodeId}-${depositId}`,
        source: previousNodeId,
        target: depositId,
        animated: true,
      });
      previousNodeId = depositId;
      xPosition += xGap;
      break;
    }
  }

  // Output node
  const outputId = "output-1";
  nodes.push({
    id: outputId,
    type: "output",
    position: { x: xPosition, y: yPosition },
    data: {
      label: "Final Balance",
      token: getOutputToken(intent),
      chain: intent.toChain || intent.fromChain || "Ethereum",
      status: "pending",
    },
  });

  edges.push({
    id: `e-${previousNodeId}-${outputId}`,
    source: previousNodeId,
    target: outputId,
    animated: true,
  });

  const route: RouteInfo = {
    totalSteps: nodes.length - 2,
    estimatedTime: "~3 min",
    estimatedGas: "Calculating...",
    estimatedOutput: "Calculating...",
  };

  return { nodes, edges, route };
}

// =============================================================================
// HELPERS
// =============================================================================

function formatUsdValue(amount: string, decimals: number, priceUSD: string): string {
  const numAmount = parseFloat(amount) / Math.pow(10, decimals);
  const price = parseFloat(priceUSD);
  const value = numAmount * price;
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function calculateRate(step: RouteStep): string {
  const fromAmount = parseFloat(step.action.fromAmount) / Math.pow(10, step.action.fromToken.decimals);
  const toAmount = parseFloat(step.estimate?.toAmount || "0") / Math.pow(10, step.action.toToken.decimals);
  if (fromAmount === 0) return "N/A";
  const rate = toAmount / fromAmount;
  return `1 ${step.action.fromToken.symbol} = ${rate.toFixed(4)} ${step.action.toToken.symbol}`;
}

function extractProtocolName(quote: ComposerQuote): string {
  // Try to extract from tool details or contract calls
  if (quote.toolDetails?.name) return quote.toolDetails.name;
  if (quote.tool) return quote.tool;
  return "Protocol";
}

function extractOutputToken(quote: ComposerQuote): string {
  // Check contract calls for output token
  if (quote.contractCalls?.[0]?.contractOutputsToken) {
    // Try to match with known tokens
    return quote.action.toToken.symbol;
  }
  return quote.action.toToken.symbol;
}

function extractFinalToken(quote: ComposerQuote): string {
  // If there are contract calls, the final token might be different
  if (quote.contractCalls?.length) {
    // For deposits, output is usually a receipt token like aWETH
    return quote.action.toToken.symbol;
  }
  return quote.action.toToken.symbol;
}

function getOutputToken(intent: ParsedIntent): string {
  switch (intent.action) {
    case "swap":
      return intent.toToken || "USDC";
    case "deposit":
      return `a${intent.fromToken || "ETH"}`;
    case "complex":
      return `a${intent.fromToken || "ETH"}`;
    default:
      return intent.fromToken || "ETH";
  }
}

// =============================================================================
// NODE STATUS UPDATE
// =============================================================================

export function updateNodeStatus(
  nodes: Node[],
  nodeId: string,
  status: "idle" | "pending" | "executing" | "complete" | "error"
): Node[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          status,
        },
      };
    }
    return node;
  });
}

export function getExecutableNodeIds(nodes: Node[]): string[] {
  // Return node IDs that represent executable steps (not input/output)
  return nodes
    .filter((node) => node.type !== "tokenInput" && node.type !== "output")
    .map((node) => node.id);
}
