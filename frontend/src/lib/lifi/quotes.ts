/**
 * LI.FI Composer Quote Service
 *
 * Functions to request quotes from the LI.FI API for cross-chain operations.
 */

import { getContractCallsQuote, getQuote } from "@lifi/sdk";
import type { Address, AmountString, ChainId, ComposerQuote, ContractCall, ParsedIntent } from "./types";
import { generateProtocolAction, findProtocolByName, getTokenAddress, TOKENS } from "./protocols";
import { CHAIN_IDS } from "./sdk";

// =============================================================================
// CHAIN NAME TO ID MAPPING
// =============================================================================

const CHAIN_NAME_TO_ID: Record<string, ChainId> = {
  ethereum: CHAIN_IDS.ETHEREUM,
  eth: CHAIN_IDS.ETHEREUM,
  mainnet: CHAIN_IDS.ETHEREUM,
  arbitrum: CHAIN_IDS.ARBITRUM,
  arb: CHAIN_IDS.ARBITRUM,
  base: CHAIN_IDS.BASE,
  optimism: CHAIN_IDS.OPTIMISM,
  op: CHAIN_IDS.OPTIMISM,
  polygon: CHAIN_IDS.POLYGON,
  matic: CHAIN_IDS.POLYGON,
  bsc: CHAIN_IDS.BSC,
  bnb: CHAIN_IDS.BSC,
  "bnb chain": CHAIN_IDS.BSC,
  unichain: CHAIN_IDS.UNICHAIN,
  gnosis: CHAIN_IDS.GNOSIS,
  avalanche: CHAIN_IDS.AVALANCHE,
  avax: CHAIN_IDS.AVALANCHE,
  linea: CHAIN_IDS.LINEA,
  scroll: CHAIN_IDS.SCROLL,
};

export function getChainId(chainName: string): ChainId | undefined {
  return CHAIN_NAME_TO_ID[chainName.toLowerCase()];
}

// =============================================================================
// QUOTE REQUEST TYPES
// =============================================================================

export interface QuoteRequest {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromToken: Address;
  toToken: Address;
  fromAmount: AmountString;
  fromAddress: Address;
  toAddress?: Address;
  slippage?: number;
}

export interface ComposerQuoteRequest {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromToken: Address;
  toToken: Address;
  toAmount: AmountString;
  fromAddress: Address;
  contractCalls: ContractCall[];
  toFallbackAddress?: Address;
  slippage?: number;
}

// =============================================================================
// SIMPLE QUOTE (Bridge/Swap)
// =============================================================================

export async function getSimpleQuote(request: QuoteRequest): Promise<ComposerQuote> {
  try {
    const quote = await getQuote({
      fromChain: request.fromChainId,
      toChain: request.toChainId,
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.fromAmount,
      fromAddress: request.fromAddress,
      toAddress: request.toAddress || request.fromAddress,
      slippage: request.slippage || 0.03,
      integrator: "moltrades",
    });

    return quote as unknown as ComposerQuote;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get quote: ${err.message}`);
  }
}

// =============================================================================
// COMPOSER QUOTE (Contract Calls)
// =============================================================================

export async function getComposerQuote(request: ComposerQuoteRequest): Promise<ComposerQuote> {
  try {
    const quote = await getContractCallsQuote({
      fromChain: request.fromChainId,
      toChain: request.toChainId,
      fromToken: request.fromToken,
      toToken: request.toToken,
      toAmount: request.toAmount,
      fromAddress: request.fromAddress,
      contractCalls: request.contractCalls,
      toFallbackAddress: request.toFallbackAddress || request.fromAddress,
      slippage: request.slippage || 0.03,
      integrator: "moltrades",
    });

    return quote as unknown as ComposerQuote;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to get composer quote: ${err.message}`);
  }
}

// =============================================================================
// INTENT-BASED QUOTE
// =============================================================================

