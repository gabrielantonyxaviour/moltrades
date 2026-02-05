/**
 * LI.FI Composer Action Generators
 *
 * Functions to generate contract call data for common DeFi actions.
 * Trimmed to Base (8453) + Arbitrum (42161) only.
 */

import { encodeFunctionData, parseAbi, maxUint256 } from 'viem';
import type {
  ContractCall,
  Address,
  AmountString,
  ChainId,
  HexData,
} from './types';

// =============================================================================
// ABIs
// =============================================================================

const WETH_ABI = parseAbi([
  'function deposit() payable',
  'function withdraw(uint256 wad)',
]);

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

// =============================================================================
// KNOWN WETH ADDRESSES (Base + Arbitrum only)
// =============================================================================

export const WETH_ADDRESSES: Record<ChainId, Address> = {
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum
  8453: '0x4200000000000000000000000000000000000006',  // Base
};

export const NATIVE_TOKEN_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

// =============================================================================
// CONTRACT CALL CONFIG TYPE
// =============================================================================

export interface ContractCallConfig {
  toContractAddress: Address;
  toContractCallData: HexData;
  toContractGasLimit: AmountString;
  contractOutputsToken?: Address;
}

// =============================================================================
// ACTION GENERATORS
// =============================================================================

export function generateWrapAction(
  chainId: ChainId,
  _amount: AmountString
): ContractCallConfig {
  const wethAddress = WETH_ADDRESSES[chainId];
  if (!wethAddress) {
    throw new Error(`WETH address not found for chain ID: ${chainId}`);
  }

  const callData = encodeFunctionData({
    abi: WETH_ABI,
    functionName: 'deposit',
  }) as HexData;

  return {
    toContractAddress: wethAddress,
    toContractCallData: callData,
    toContractGasLimit: '50000',
    contractOutputsToken: wethAddress,
  };
}

export function generateUnwrapAction(
  chainId: ChainId,
  amount: AmountString
): ContractCallConfig {
  const wethAddress = WETH_ADDRESSES[chainId];
  if (!wethAddress) {
    throw new Error(`WETH address not found for chain ID: ${chainId}`);
  }

  const callData = encodeFunctionData({
    abi: WETH_ABI,
    functionName: 'withdraw',
    args: [BigInt(amount)],
  }) as HexData;

  return {
    toContractAddress: wethAddress,
    toContractCallData: callData,
    toContractGasLimit: '50000',
  };
}

export function generateApproveAction(
  tokenAddress: Address,
  spenderAddress: Address,
  amount?: AmountString
): ContractCallConfig {
  if (!tokenAddress || tokenAddress === NATIVE_TOKEN_ADDRESS) {
    throw new Error('Cannot approve native token (ETH)');
  }
  if (!spenderAddress) {
    throw new Error('Spender address is required');
  }

  const approvalAmount = amount ? BigInt(amount) : maxUint256;
  const callData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spenderAddress, approvalAmount],
  }) as HexData;

  return {
    toContractAddress: tokenAddress,
    toContractCallData: callData,
    toContractGasLimit: '60000',
  };
}

export function generateTransferAction(
  tokenAddress: Address,
  recipientAddress: Address,
  amount: AmountString
): ContractCallConfig {
  if (!tokenAddress || tokenAddress === NATIVE_TOKEN_ADDRESS) {
    throw new Error('Cannot transfer native token via this method');
  }
  if (!recipientAddress) {
    throw new Error('Recipient address is required');
  }
  if (!amount || amount === '0') {
    throw new Error('Transfer amount must be greater than 0');
  }

  const callData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipientAddress, BigInt(amount)],
  }) as HexData;

  return {
    toContractAddress: tokenAddress,
    toContractCallData: callData,
    toContractGasLimit: '70000',
  };
}

export function generateCustomAction(
  contractAddress: Address,
  abi: readonly unknown[],
  functionName: string,
  args: unknown[],
  gasLimit?: AmountString,
  outputToken?: Address
): ContractCallConfig {
  if (!contractAddress) {
    throw new Error('Contract address is required');
  }
  if (!abi || abi.length === 0) {
    throw new Error('ABI is required for custom action');
  }
  if (!functionName) {
    throw new Error('Function name is required');
  }

  const callData = encodeFunctionData({
    abi: abi as readonly { name: string; type: string; inputs?: readonly { name: string; type: string }[] }[],
    functionName,
    args,
  }) as HexData;

  return {
    toContractAddress: contractAddress,
    toContractCallData: callData,
    toContractGasLimit: gasLimit || '200000',
    contractOutputsToken: outputToken,
  };
}

export function generateRawAction(
  contractAddress: Address,
  callData: HexData,
  gasLimit: AmountString,
  outputToken?: Address
): ContractCallConfig {
  if (!contractAddress) {
    throw new Error('Contract address is required');
  }
  if (!callData || !callData.startsWith('0x')) {
    throw new Error('Valid calldata (0x-prefixed hex) is required');
  }
  if (!gasLimit || gasLimit === '0') {
    throw new Error('Gas limit is required');
  }

  return {
    toContractAddress: contractAddress,
    toContractCallData: callData,
    toContractGasLimit: gasLimit,
    contractOutputsToken: outputToken,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

export function toContractCall(
  config: ContractCallConfig,
  fromAmount: AmountString,
  fromTokenAddress: Address
): ContractCall {
  return {
    fromAmount,
    fromTokenAddress,
    toContractAddress: config.toContractAddress,
    toContractCallData: config.toContractCallData,
    toContractGasLimit: config.toContractGasLimit,
    contractOutputsToken: config.contractOutputsToken,
  };
}

export function getWethAddress(chainId: ChainId): Address | undefined {
  return WETH_ADDRESSES[chainId];
}

export function hasWethSupport(chainId: ChainId): boolean {
  return chainId in WETH_ADDRESSES;
}
// Supported actions: wrap, approve, deposit (Aave supply, Compound supply, Moonwell mint, ERC4626 deposit)
