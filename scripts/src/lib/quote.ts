/**
 * LI.FI Composer Quote Functions
 *
 * Functions to request quotes for cross-chain contract calls.
 * Uses LI.FI SDK's getContractCallsQuote for optimal routing.
 */

import { getContractCallsQuote } from '@lifi/sdk';
import type {
  ContractCallsQuoteRequest,
  ContractCallsQuote,
  ContractCall,
  Address,
  AmountString,
  ChainId,
  ValidationResult,
} from './types';
import {
  generateWrapAction,
  generateApproveAction,
  toContractCall,
  WETH_ADDRESSES,
  NATIVE_TOKEN_ADDRESS,
} from './actions';

// =============================================================================
// TYPES
// =============================================================================

export interface ComposerQuoteRequest {
  fromChain: ChainId;
  fromToken: Address | string;
  fromAddress: Address;
  toChain: ChainId;
  toToken: Address | string;
  toAmount: AmountString;
  contractCalls: ContractCall[];
  toFallbackAddress?: Address;
  slippage?: number;
  integrator?: string;
  allowBridges?: string[];
  denyBridges?: string[];
}

export type ComposerQuoteResponse = ContractCallsQuote;

// =============================================================================
// ERRORS
// =============================================================================

export class ComposerQuoteError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ComposerQuoteError';
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

