// Intent parser - converts natural language to flow steps
import { FlowStep, ParsedIntent, RouteInfo } from "./types";
import { Node, Edge } from "@xyflow/react";

// Simple regex patterns for parsing intents
const BRIDGE_PATTERN = /bridge\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:from\s+)?(\w+)\s+to\s+(\w+)/i;
const SWAP_PATTERN = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)(?:\s+on\s+(\w+))?/i;
const DEPOSIT_PATTERN = /deposit\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:into|on|to)\s+(\w+)/i;
const COMPLEX_PATTERN = /bridge.*(?:and|then)\s+(?:swap|deposit)/i;

// Chain name normalization
const CHAIN_ALIASES: Record<string, string> = {
  eth: "Ethereum",
  ethereum: "Ethereum",
  mainnet: "Ethereum",
  arb: "Arbitrum",
  arbitrum: "Arbitrum",
  op: "Optimism",
  optimism: "Optimism",
  base: "Base",
  poly: "Polygon",
  polygon: "Polygon",
  matic: "Polygon",
  avax: "Avalanche",
  avalanche: "Avalanche",
  bsc: "BNB Chain",
  bnb: "BNB Chain",
  binance: "BNB Chain",
};

// Token name normalization
const TOKEN_ALIASES: Record<string, string> = {
  eth: "ETH",
  ether: "ETH",
  ethereum: "ETH",
  usdc: "USDC",
  usdt: "USDT",
  tether: "USDT",
  dai: "DAI",
  weth: "WETH",
  wbtc: "WBTC",
  btc: "WBTC",
  matic: "MATIC",
  arb: "ARB",
  op: "OP",
};

// Protocol name normalization
const PROTOCOL_ALIASES: Record<string, string> = {
  aave: "Aave",
  compound: "Compound",
  uniswap: "Uniswap",
  sushiswap: "SushiSwap",
  sushi: "SushiSwap",
  curve: "Curve",
  balancer: "Balancer",
  yearn: "Yearn",
  lido: "Lido",
  stargate: "Stargate",
};

function normalizeChain(chain: string): string {
  return CHAIN_ALIASES[chain.toLowerCase()] || chain;
}

function normalizeToken(token: string): string {
  return TOKEN_ALIASES[token.toLowerCase()] || token.toUpperCase();
}

function normalizeProtocol(protocol: string): string {
  return PROTOCOL_ALIASES[protocol.toLowerCase()] || protocol;
}

export function parseIntent(input: string): ParsedIntent {
  const normalizedInput = input.toLowerCase().trim();

  // Check for complex multi-step intent
  if (COMPLEX_PATTERN.test(normalizedInput)) {
    return {
      action: "complex",
      description: input,
    };
  }

  // Try to match bridge pattern
  const bridgeMatch = input.match(BRIDGE_PATTERN);
  if (bridgeMatch) {
    return {
      action: "bridge",
      amount: bridgeMatch[1],
      fromToken: normalizeToken(bridgeMatch[2]),
      fromChain: normalizeChain(bridgeMatch[3]),
      toChain: normalizeChain(bridgeMatch[4]),
      description: input,
    };
  }

  // Try to match swap pattern
  const swapMatch = input.match(SWAP_PATTERN);
  if (swapMatch) {
    return {
      action: "swap",
      amount: swapMatch[1],
      fromToken: normalizeToken(swapMatch[2]),
      toToken: normalizeToken(swapMatch[3]),
      fromChain: swapMatch[4] ? normalizeChain(swapMatch[4]) : "Ethereum",
      description: input,
    };
  }

  // Try to match deposit pattern
  const depositMatch = input.match(DEPOSIT_PATTERN);
  if (depositMatch) {
    return {
      action: "deposit",
      amount: depositMatch[1],
      fromToken: normalizeToken(depositMatch[2]),
      protocol: normalizeProtocol(depositMatch[3]),
      description: input,
    };
  }

  // Fallback - try to extract any tokens/chains mentioned
  return {
    action: "complex",
    description: input,
  };
}

