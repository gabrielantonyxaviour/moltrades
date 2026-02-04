// LI.FI type definitions for Moltrades

export type ChainId = number;
export type Address = `0x${string}`;

export interface Token {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  chainId: ChainId;
  logoURI?: string;
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
}

export interface DepositStepData {
  label: string;
  protocol: string;
  token: string;
  amount?: string;
  apy?: string;
  receiveToken?: string;
}

export interface OutputStepData {
  label: string;
  token: string;
  amount?: string;
  usdValue?: string;
  chain: string;
}

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

export interface ExecutionStep {
  stepId: string;
  status: "pending" | "executing" | "complete" | "error";
  txHash?: string;
  message?: string;
}

export interface RouteInfo {
  totalSteps: number;
  estimatedTime: string;
  estimatedGas: string;
  estimatedOutput: string;
}
