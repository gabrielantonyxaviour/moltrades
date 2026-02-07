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
// LOGO PATH HELPERS
// =============================================================================

function getChainLogo(chainName: string): string {
  const map: Record<string, string> = {
    Ethereum: "/chains/ethereum.png",
    Base: "/chains/base.png",
    Arbitrum: "/chains/arbitrum.png",
    Optimism: "/chains/optimism.png",
    Polygon: "/chains/polygon.png",
    "BNB Chain": "/chains/bsc.png",
    Avalanche: "/chains/avalanche.png",
    Gnosis: "/chains/gnosis.png",
    Linea: "/chains/linea.png",
    Scroll: "/chains/scroll.png",
  };
  return map[chainName] || "/chains/ethereum.png";
}

function getProtocolLogo(protocolName: string): string {
  const map: Record<string, string> = {
    Aave: "/protocols/aave.png",
    Compound: "/protocols/compound.png",
    Morpho: "/protocols/morpho.png",
    Moonwell: "/protocols/moonwell.png",
    Seamless: "/protocols/seamless.png",
    Ethena: "/protocols/ethena.png",
    Lido: "/protocols/lido.png",
    EtherFi: "/protocols/etherfi.png",
    WETH: "/protocols/weth.png",
  };
  const key = Object.keys(map).find((k) =>
    protocolName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? map[key] : "/protocols/lifi.png";
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
  const fromChainName = getChainName(quote.action.fromChainId);
  const toChainName = getChainName(quote.action.toChainId);
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
      chain: fromChainName,
      chainLogo: getChainLogo(fromChainName),
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
    const bridgeGas = getTotalGasCostUSD(quote);
    const bridgeFees = getTotalFeeCostUSD(quote);
    nodes.push({
      id: bridgeId,
      type: "bridge",
      position: { x: xPosition, y: yPosition },
      data: {
        label: `Bridge to ${toChainName}`,
        fromChain: fromChainName,
        toChain: toChainName,
        fromChainLogo: getChainLogo(fromChainName),
        toChainLogo: getChainLogo(toChainName),
        provider: quote.toolDetails?.name || "LI.FI",
        estimatedTime: formatDuration(quote.estimate?.executionDuration || 0),
        fromToken: quote.action.fromToken.symbol,
        toToken: quote.action.toToken.symbol,
        fromAmount: formatTokenAmount(quote.action.fromAmount, quote.action.fromToken.decimals),
        toAmount: formatTokenAmount(quote.estimate?.toAmount || "0", quote.action.toToken.decimals),
        fee: bridgeFees !== "0.00" ? `~$${bridgeFees}` : undefined,
        gasCost: `~$${bridgeGas}`,
        slippage: `${(quote.action.slippage * 100).toFixed(1)}%`,
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
    const protocolName = extractProtocolName(quote);
    nodes.push({
      id: depositId,
      type: "deposit",
      position: { x: xPosition, y: yPosition },
      data: {
        label: "Deposit",
        protocol: protocolName,
        protocolLogo: getProtocolLogo(protocolName),
        token: quote.action.toToken.symbol,
        amount: formatTokenAmount(quote.estimate?.toAmount || "0", quote.action.toToken.decimals),
        receiveToken: extractOutputToken(quote),
        gasCost: `~$${getTotalGasCostUSD(quote)}`,
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
  const totalGas = getTotalGasCostUSD(quote);
  const totalFees = getTotalFeeCostUSD(quote);
  const minReceived = quote.estimate?.toAmountMin
    ? formatTokenAmount(quote.estimate.toAmountMin, quote.action.toToken.decimals)
    : undefined;

  nodes.push({
    id: outputId,
    type: "output",
    position: { x: xPosition, y: yPosition },
    data: {
      label: "Estimated Output",
      token: extractFinalToken(quote),
      amount: formatTokenAmount(quote.estimate?.toAmount || "0", quote.action.toToken.decimals),
      usdValue: quote.action.toToken.priceUSD
        ? formatUsdValue(quote.estimate?.toAmount || "0", quote.action.toToken.decimals, quote.action.toToken.priceUSD)
        : undefined,
      chain: toChainName,
      chainLogo: getChainLogo(toChainName),
      gasCost: `~$${totalGas}`,
      totalFees: totalFees !== "0.00" ? `~$${totalFees}` : undefined,
      minReceived: minReceived ? `${minReceived} ${extractFinalToken(quote)}` : undefined,
      estimatedTime: formatDuration(quote.estimate?.executionDuration || 0),
      slippage: `${(quote.action.slippage * 100).toFixed(1)}%`,
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
    estimatedGas: `~$${totalGas}`,
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
    case "cross": {
      const fromChain = getChainName(step.action.fromChainId);
      const toChain = getChainName(step.action.toChainId);
      const stepGas = getStepGasCostUSD(step);
      const stepFees = getStepFeeCostUSD(step);
      return {
        node: {
          id: nodeId,
          type: "bridge",
          position: { x: xPosition, y: yPosition },
          data: {
            label: `Bridge to ${toChain}`,
            fromChain,
            toChain,
            fromChainLogo: getChainLogo(fromChain),
            toChainLogo: getChainLogo(toChain),
            provider: step.toolDetails?.name || step.tool || "LI.FI",
            estimatedTime: formatDuration(step.estimate?.executionDuration || 0),
            fromToken: step.action.fromToken.symbol,
            toToken: step.action.toToken.symbol,
            fromAmount: formatTokenAmount(step.action.fromAmount, step.action.fromToken.decimals),
            toAmount: formatTokenAmount(step.estimate?.toAmount || "0", step.action.toToken.decimals),
            fee: stepFees !== "0.00" ? `~$${stepFees}` : undefined,
            gasCost: stepGas !== "0.00" ? `~$${stepGas}` : undefined,
            slippage: `${(step.action.slippage * 100).toFixed(1)}%`,
            status: "idle",
          },
        },
      };
    }

    case "swap": {
      const stepGas = getStepGasCostUSD(step);
      const stepFees = getStepFeeCostUSD(step);
      const minReceived = step.estimate?.toAmountMin
        ? formatTokenAmount(step.estimate.toAmountMin, step.action.toToken.decimals)
        : undefined;
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
            gasCost: stepGas !== "0.00" ? `~$${stepGas}` : undefined,
            feeCost: stepFees !== "0.00" ? `~$${stepFees}` : undefined,
            minReceived,
            slippage: `${(step.action.slippage * 100).toFixed(1)}%`,
            status: "idle",
          },
        },
      };
    }

    case "protocol":
    case "custom": {
      const proto = step.toolDetails?.name || step.tool || "Protocol";
      const stepGas = getStepGasCostUSD(step);
      return {
        node: {
          id: nodeId,
          type: "deposit",
          position: { x: xPosition, y: yPosition },
          data: {
            label: proto,
            protocol: proto,
            protocolLogo: getProtocolLogo(proto),
            token: step.action.fromToken.symbol,
            amount: formatTokenAmount(step.action.fromAmount, step.action.fromToken.decimals),
            receiveToken: step.action.toToken.symbol,
            receiveAmount: formatTokenAmount(step.estimate?.toAmount || "0", step.action.toToken.decimals),
            gasCost: stepGas !== "0.00" ? `~$${stepGas}` : undefined,
            status: "idle",
          },
        },
      };
    }

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

  const fromChain = intent.fromChain || "Ethereum";
  const toChain = intent.toChain || intent.fromChain || "Ethereum";

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
      chain: fromChain,
      chainLogo: getChainLogo(fromChain),
      status: "pending",
    },
  });

  let previousNodeId = inputId;
  xPosition += xGap;

  // Add appropriate intermediate nodes based on intent
  switch (intent.action) {
    case "bridge": {
      const bridgeId = "bridge-1";
      const bTo = intent.toChain || "Base";
      nodes.push({
        id: bridgeId,
        type: "bridge",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Bridge to ${bTo}`,
          fromChain,
          toChain: bTo,
          fromChainLogo: getChainLogo(fromChain),
          toChainLogo: getChainLogo(bTo),
          provider: "Fetching best route...",
          estimatedTime: "Calculating...",
          fromToken: intent.fromToken || "ETH",
          toToken: intent.fromToken || "ETH",
          fromAmount: intent.amount || "0",
          toAmount: "Calculating...",
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
          toAmount: "Calculating...",
          dex: "Fetching best DEX...",
          rate: "Calculating...",
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
      const dProto = intent.protocol || "Aave";
      nodes.push({
        id: depositId,
        type: "deposit",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Deposit to ${dProto}`,
          protocol: dProto,
          protocolLogo: getProtocolLogo(dProto),
          token: intent.fromToken || "ETH",
          amount: intent.amount || "0",
          receiveToken: `a${intent.fromToken || "ETH"}`,
          receiveAmount: "Calculating...",
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
      const cTo = intent.toChain || "Base";
      nodes.push({
        id: bridgeId,
        type: "bridge",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Bridge to ${cTo}`,
          fromChain,
          toChain: cTo,
          fromChainLogo: getChainLogo(fromChain),
          toChainLogo: getChainLogo(cTo),
          provider: "Fetching best route...",
          estimatedTime: "Calculating...",
          fromToken: intent.fromToken || "ETH",
          toToken: intent.fromToken || "ETH",
          fromAmount: intent.amount || "0",
          toAmount: "Calculating...",
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
      const cProto = intent.protocol || "Aave";
      nodes.push({
        id: depositId,
        type: "deposit",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Deposit to ${cProto}`,
          protocol: cProto,
          protocolLogo: getProtocolLogo(cProto),
          token: intent.fromToken || "ETH",
          amount: "Calculating...",
          receiveToken: `a${intent.fromToken || "ETH"}`,
          receiveAmount: "Calculating...",
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
  const outChain = intent.toChain || intent.fromChain || "Ethereum";
  nodes.push({
    id: outputId,
    type: "output",
    position: { x: xPosition, y: yPosition },
    data: {
      label: "Estimated Output",
      token: getOutputToken(intent),
      amount: "Calculating...",
      chain: outChain,
      chainLogo: getChainLogo(outChain),
      gasCost: "Calculating...",
      estimatedTime: "Calculating...",
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

function getStepGasCostUSD(step: RouteStep): string {
  const gasCosts = step.estimate?.gasCosts || [];
  const total = gasCosts.reduce((sum, cost) => {
    return sum + parseFloat(cost.amountUSD || "0");
  }, 0);
  return total.toFixed(2);
}

function getStepFeeCostUSD(step: RouteStep): string {
  const feeCosts = step.estimate?.feeCosts || [];
  const total = feeCosts.reduce((sum, cost) => {
    return sum + parseFloat(cost.amountUSD || "0");
  }, 0);
  return total.toFixed(2);
}

function getTotalFeeCostUSD(quote: ComposerQuote): string {
  const feeCosts = quote.estimate?.feeCosts || [];
  const total = feeCosts.reduce((sum, cost) => {
    return sum + parseFloat(cost.amountUSD || "0");
  }, 0);
  // Also sum step-level fees
  const steps = quote.includedSteps || [];
  const stepTotal = steps.reduce((sum, step) => {
    return sum + parseFloat(getStepFeeCostUSD(step));
  }, 0);
  return (total + stepTotal).toFixed(2);
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