export async function getQuoteFromIntent(
  intent: ParsedIntent,
  fromAddress: Address
): Promise<ComposerQuote | null> {
  switch (intent.action) {
    case "bridge":
      return getBridgeQuote(intent, fromAddress);
    case "swap":
      return getSwapQuote(intent, fromAddress);
    case "deposit":
      return getDepositQuote(intent, fromAddress);
    case "complex":
      return getComplexQuote(intent, fromAddress);
    default:
      return null;
  }
}

// =============================================================================
// BRIDGE QUOTE
// =============================================================================

async function getBridgeQuote(intent: ParsedIntent, fromAddress: Address): Promise<ComposerQuote | null> {
  const fromChainId = getChainId(intent.fromChain || "ethereum");
  const toChainId = getChainId(intent.toChain || "base");

  if (!fromChainId || !toChainId) {
    throw new Error(`Unsupported chain: ${intent.fromChain} or ${intent.toChain}`);
  }

  const tokenSymbol = intent.fromToken?.toUpperCase() || "ETH";
  const fromToken = getTokenAddress(fromChainId, tokenSymbol);
  const toToken = getTokenAddress(toChainId, tokenSymbol);

  if (!fromToken || !toToken) {
    throw new Error(`Token ${tokenSymbol} not supported on one of the chains`);
  }

  const amount = parseTokenAmount(intent.amount || "0", tokenSymbol);

  return getSimpleQuote({
    fromChainId,
    toChainId,
    fromToken,
    toToken,
    fromAmount: amount,
    fromAddress,
  });
}

// =============================================================================
// SWAP QUOTE
// =============================================================================

async function getSwapQuote(intent: ParsedIntent, fromAddress: Address): Promise<ComposerQuote | null> {
  const chainId = getChainId(intent.fromChain || "ethereum");

  if (!chainId) {
    throw new Error(`Unsupported chain: ${intent.fromChain}`);
  }

  const fromTokenSymbol = intent.fromToken?.toUpperCase() || "ETH";
  const toTokenSymbol = intent.toToken?.toUpperCase() || "USDC";
  const fromToken = getTokenAddress(chainId, fromTokenSymbol);
  const toToken = getTokenAddress(chainId, toTokenSymbol);

  if (!fromToken || !toToken) {
    throw new Error(`Token not supported: ${fromTokenSymbol} or ${toTokenSymbol}`);
  }

  const amount = parseTokenAmount(intent.amount || "0", fromTokenSymbol);

  return getSimpleQuote({
    fromChainId: chainId,
    toChainId: chainId,
    fromToken,
    toToken,
    fromAmount: amount,
    fromAddress,
  });
}

// =============================================================================
// DEPOSIT QUOTE (Protocol Interaction)
// =============================================================================

async function getDepositQuote(intent: ParsedIntent, fromAddress: Address): Promise<ComposerQuote | null> {
  // Determine the target chain (default to Base for deposits)
  const toChainId = getChainId(intent.toChain || intent.fromChain || "base");
  const fromChainId = getChainId(intent.fromChain || "ethereum");

  if (!fromChainId || !toChainId) {
    throw new Error(`Unsupported chain`);
  }

  const tokenSymbol = intent.fromToken?.toUpperCase() || "ETH";
  const protocolName = intent.protocol || "aave";

  // Find the protocol deployment
  const deployment = findProtocolByName(protocolName, tokenSymbol, toChainId);

  if (!deployment) {
    throw new Error(`Protocol ${protocolName} not found for ${tokenSymbol} on chain ${toChainId}`);
  }

  const amount = parseTokenAmount(intent.amount || "0", tokenSymbol);

  // Generate the contract call for the protocol
  const actionConfig = generateProtocolAction(deployment, amount, fromAddress);

  // Get the source token
  const fromToken = getTokenAddress(fromChainId, tokenSymbol);
  if (!fromToken) {
    throw new Error(`Token ${tokenSymbol} not supported on source chain`);
  }

  // Build contract call
  const contractCall: ContractCall = {
    fromAmount: amount,
    fromTokenAddress: deployment.inputToken,
    toContractAddress: actionConfig.toContractAddress,
    toContractCallData: actionConfig.toContractCallData,
    toContractGasLimit: actionConfig.toContractGasLimit,
    contractOutputsToken: actionConfig.contractOutputsToken,
  };

  return getComposerQuote({
    fromChainId,
    toChainId,
    fromToken,
    toToken: deployment.inputToken,
    toAmount: amount,
    fromAddress,
    contractCalls: [contractCall],
  });
}

