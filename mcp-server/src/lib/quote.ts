/**
 * LI.FI Composer Quote Functions (MCP Server)
 */

import { getContractCallsQuote } from '@lifi/sdk';
import type {
  ContractCallsQuoteRequest,
  ContractCallsQuote,
  ContractCall,
  Address,
  AmountString,
  ChainId,
} from './types.js';

export type ComposerQuoteResponse = ContractCallsQuote;

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

export async function getComposerQuote(
  request: ComposerQuoteRequest
): Promise<ComposerQuoteResponse> {
  try {
    console.error('[Quote] Requesting quote...');
    console.error('[Quote] From:', request.fromChain, request.fromToken);
    console.error('[Quote] To:', request.toChain, request.toToken);
    console.error('[Quote] Contract calls:', request.contractCalls.length);

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

    console.error('[Quote] Quote received, tool:', quote.tool);
    console.error('[Quote] Steps:', quote.includedSteps?.length || 0);
    console.error('[Quote] Estimated output:', quote.estimate?.toAmount);

    return quote as unknown as ComposerQuoteResponse;
  } catch (error) {
    const err = error as Error & { response?: { data?: { message?: string; code?: string } } };
    console.error('[Quote] Error:', err.message);

    const errorMessage = err.response?.data?.message || err.message;
    const errorCode = err.response?.data?.code || 'QUOTE_ERROR';

    throw new ComposerQuoteError(
      `Failed to get quote: ${errorMessage}`,
      errorCode,
      { originalError: err.message }
    );
  }
}

export function getEstimatedOutput(quote: ComposerQuoteResponse): AmountString {
  return quote.estimate?.toAmount || '0';
}

export function getMinimumOutput(quote: ComposerQuoteResponse): AmountString {
  return quote.estimate?.toAmountMin || '0';
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
