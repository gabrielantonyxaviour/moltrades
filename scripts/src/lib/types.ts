/**
 * LI.FI Composer TypeScript Interfaces
 *
 * Types for cross-chain contract calls integration.
 * Based on LI.FI API documentation and SDK.
 *
 * @see https://docs.li.fi/li.fi-api/li.fi-api/requesting-a-quote/cross-chain-contract-calls
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export type ComposerActionType = 'wrap' | 'unwrap' | 'approve' | 'stake' | 'custom';
export type ChainId = number;
export type Address = `0x${string}`;
export type HexData = `0x${string}`;
export type AmountString = string;

// =============================================================================
// CONTRACT CALL CONFIGURATION
// =============================================================================

export interface ContractCall {
  fromAmount: AmountString;
  fromTokenAddress: Address;
  toContractAddress: Address;
  toContractCallData: HexData;
  toContractGasLimit: AmountString;
  toApprovalAddress?: Address;
  contractOutputsToken?: Address;
}

// =============================================================================
// QUOTE REQUEST
// =============================================================================

export interface ContractCallsQuoteRequest {
  fromChain: ChainId;
  fromToken: Address | string;
  fromAddress: Address;
  toChain: ChainId;
  toToken: Address | string;
  toAmount: AmountString;
  contractCalls: ContractCall[];
  toFallbackAddress?: Address;
  contractOutputsToken?: Address;
  slippage?: number;
  integrator?: string;
  referrer?: Address;
  allowBridges?: string[];
  denyBridges?: string[];
  preferBridges?: string[];
  allowExchanges?: string[];
  denyExchanges?: string[];
  preferExchanges?: string[];
  allowDestinationCall?: boolean;
  fee?: number;
}

// =============================================================================
// QUOTE RESPONSE
// =============================================================================

export interface QuoteToken {
  address: Address;
  symbol: string;
  decimals: number;
  chainId: ChainId;
  name: string;
  logoURI?: string;
  priceUSD?: string;
}

export interface GasCost {
  type: string;
  estimate: string;
  limit: string;
  amount: string;
  amountUSD: string;
  price: string;
  token: QuoteToken;
}

export interface FeeCost {
  name: string;
  description: string;
  percentage: string;
  token: QuoteToken;
  amount: string;
  amountUSD: string;
  included: boolean;
}

export interface StepEstimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress?: Address;
  executionDuration: number;
  gasCosts?: GasCost[];
  feeCosts?: FeeCost[];
}

export interface RouteStep {
  id: string;
  type: 'swap' | 'bridge' | 'cross' | 'protocol' | 'custom';
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  action: {
    fromChainId: ChainId;
    toChainId: ChainId;
    fromToken: QuoteToken;
    toToken: QuoteToken;
    fromAmount: string;
    slippage: number;
  };
  estimate: StepEstimate;
  includedSteps?: RouteStep[];
}

export interface TransactionRequest {
  to: Address;
  data: HexData;
  value: string;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId: ChainId;
}

export interface ContractCallsQuote {
  id: string;
  type: 'lifi';
  transactionRequest: TransactionRequest;
  action: {
    fromChainId: ChainId;
    toChainId: ChainId;
    fromToken: QuoteToken;
    toToken: QuoteToken;
    fromAmount: string;
    toAmount: string;
    slippage: number;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress?: Address;
    executionDuration: number;
    gasCosts?: GasCost[];
    feeCosts?: FeeCost[];
  };
  includedSteps: RouteStep[];
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  contractCalls?: ContractCall[];
}

// =============================================================================
// EXECUTION TYPES
// =============================================================================

export type ExecutionStatus =
  | 'NOT_FOUND'
  | 'PENDING'
  | 'DONE'
  | 'FAILED'
  | 'PARTIAL';

export interface StatusRequest {
  txHash: HexData;
  bridge: string;
  fromChain: ChainId;
  toChain: ChainId;
}

export interface StatusResponse {
  status: ExecutionStatus;
  substatus?: string;
  substatusMessage?: string;
  sending?: {
    txHash: HexData;
    chainId: ChainId;
    amount: string;
    token: QuoteToken;
    gasUsed?: string;
    gasPrice?: string;
  };
  receiving?: {
    txHash?: HexData;
    chainId: ChainId;
    amount?: string;
    token?: QuoteToken;
  };
  bridgeExplorerLink?: string;
  lifiExplorerLink?: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  sourceTxHash: HexData;
  destinationTxHash?: HexData;
  contractCallSucceeded: boolean;
  fallbackTriggered: boolean;
  receivedTokens?: {
    address: Address;
    amount: AmountString;
    symbol: string;
  };
  explorerLinks: {
    source: string;
    destination?: string;
    lifi?: string;
  };
  duration: number;
}

// =============================================================================
// ACTION CONFIGURATION
// =============================================================================

export interface ComposerActionBase {
  type: ComposerActionType;
  description: string;
}

export interface WrapActionConfig extends ComposerActionBase {
  type: 'wrap';
  chainId: ChainId;
  amount: AmountString;
}

export interface UnwrapActionConfig extends ComposerActionBase {
  type: 'unwrap';
  chainId: ChainId;
  amount: AmountString;
}

export interface ApproveActionConfig extends ComposerActionBase {
  type: 'approve';
  tokenAddress: Address;
  spenderAddress: Address;
  amount?: AmountString;
}

export interface StakeActionConfig extends ComposerActionBase {
  type: 'stake';
  stakingContract: Address;
  amount: AmountString;
  outputToken?: Address;
}

export interface CustomActionConfig extends ComposerActionBase {
  type: 'custom';
  contractAddress: Address;
  callData: HexData;
  gasLimit: AmountString;
  outputToken?: Address;
}

export type ComposerActionConfig =
  | WrapActionConfig
  | UnwrapActionConfig
  | ApproveActionConfig
  | StakeActionConfig
  | CustomActionConfig;

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export type WethAddresses = Record<ChainId, Address>;

export interface QuoteBuilderOptions {
  fromChain: ChainId;
  toChain: ChainId;
  fromToken: Address | string;
  toToken: Address | string;
  fromAddress: Address;
  toAmount: AmountString;
  action: ComposerActionConfig;
  slippage?: number;
  integrator?: string;
}
