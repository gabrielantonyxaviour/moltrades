/**
 * Protocol Registry for LI.FI Composer Integration
 *
 * Registry of DeFi protocols supported on Base (8453) and Arbitrum (42161)
 * with their deposit contract addresses, ABIs, and vault token info.
 */

import { encodeFunctionData, parseAbi } from 'viem';
import type { Address, HexData, AmountString, ChainId } from './types';
import type { ContractCallConfig } from './actions';

// =============================================================================
// PROTOCOL TYPES
// =============================================================================

export interface ProtocolInfo {
  id: string;
  name: string;
  type: 'lending' | 'staking' | 'vault' | 'liquid-staking' | 'dex';
  chains: ChainId[];
  description: string;
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
  approvalTarget?: Address; // if different from depositContract
}

// =============================================================================
// ABIs
// =============================================================================

const AAVE_V3_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
]);

const ERC4626_ABI = parseAbi([
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function mint(uint256 shares, address receiver) returns (uint256)',
]);

const WSTETH_ABI = parseAbi([
  'function wrap(uint256 _stETHAmount) returns (uint256)',
]);

const COMPOUND_V3_ABI = parseAbi([
  'function supply(address asset, uint256 amount)',
]);

const MOONWELL_ABI = parseAbi([
  'function mint(uint256 mintAmount) returns (uint256)',
]);

const WETH_ABI = parseAbi([
  'function deposit() payable',
]);

// =============================================================================
// PROTOCOL DEFINITIONS
// =============================================================================

export const PROTOCOLS: ProtocolInfo[] = [
  {
    id: 'weth-wrap',
    name: 'WETH Wrap',
    type: 'staking',
    chains: [8453, 42161],
    description: 'Wrap ETH to WETH',
  },
  {
    id: 'lido-wsteth',
    name: 'Lido wstETH',
    type: 'liquid-staking',
    chains: [8453, 42161],
    description: 'Wrap stETH to wstETH (liquid staking derivative)',
  },
  {
    id: 'etherfi-weeth',
    name: 'EtherFi weETH',
    type: 'liquid-staking',
    chains: [8453, 42161],
    description: 'Wrap eETH to weETH (ERC4626 liquid staking)',
  },
  {
    id: 'aave-v3',
    name: 'Aave V3',
    type: 'lending',
    chains: [8453, 42161],
    description: 'Supply assets to Aave V3 lending pools',
  },
  {
    id: 'ethena-susde',
    name: 'Ethena sUSDe',
    type: 'vault',
    chains: [8453, 42161],
    description: 'Stake USDe to sUSDe (ERC4626 vault)',
  },
  {
    id: 'morpho-usdc',
    name: 'Morpho USDC Vault',
    type: 'vault',
    chains: [8453],
    description: 'Deposit USDC into Morpho vault on Base',
  },
  {
    id: 'morpho-weth',
    name: 'Morpho WETH Vault',
    type: 'vault',
    chains: [8453],
    description: 'Deposit WETH into Morpho vault on Base',
  },
  {
    id: 'compound-v3-usdc',
    name: 'Compound V3 USDC',
    type: 'lending',
    chains: [8453, 42161],
    description: 'Supply USDC to Compound V3',
  },
  {
    id: 'compound-v3-weth',
    name: 'Compound V3 WETH',
    type: 'lending',
    chains: [8453],
    description: 'Supply WETH to Compound V3 on Base',
  },
  {
    id: 'moonwell-usdc',
    name: 'Moonwell USDC',
    type: 'lending',
    chains: [8453],
    description: 'Supply USDC to Moonwell on Base',
  },
  {
    id: 'moonwell-weth',
    name: 'Moonwell WETH',
    type: 'lending',
    chains: [8453],
    description: 'Supply WETH to Moonwell on Base',
  },
  {
    id: 'aave-v3-usdc',
    name: 'Aave V3 USDC',
    type: 'lending',
    chains: [8453, 42161],
    description: 'Supply USDC to Aave V3',
  },
  {
    id: 'aave-v3-weth',
    name: 'Aave V3 WETH',
    type: 'lending',
    chains: [8453, 42161],
    description: 'Supply WETH to Aave V3',
  },
];

// =============================================================================
// TOKEN ADDRESSES
// =============================================================================

const TOKENS: Record<ChainId, Record<string, Address>> = {
  8453: {
    // Base
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    wstETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    stETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', // wstETH on L2 (no native stETH)
    weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
    eETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A', // weETH on L2
    USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    sUSDe: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    // Aave aTokens
    aUSDC: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    aWETH: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7',
  },
  42161: {
    // Arbitrum
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDC.e': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    wstETH: '0x5979D7b546E38E9Ab8b54bdeFC1E7d8E7cEe4fd5',
    weETH: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
    USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    sUSDe: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    // Aave aTokens
    aUSDC: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
    aWETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
  },
};

// =============================================================================
// PROTOCOL DEPLOYMENTS
// =============================================================================

