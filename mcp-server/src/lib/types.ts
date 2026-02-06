/**
 * LI.FI Composer TypeScript Interfaces
 * Adapted for MCP server usage.
 */

export type ComposerActionType = 'wrap' | 'unwrap' | 'approve' | 'stake' | 'custom';
export type ChainId = number;
export type Address = `0x${string}`;
export type HexData = `0x${string}`;
export type AmountString = string;

export interface ContractCall {
  fromAmount: AmountString;
  fromTokenAddress: Address;
  toContractAddress: Address;
  toContractCallData: HexData;
  toContractGasLimit: AmountString;
  toApprovalAddress?: Address;
  contractOutputsToken?: Address;
}

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

export interface ContractCallConfig {
  toContractAddress: Address;
  toContractCallData: HexData;
  toContractGasLimit: AmountString;
  contractOutputsToken?: Address;
}
