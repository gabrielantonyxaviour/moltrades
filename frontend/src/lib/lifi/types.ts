// LI.FI type definitions for Moltrades
// Enhanced with Composer types from scripts

export type ChainId = number;
export type Address = `0x${string}`;
export type HexData = `0x${string}`;
export type AmountString = string;

// =============================================================================
// TOKEN AND CHAIN TYPES
// =============================================================================

export interface Token {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  chainId: ChainId;
  logoURI?: string;
  priceUSD?: string;
}

export interface Chain {
  id: ChainId;
  name: string;
  logoURI?: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
}

// =============================================================================
// FLOW TYPES
// =============================================================================

export type StepType = "input" | "bridge" | "swap" | "deposit" | "output";

export interface FlowStep {
  id: string;
  type: StepType;
  data: InputStepData | BridgeStepData | SwapStepData | DepositStepData | OutputStepData;
}

export interface InputStepData {
  label: string;
  token: string;
  amount: string;
  usdValue?: string;
  chain: string;
  walletAddress?: string;
}

export interface BridgeStepData {
  label: string;
  fromChain: string;
  toChain: string;
  provider: string;
  estimatedTime?: string;
  fee?: string;
  status?: NodeStatus;
}

export interface SwapStepData {
  label: string;
  fromToken: string;
  toToken: string;
  fromAmount?: string;
  toAmount?: string;
  dex: string;
  rate?: string;
  priceImpact?: string;
  status?: NodeStatus;
}

export interface DepositStepData {
  label: string;
  protocol: string;
  token: string;
  amount?: string;
  apy?: string;
  receiveToken?: string;
  status?: NodeStatus;
}

export interface OutputStepData {
  label: string;
  token: string;
  amount?: string;
  usdValue?: string;
  chain: string;
}

// =============================================================================
// PARSED INTENT TYPES
// =============================================================================

export interface ParsedIntent {
  action: "bridge" | "swap" | "deposit" | "complex";
  fromToken?: string;
  toToken?: string;
  amount?: string;
  fromChain?: string;
  toChain?: string;
  protocol?: string;
  description: string;
}

export interface PhaseIntent extends ParsedIntent {
  phase: number;
}

export interface MultiPhaseRoute {
  phases: PhaseIntent[];
  description: string;
}

export interface PhaseResult {
  phase: number;
  txHash?: string;
  status: "complete" | "error";
  error?: string;
}

// =============================================================================
// EXECUTION TYPES
// =============================================================================

export type NodeStatus = "idle" | "pending" | "executing" | "complete" | "error";
export type ExecutionStatus = "NOT_FOUND" | "PENDING" | "DONE" | "FAILED" | "PARTIAL";

export interface ExecutionStep {
  stepId: string;
  status: NodeStatus;
  txHash?: string;
  message?: string;
}

export interface RouteInfo {
  totalSteps: number;
  estimatedTime: string;
  estimatedGas: string;
  estimatedOutput: string;
}

// =============================================================================
// CONTRACT CALL TYPES (from Composer)
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

export interface ContractCallConfig {
  toContractAddress: Address;
  toContractCallData: HexData;
  toContractGasLimit: AmountString;
  contractOutputsToken?: Address;
}

// =============================================================================
// QUOTE TYPES
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
  type: "swap" | "bridge" | "cross" | "protocol" | "custom";
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

export interface ComposerQuote {
  id: string;
  type: "lifi";
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
// STATUS TYPES
// =============================================================================

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
// PROTOCOL TYPES
// =============================================================================

export interface ProtocolInfo {
  id: string;
  name: string;
  type: "lending" | "staking" | "vault" | "liquid-staking" | "dex" | "wrap";
  chains: ChainId[];
  description: string;
  depositOnly?: boolean;
}

export interface ProtocolDeployment {
  protocolId: string;
  chainId: ChainId;
  depositContract: Address;
  depositFunction: string;
  inputToken: Address;
  inputTokenSymbol: string;
  outputToken: Address;
  outputTokenSymbol: string;
  gasLimit: string;
  requiresApproval: boolean;
  approvalTarget?: Address;
}

// =============================================================================
// EXECUTION STATE
// =============================================================================

export interface ExecutionState {
  status: "idle" | "executing" | "complete" | "error";
  currentStepId: string | null;
  logs: ExecutionLog[];
  sourceTxHash?: string;
  destinationTxHash?: string;
}

export interface ExecutionLog {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error";
}

// =============================================================================
// CALLBACKS
// =============================================================================

export interface ExecutionCallbacks {
  onTxSubmitted?: (txHash: string) => void;
  onTxConfirmed?: (txHash: string, receipt: { gasUsed: bigint; status: string }) => void;
  onBridgeProgress?: (status: string, progress: number) => void;
  onStepUpdate?: (stepId: string, status: NodeStatus) => void;
  onError?: (error: Error) => void;
}
