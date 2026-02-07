/**
 * LI.FI Composer Action Generators (MCP Server)
 */

import { encodeFunctionData, parseAbi, maxUint256 } from 'viem';
import type {
  ContractCall,
  ContractCallConfig,
  Address,
  AmountString,
  ChainId,
  HexData,
} from './types.js';

const WETH_ABI = parseAbi([
  'function deposit() payable',
  'function withdraw(uint256 wad)',
]);

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
]);

export const WETH_ADDRESSES: Record<ChainId, Address> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  10: '0x4200000000000000000000000000000000000006',
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
  100: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
  130: '0x4200000000000000000000000000000000000006',
  137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  8453: '0x4200000000000000000000000000000000000006',
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  43114: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', // WETH.e on Avalanche
  59144: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
  534352: '0x5300000000000000000000000000000000000004',
};

export const NATIVE_TOKEN_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

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

export function generateCustomAction(
  contractAddress: Address,
  abi: readonly unknown[],
  functionName: string,
  args: unknown[],
  gasLimit?: AmountString,
  outputToken?: Address
): ContractCallConfig {
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