export function validateQuoteRequest(
  request: ComposerQuoteRequest
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!request.fromChain) errors.push('fromChain is required');
  if (!request.toChain) errors.push('toChain is required');
  if (!request.fromToken) errors.push('fromToken is required');
  if (!request.toToken) errors.push('toToken is required');
  if (!request.fromAddress) errors.push('fromAddress is required');
  if (!request.toAmount || request.toAmount === '0') errors.push('toAmount must be greater than 0');
  if (!request.contractCalls || request.contractCalls.length === 0) errors.push('At least one contractCall is required');

  request.contractCalls?.forEach((call, index) => {
    if (!call.fromAmount) errors.push(`contractCalls[${index}].fromAmount is required`);
    if (!call.fromTokenAddress) errors.push(`contractCalls[${index}].fromTokenAddress is required`);
    if (!call.toContractAddress) errors.push(`contractCalls[${index}].toContractAddress is required`);
    if (!call.toContractCallData) errors.push(`contractCalls[${index}].toContractCallData is required`);
    if (!call.toContractGasLimit) errors.push(`contractCalls[${index}].toContractGasLimit is required`);
  });

  if (request.fromChain === request.toChain) {
    warnings.push('Same-chain operations may be cheaper without cross-chain routing');
  }
  if (!request.toFallbackAddress) {
    warnings.push('No fallback address set - tokens will go to fromAddress if contract call fails');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// =============================================================================
// MAIN QUOTE FUNCTION
// =============================================================================

export async function getComposerQuote(
  request: ComposerQuoteRequest
): Promise<ComposerQuoteResponse> {
  const validation = validateQuoteRequest(request);
  if (!validation.valid) {
    throw new ComposerQuoteError(
      `Invalid quote request: ${validation.errors.join(', ')}`,
      'VALIDATION_ERROR',
      { errors: validation.errors }
    );
  }

  validation.warnings?.forEach((warning) => {
    console.warn('[Composer Quote]', warning);
  });

  try {
    console.log('[Composer Quote] Requesting quote...');
    console.log('[Composer Quote] From:', request.fromChain, request.fromToken);
    console.log('[Composer Quote] To:', request.toChain, request.toToken);
    console.log('[Composer Quote] Contract calls:', request.contractCalls.length);

    const fullRequest: ContractCallsQuoteRequest = {
      fromChain: request.fromChain,
      fromToken: request.fromToken,
      fromAddress: request.fromAddress,
      toChain: request.toChain,
      toToken: request.toToken,
      toAmount: request.toAmount,
      contractCalls: request.contractCalls,
      toFallbackAddress: request.toFallbackAddress || request.fromAddress,
      slippage: request.slippage ?? 0.03,
      integrator: request.integrator || 'ethglobal-playground',
      allowBridges: request.allowBridges,
      denyBridges: request.denyBridges,
    };

    const quote = await getContractCallsQuote(fullRequest);

    console.log('[Composer Quote] Quote received');
    console.log('[Composer Quote] Tool:', quote.tool);
    console.log('[Composer Quote] Steps:', quote.includedSteps?.length || 0);
    console.log('[Composer Quote] Estimated output:', quote.estimate?.toAmount);

    return quote as unknown as ComposerQuoteResponse;
  } catch (error) {
    const err = error as Error & { response?: { data?: { message?: string; code?: string } } };
    console.error('[Composer Quote] Error:', err.message);

    const errorMessage = err.response?.data?.message || err.message;
    const errorCode = err.response?.data?.code || 'QUOTE_ERROR';

    throw new ComposerQuoteError(
      `Failed to get quote: ${errorMessage}`,
      errorCode,
      { originalError: err }
    );
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function getSwapAndWrapQuote(
  fromChain: ChainId,
  fromToken: Address | string,
  amount: AmountString,
  fromAddress: Address,
  toChain: ChainId
): Promise<ComposerQuoteResponse> {
  const wethAddress = WETH_ADDRESSES[toChain];
  if (!wethAddress) {
    throw new ComposerQuoteError(
      `WETH not supported on chain ${toChain}`,
      'UNSUPPORTED_CHAIN'
    );
  }

  const wrapConfig = generateWrapAction(toChain, amount);
  const contractCall = toContractCall(wrapConfig, amount, NATIVE_TOKEN_ADDRESS);

  return getComposerQuote({
    fromChain,
    fromToken,
    fromAddress,
    toChain,
    toToken: wethAddress,
    toAmount: amount,
    contractCalls: [contractCall],
  });
}

export async function getBridgeAndApproveQuote(
  fromChain: ChainId,
  fromToken: Address | string,
  amount: AmountString,
  fromAddress: Address,
  toChain: ChainId,
  toToken: Address | string,
  spenderAddress: Address
): Promise<ComposerQuoteResponse> {
  const approveConfig = generateApproveAction(toToken as Address, spenderAddress);
  const contractCall = toContractCall(approveConfig, amount, toToken as Address);

  return getComposerQuote({
    fromChain,
    fromToken,
    fromAddress,
    toChain,
    toToken,
    toAmount: amount,
    contractCalls: [contractCall],
  });
}

export async function getMultiCallQuote(params: {
  fromChain: ChainId;
  fromToken: Address | string;
  amount: AmountString;
  fromAddress: Address;
  toChain: ChainId;
  toToken: Address | string;
  contractCalls: ContractCall[];
  slippage?: number;
}): Promise<ComposerQuoteResponse> {
  return getComposerQuote({
    fromChain: params.fromChain,
    fromToken: params.fromToken,
    fromAddress: params.fromAddress,
    toChain: params.toChain,
    toToken: params.toToken,
    toAmount: params.amount,
    contractCalls: params.contractCalls,
    slippage: params.slippage,
  });
}

// =============================================================================
// QUOTE UTILITIES
// =============================================================================

export function getEstimatedOutput(quote: ComposerQuoteResponse): AmountString {
  return quote.estimate?.toAmount || '0';
}

export function getMinimumOutput(quote: ComposerQuoteResponse): AmountString {
  return quote.estimate?.toAmountMin || '0';
}

export function getEstimatedDuration(quote: ComposerQuoteResponse): number {
  return quote.estimate?.executionDuration || 0;
}

export function getTotalGasCostUSD(quote: ComposerQuoteResponse): string {
  const gasCosts = quote.estimate?.gasCosts || [];
  const total = gasCosts.reduce((sum, cost) => {
    return sum + parseFloat(cost.amountUSD || '0');
  }, 0);
  return total.toFixed(2);
}

export function requiresApproval(quote: ComposerQuoteResponse): boolean {
  return !!quote.estimate?.approvalAddress;
}

export function getApprovalAddress(quote: ComposerQuoteResponse): Address | undefined {
  return quote.estimate?.approvalAddress;
}