export const DEPLOYMENTS: ProtocolDeployment[] = [
  // --- WETH Wrap ---
  {
    protocolId: 'weth-wrap',
    chainId: 8453,
    depositContract: '0x4200000000000000000000000000000000000006',
    depositFunction: 'deposit()',
    inputToken: '0x0000000000000000000000000000000000000000',
    inputTokenSymbol: 'ETH',
    outputToken: '0x4200000000000000000000000000000000000006',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },
  {
    protocolId: 'weth-wrap',
    chainId: 42161,
    depositContract: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    depositFunction: 'deposit()',
    inputToken: '0x0000000000000000000000000000000000000000',
    inputTokenSymbol: 'ETH',
    outputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },

  // --- Aave V3 USDC ---
  {
    protocolId: 'aave-v3-usdc',
    chainId: 8453,
    depositContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    outputTokenSymbol: 'aBasUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: 42161,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    inputTokenSymbol: 'USDC',
    outputToken: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
    outputTokenSymbol: 'aArbUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Aave V3 WETH ---
  {
    protocolId: 'aave-v3-weth',
    chainId: 8453,
    depositContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7',
    outputTokenSymbol: 'aBasWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: 42161,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    inputTokenSymbol: 'WETH',
    outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    outputTokenSymbol: 'aArbWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Ethena sUSDe (ERC4626) ---
  {
    protocolId: 'ethena-susde',
    chainId: 8453,
    depositContract: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    inputTokenSymbol: 'USDe',
    outputToken: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    outputTokenSymbol: 'sUSDe',
    gasLimit: '200000',
    requiresApproval: true,
  },
  {
    protocolId: 'ethena-susde',
    chainId: 42161,
    depositContract: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    inputTokenSymbol: 'USDe',
    outputToken: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    outputTokenSymbol: 'sUSDe',
    gasLimit: '200000',
    requiresApproval: true,
  },

  // --- Morpho USDC Vault (Base) ---
  {
    protocolId: 'morpho-usdc',
    chainId: 8453,
    depositContract: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',
    outputTokenSymbol: 'spUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Morpho WETH Vault (Base) ---
  {
    protocolId: 'morpho-weth',
    chainId: 8453,
    depositContract: '0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x27D8c7273fd3fcC6956a0B370cE5Fd4A7fc65c18',
    outputTokenSymbol: 'smWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Compound V3 USDC ---
  {
    protocolId: 'compound-v3-usdc',
    chainId: 8453,
    depositContract: '0xb125E6687d4313864e53df431d5425969c15Eb2F',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0xb125E6687d4313864e53df431d5425969c15Eb2F',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-usdc',
    chainId: 42161,
    depositContract: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    inputTokenSymbol: 'USDC',
    outputToken: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Compound V3 WETH (Base) ---
  {
    protocolId: 'compound-v3-weth',
    chainId: 8453,
    depositContract: '0x46e6b214b524310239732D51387075E0e70970bf',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x46e6b214b524310239732D51387075E0e70970bf',
    outputTokenSymbol: 'cWETHv3',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Moonwell USDC (Base) ---
  {
    protocolId: 'moonwell-usdc',
    chainId: 8453,
    depositContract: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22',
    depositFunction: 'mint(uint256)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22',
    outputTokenSymbol: 'mUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // --- Moonwell WETH (Base) ---
  {
    protocolId: 'moonwell-weth',
    chainId: 8453,
    depositContract: '0x628ff693426583D9a7FB391E54366292F509D457',
    depositFunction: 'mint(uint256)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x628ff693426583D9a7FB391E54366292F509D457',
    outputTokenSymbol: 'mWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
];

// =============================================================================
// ACTION GENERATORS PER PROTOCOL
// =============================================================================

export function generateProtocolAction(
  deployment: ProtocolDeployment,
  amount: AmountString,
  userAddress: Address
): ContractCallConfig {
  const { protocolId, depositContract, inputToken, outputToken, gasLimit } = deployment;

  // WETH wrap - special case, payable function
  if (protocolId === 'weth-wrap') {
    const callData = encodeFunctionData({
      abi: WETH_ABI,
      functionName: 'deposit',
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Aave V3 supply - use exact amount (LI.FI guarantees >= toAmount arrives)
  if (protocolId.startsWith('aave-v3')) {
    const callData = encodeFunctionData({
      abi: AAVE_V3_ABI,
      functionName: 'supply',
      args: [inputToken, BigInt(amount), userAddress, 0],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // ERC4626 vaults (Ethena sUSDe, Morpho, EtherFi weETH)
  if (['ethena-susde', 'morpho-usdc', 'morpho-weth', 'etherfi-weeth'].includes(protocolId)) {
    const callData = encodeFunctionData({
      abi: ERC4626_ABI,
      functionName: 'deposit',
      args: [BigInt(amount), userAddress],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Compound V3 supply - use exact amount
  if (protocolId.startsWith('compound-v3')) {
    const callData = encodeFunctionData({
      abi: COMPOUND_V3_ABI,
      functionName: 'supply',
      args: [inputToken, BigInt(amount)],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Moonwell mint - use exact amount
  if (protocolId.startsWith('moonwell')) {
    const callData = encodeFunctionData({
      abi: MOONWELL_ABI,
      functionName: 'mint',
      args: [BigInt(amount)],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Lido wstETH wrap
  if (protocolId === 'lido-wsteth') {
    const callData = encodeFunctionData({
      abi: WSTETH_ABI,
      functionName: 'wrap',
      args: [BigInt(amount)],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  throw new Error(`Unknown protocol: ${protocolId}`);
}

// =============================================================================
// HELPERS
// =============================================================================

export function getDeploymentsForChain(chainId: ChainId): ProtocolDeployment[] {
  return DEPLOYMENTS.filter((d) => d.chainId === chainId);
}

export function getDeployment(protocolId: string, chainId: ChainId): ProtocolDeployment | undefined {
  return DEPLOYMENTS.find((d) => d.protocolId === protocolId && d.chainId === chainId);
}

export function getProtocol(protocolId: string): ProtocolInfo | undefined {
  return PROTOCOLS.find((p) => p.id === protocolId);
}

export function getAllDeployments(): ProtocolDeployment[] {
  return DEPLOYMENTS;
}

export function getTokenAddress(chainId: ChainId, symbol: string): Address | undefined {
  return TOKENS[chainId]?.[symbol];
}
// Protocol types: aave_v3, compound_v3, moonwell, morpho_vault, erc4626, weth_wrap