// =============================================================================
// COMPLEX QUOTE (Multi-step)
// =============================================================================

async function getComplexQuote(intent: ParsedIntent, fromAddress: Address): Promise<ComposerQuote | null> {
  // For complex intents, try to parse as deposit with bridge
  // Example: "bridge 0.5 ETH to Base and deposit into Aave"

  const fromChainId = getChainId(intent.fromChain || "ethereum");
  const toChainId = getChainId(intent.toChain || "base");

  if (!fromChainId || !toChainId) {
    throw new Error(`Unsupported chain`);
  }

  // Default to ETH and Aave for complex intents
  const tokenSymbol = intent.fromToken?.toUpperCase() || "ETH";
  const protocolName = intent.protocol || "aave";

  // Find protocol deployment on destination chain
  const deployment = findProtocolByName(protocolName, tokenSymbol, toChainId);

  if (!deployment) {
    // Fallback to simple bridge
    return getBridgeQuote(intent, fromAddress);
  }

  const amount = parseTokenAmount(intent.amount || "0", tokenSymbol);
  const fromToken = getTokenAddress(fromChainId, tokenSymbol);

  if (!fromToken) {
    throw new Error(`Token ${tokenSymbol} not supported on source chain`);
  }

  // Generate protocol action
  const actionConfig = generateProtocolAction(deployment, amount, fromAddress);

  const contractCall: ContractCall = {
    fromAmount: amount,
    fromTokenAddress: deployment.inputToken,
    toContractAddress: actionConfig.toContractAddress,
    toContractCallData: actionConfig.toContractCallData,
    toContractGasLimit: actionConfig.toContractGasLimit,
    contractOutputsToken: actionConfig.contractOutputsToken,
  };

  return getComposerQuote({
    fromChainId,
    toChainId,
    fromToken,
    toToken: deployment.inputToken,
    toAmount: amount,
    fromAddress,
    contractCalls: [contractCall],
  });
}

// =============================================================================
// HELPERS
// =============================================================================

function parseTokenAmount(amount: string, tokenSymbol: string): AmountString {
  const cleanAmount = amount.replace(/,/g, "");
  const numAmount = parseFloat(cleanAmount);

  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Get decimals for token
  const decimals = getTokenDecimals(tokenSymbol);
  const wei = BigInt(Math.floor(numAmount * Math.pow(10, decimals)));

  return wei.toString();
}

function getTokenDecimals(symbol: string): number {
  const decimalsMap: Record<string, number> = {
    ETH: 18,
    WETH: 18,
    USDC: 6,
    USDT: 6,
    DAI: 18,
    WBTC: 8,
    MATIC: 18,
    BNB: 18,
    AVAX: 18,
  };
  return decimalsMap[symbol.toUpperCase()] || 18;
}

// =============================================================================
// QUOTE UTILITIES
// =============================================================================

export function getEstimatedOutput(quote: ComposerQuote): string {
  return quote.estimate?.toAmount || "0";
}

export function getMinimumOutput(quote: ComposerQuote): string {
  return quote.estimate?.toAmountMin || "0";
}

export function getEstimatedDuration(quote: ComposerQuote): number {
  return quote.estimate?.executionDuration || 0;
}

export function getTotalGasCostUSD(quote: ComposerQuote): string {
  const gasCosts = quote.estimate?.gasCosts || [];
  const total = gasCosts.reduce((sum, cost) => {
    return sum + parseFloat(cost.amountUSD || "0");
  }, 0);
  return total.toFixed(2);
}

export function requiresApproval(quote: ComposerQuote): boolean {
  return !!quote.estimate?.approvalAddress;
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  if (num < 0.0001) return "<0.0001";
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}