export function generateFlowFromIntent(intent: ParsedIntent): {
  nodes: Node[];
  edges: Edge[];
  route: RouteInfo;
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yPosition = 0;
  const xPosition = 250;
  const yGap = 150;

  switch (intent.action) {
    case "bridge": {
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
          usdValue: calculateUsdValue(intent.fromToken || "ETH", intent.amount || "0"),
          chain: intent.fromChain || "Ethereum",
        },
      });

      // Bridge node
      yPosition += yGap;
      const bridgeId = "bridge-1";
      nodes.push({
        id: bridgeId,
        type: "bridge",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Bridge to ${intent.toChain}`,
          fromChain: intent.fromChain || "Ethereum",
          toChain: intent.toChain || "Base",
          provider: "LI.FI",
          estimatedTime: "2-5 min",
          fee: "~$2.50",
          status: "idle",
        },
      });
      edges.push({ id: `e-${inputId}-${bridgeId}`, source: inputId, target: bridgeId, animated: true });

      // Output node
      yPosition += yGap;
      const outputId = "output-1";
      nodes.push({
        id: outputId,
        type: "output",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Final Balance",
          token: intent.fromToken || "ETH",
          amount: intent.amount || "0",
          usdValue: calculateUsdValue(intent.fromToken || "ETH", intent.amount || "0"),
          chain: intent.toChain || "Base",
        },
      });
      edges.push({ id: `e-${bridgeId}-${outputId}`, source: bridgeId, target: outputId, animated: true });

      return {
        nodes,
        edges,
        route: {
          totalSteps: 1,
          estimatedTime: "2-5 min",
          estimatedGas: "~$2.50",
          estimatedOutput: `${intent.amount || "0"} ${intent.fromToken || "ETH"}`,
        },
      };
    }

    case "swap": {
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
          usdValue: calculateUsdValue(intent.fromToken || "ETH", intent.amount || "0"),
          chain: intent.fromChain || "Ethereum",
        },
      });

      // Swap node
      yPosition += yGap;
      const swapId = "swap-1";
      const toAmount = calculateSwapOutput(intent.fromToken || "ETH", intent.toToken || "USDC", intent.amount || "0");
      nodes.push({
        id: swapId,
        type: "swap",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `${intent.fromToken} → ${intent.toToken}`,
          fromToken: intent.fromToken || "ETH",
          toToken: intent.toToken || "USDC",
          fromAmount: intent.amount || "0",
          toAmount,
          dex: "Uniswap",
          rate: `1 ${intent.fromToken || "ETH"} = ${getMockRate(intent.fromToken || "ETH", intent.toToken || "USDC")} ${intent.toToken || "USDC"}`,
          priceImpact: "< 0.1%",
          status: "idle",
        },
      });
      edges.push({ id: `e-${inputId}-${swapId}`, source: inputId, target: swapId, animated: true });

      // Output node
      yPosition += yGap;
      const outputId = "output-1";
      nodes.push({
        id: outputId,
        type: "output",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Final Balance",
          token: intent.toToken || "USDC",
          amount: toAmount,
          usdValue: toAmount,
          chain: intent.fromChain || "Ethereum",
        },
      });
      edges.push({ id: `e-${swapId}-${outputId}`, source: swapId, target: outputId, animated: true });

      return {
        nodes,
        edges,
        route: {
          totalSteps: 1,
          estimatedTime: "< 1 min",
          estimatedGas: "~$5.00",
          estimatedOutput: `${toAmount} ${intent.toToken || "USDC"}`,
        },
      };
    }

    case "deposit": {
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
          usdValue: calculateUsdValue(intent.fromToken || "ETH", intent.amount || "0"),
          chain: "Ethereum",
        },
      });

      // Deposit node
      yPosition += yGap;
      const depositId = "deposit-1";
      const receiveToken = getReceiveToken(intent.protocol || "Aave", intent.fromToken || "ETH");
      nodes.push({
        id: depositId,
        type: "deposit",
        position: { x: xPosition, y: yPosition },
        data: {
          label: `Deposit to ${intent.protocol}`,
          protocol: intent.protocol || "Aave",
          token: intent.fromToken || "ETH",
          amount: intent.amount || "0",
          apy: getMockApy(intent.protocol || "Aave"),
          receiveToken,
          status: "idle",
        },
      });
      edges.push({ id: `e-${inputId}-${depositId}`, source: inputId, target: depositId, animated: true });

      // Output node
      yPosition += yGap;
      const outputId = "output-1";
      nodes.push({
        id: outputId,
        type: "output",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Position",
          token: receiveToken,
          amount: intent.amount || "0",
          usdValue: calculateUsdValue(intent.fromToken || "ETH", intent.amount || "0"),
          chain: "Ethereum",
        },
      });
      edges.push({ id: `e-${depositId}-${outputId}`, source: depositId, target: outputId, animated: true });

      return {
        nodes,
        edges,
        route: {
          totalSteps: 1,
          estimatedTime: "< 1 min",
          estimatedGas: "~$8.00",
          estimatedOutput: `${intent.amount || "0"} ${receiveToken}`,
        },
      };
    }

    case "complex":
    default: {
      // For complex intents, create a sample multi-step flow
      // Input node
      const inputId = "input-1";
      nodes.push({
        id: inputId,
        type: "tokenInput",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Starting Balance",
          token: "ETH",
          amount: "1",
          usdValue: "2,500",
          chain: "Ethereum",
        },
      });

      // Bridge node
      yPosition += yGap;
      const bridgeId = "bridge-1";
      nodes.push({
        id: bridgeId,
        type: "bridge",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Bridge to Base",
          fromChain: "Ethereum",
          toChain: "Base",
          provider: "LI.FI",
          estimatedTime: "2-5 min",
          fee: "~$2.50",
          status: "idle",
        },
      });
      edges.push({ id: `e-${inputId}-${bridgeId}`, source: inputId, target: bridgeId, animated: true });

      // Swap node
      yPosition += yGap;
      const swapId = "swap-1";
      nodes.push({
        id: swapId,
        type: "swap",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "ETH → USDC",
          fromToken: "ETH",
          toToken: "USDC",
          fromAmount: "1",
          toAmount: "2,500",
          dex: "Uniswap",
          rate: "1 ETH = 2,500 USDC",
          priceImpact: "< 0.1%",
          status: "idle",
        },
      });
      edges.push({ id: `e-${bridgeId}-${swapId}`, source: bridgeId, target: swapId, animated: true });

      // Deposit node
      yPosition += yGap;
      const depositId = "deposit-1";
      nodes.push({
        id: depositId,
        type: "deposit",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Deposit to Aave",
          protocol: "Aave",
          token: "USDC",
          amount: "2,500",
          apy: "4.5%",
          receiveToken: "aUSDC",
          status: "idle",
        },
      });
      edges.push({ id: `e-${swapId}-${depositId}`, source: swapId, target: depositId, animated: true });

      // Output node
      yPosition += yGap;
      const outputId = "output-1";
      nodes.push({
        id: outputId,
        type: "output",
        position: { x: xPosition, y: yPosition },
        data: {
          label: "Final Position",
          token: "aUSDC",
          amount: "2,500",
          usdValue: "2,500",
          chain: "Base",
        },
      });
      edges.push({ id: `e-${depositId}-${outputId}`, source: depositId, target: outputId, animated: true });

      return {
        nodes,
        edges,
        route: {
          totalSteps: 3,
          estimatedTime: "5-8 min",
          estimatedGas: "~$15.00",
          estimatedOutput: "2,500 aUSDC",
        },
      };
    }
  }
}

// Mock helper functions for demo purposes
function calculateUsdValue(token: string, amount: string): string {
  const prices: Record<string, number> = {
    ETH: 2500,
    WETH: 2500,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    WBTC: 45000,
    MATIC: 0.8,
    ARB: 1.2,
    OP: 2.5,
  };
  const price = prices[token] || 1;
  const value = parseFloat(amount) * price;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function calculateSwapOutput(fromToken: string, toToken: string, amount: string): string {
  const rate = getMockRateNumber(fromToken, toToken);
  const output = parseFloat(amount) * rate;
  return output.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function getMockRate(fromToken: string, toToken: string): string {
  const rate = getMockRateNumber(fromToken, toToken);
  return rate.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function getMockRateNumber(fromToken: string, toToken: string): number {
  const prices: Record<string, number> = {
    ETH: 2500,
    WETH: 2500,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    WBTC: 45000,
    MATIC: 0.8,
    ARB: 1.2,
    OP: 2.5,
  };
  const fromPrice = prices[fromToken] || 1;
  const toPrice = prices[toToken] || 1;
  return fromPrice / toPrice;
}

function getMockApy(protocol: string): string {
  const apys: Record<string, string> = {
    Aave: "4.5%",
    Compound: "3.8%",
    Yearn: "6.2%",
    Lido: "5.1%",
    Curve: "7.3%",
  };
  return apys[protocol] || "4.0%";
}

function getReceiveToken(protocol: string, token: string): string {
  const prefixes: Record<string, string> = {
    Aave: "a",
    Compound: "c",
    Yearn: "yv",
    Lido: "st",
  };
  const prefix = prefixes[protocol] || "";
  return `${prefix}${token}`;
}
