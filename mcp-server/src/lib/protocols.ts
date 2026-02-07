/**
 * Protocol Registry for LI.FI Composer (MCP Server)
 */

import { encodeFunctionData, parseAbi } from 'viem';
import type { Address, HexData, AmountString, ChainId, ContractCallConfig } from './types.js';

export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BSC: 56,
  GNOSIS: 100,
  UNICHAIN: 130,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  LINEA: 59144,
  SCROLL: 534352,
} as const;

// Unichain Mainnet Contract Addresses
export const UNICHAIN_CONTRACTS = {
  // Uniswap v4 Core
  POOL_MANAGER: '0x1F98400000000000000000000000000000000004' as const,
  POSITION_MANAGER: '0x4529A01c7A0410167c5740C487A8DE60232617bf' as const,
  QUOTER: '0x333E3C607B141b18fF6de9f258db6e77fE7491E0' as const,
  STATE_VIEW: '0x86e8631A016F9068C3f085fAF484Ee3F5fDee8f2' as const,
  UNIVERSAL_ROUTER: '0xEf740bf23aCaE26f6492B10de645D6B98dC8Eaf3' as const,
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const,
  // Tokens
  WETH: '0x4200000000000000000000000000000000000006' as const,
  USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6' as const,
  USDT: '0x9151434b16b9763660705744891fA906F660EcC5' as const,
  UNI: '0x8f187aA05619a017077f5308904739877ce9eA21' as const,
  WSTETH: '0xc02fE7317D4eb8753a02c35fe019786854A92001' as const,
  USDS: '0x7E10036Acc4B56d4dFCa3b77810356CE52313F9C' as const,
} as const;

export interface ProtocolInfo {
  id: string;
  name: string;
  type: 'lending' | 'staking' | 'vault' | 'liquid-staking' | 'dex' | 'wrap' | 'swap';
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
}

const AAVE_V3_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
]);

const ERC4626_ABI = parseAbi([
  'function deposit(uint256 assets, address receiver) returns (uint256)',
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

export const PROTOCOLS: ProtocolInfo[] = [
  { id: 'uniswap-v4', name: 'Uniswap V4', type: 'swap', chains: [130], description: 'Swap tokens via Uniswap V4 on Unichain' },
  { id: 'weth-wrap', name: 'WETH Wrap', type: 'wrap', chains: [1, 42161, 8453, 10, 137, 59144, 534352, 100, 130], description: 'Wrap ETH to WETH' },
  { id: 'lido-wsteth', name: 'Lido wstETH', type: 'liquid-staking', chains: [1], description: 'Wrap stETH to wstETH' },
  { id: 'etherfi-weeth', name: 'EtherFi weETH', type: 'liquid-staking', chains: [1], description: 'Wrap eETH to weETH' },
  { id: 'aave-v3-weth', name: 'Aave V3 WETH', type: 'lending', chains: [1, 42161, 8453, 10, 137, 56, 43114, 534352, 100], description: 'Supply WETH to Aave V3' },
  { id: 'aave-v3-usdc', name: 'Aave V3 USDC', type: 'lending', chains: [1, 42161, 8453, 10, 137, 56, 43114, 534352, 100], description: 'Supply USDC to Aave V3' },
  { id: 'aave-v3-usdt', name: 'Aave V3 USDT', type: 'lending', chains: [1, 42161, 10, 137, 56, 43114], description: 'Supply USDT to Aave V3' },
  { id: 'aave-v3-dai', name: 'Aave V3 DAI', type: 'lending', chains: [1, 42161, 10, 137, 43114], description: 'Supply DAI to Aave V3' },
  { id: 'ethena-susde', name: 'Ethena sUSDe', type: 'staking', chains: [1, 42161, 8453], description: 'Stake USDe to sUSDe' },
  { id: 'morpho-usdc', name: 'Morpho USDC Vault', type: 'vault', chains: [1, 8453], description: 'Deposit USDC into Morpho vault' },
  { id: 'morpho-weth', name: 'Morpho WETH Vault', type: 'vault', chains: [1, 8453], description: 'Deposit WETH into Morpho vault' },
  { id: 'compound-v3-usdc', name: 'Compound V3 USDC', type: 'lending', chains: [1, 42161, 8453, 10, 137, 534352], description: 'Supply USDC to Compound V3' },
  { id: 'compound-v3-weth', name: 'Compound V3 WETH', type: 'lending', chains: [1, 42161, 8453, 10], description: 'Supply WETH to Compound V3' },
  { id: 'seamless-weth', name: 'Seamless WETH', type: 'lending', chains: [8453], description: 'Supply WETH to Seamless on Base' },
  { id: 'seamless-usdc', name: 'Seamless USDC', type: 'lending', chains: [8453], description: 'Supply USDC to Seamless on Base' },
  { id: 'moonwell-weth', name: 'Moonwell WETH', type: 'lending', chains: [8453, 10], description: 'Supply WETH to Moonwell' },
  { id: 'moonwell-usdc', name: 'Moonwell USDC', type: 'lending', chains: [8453, 10], description: 'Supply USDC to Moonwell' },
];

export const DEPLOYMENTS: ProtocolDeployment[] = [
  // WETH WRAP
  { protocolId: 'weth-wrap', chainId: 1, depositContract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },
  { protocolId: 'weth-wrap', chainId: 42161, depositContract: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },
  { protocolId: 'weth-wrap', chainId: 8453, depositContract: '0x4200000000000000000000000000000000000006' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0x4200000000000000000000000000000000000006' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },
  { protocolId: 'weth-wrap', chainId: 10, depositContract: '0x4200000000000000000000000000000000000006' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0x4200000000000000000000000000000000000006' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },
  { protocolId: 'weth-wrap', chainId: 59144, depositContract: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },
  { protocolId: 'weth-wrap', chainId: 534352, depositContract: '0x5300000000000000000000000000000000000004' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0x5300000000000000000000000000000000000004' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },
  { protocolId: 'weth-wrap', chainId: 130, depositContract: '0x4200000000000000000000000000000000000006' as Address, depositFunction: 'deposit()', inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, inputTokenSymbol: 'ETH', outputToken: '0x4200000000000000000000000000000000000006' as Address, outputTokenSymbol: 'WETH', gasLimit: '50000', requiresApproval: false },

  // AAVE V3 WETH
  { protocolId: 'aave-v3-weth', chainId: 1, depositContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, inputTokenSymbol: 'WETH', outputToken: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8' as Address, outputTokenSymbol: 'aEthWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-weth', chainId: 42161, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address, inputTokenSymbol: 'WETH', outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address, outputTokenSymbol: 'aArbWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-weth', chainId: 8453, depositContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7' as Address, outputTokenSymbol: 'aBasWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-weth', chainId: 10, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address, outputTokenSymbol: 'aOptWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-weth', chainId: 137, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' as Address, inputTokenSymbol: 'WETH', outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address, outputTokenSymbol: 'aPolWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-weth', chainId: 534352, depositContract: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x5300000000000000000000000000000000000004' as Address, inputTokenSymbol: 'WETH', outputToken: '0xf301805bE1Df81102C957f6d4Ce29d2B8c056B2a' as Address, outputTokenSymbol: 'aScrWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-weth', chainId: 100, depositContract: '0xb50201558B00496A145fE76f7424749556E326D8' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1' as Address, inputTokenSymbol: 'WETH', outputToken: '0xa818F1B57c201E092C4A2017A91815034326Efd1' as Address, outputTokenSymbol: 'aGnoWETH', gasLimit: '300000', requiresApproval: true },

  // AAVE V3 USDC
  { protocolId: 'aave-v3-usdc', chainId: 1, depositContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address, inputTokenSymbol: 'USDC', outputToken: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c' as Address, outputTokenSymbol: 'aEthUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 42161, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address, inputTokenSymbol: 'USDC', outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address, outputTokenSymbol: 'aArbUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 8453, depositContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, inputTokenSymbol: 'USDC', outputToken: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB' as Address, outputTokenSymbol: 'aBasUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 10, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address, inputTokenSymbol: 'USDC', outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address, outputTokenSymbol: 'aOptUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 137, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address, inputTokenSymbol: 'USDC', outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address, outputTokenSymbol: 'aPolUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 56, depositContract: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address, inputTokenSymbol: 'USDC', outputToken: '0x00901a076785e0906d1028c7d6372d247bec7d61' as Address, outputTokenSymbol: 'aBnbUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 43114, depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as Address, inputTokenSymbol: 'USDC', outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address, outputTokenSymbol: 'aAvaUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 534352, depositContract: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4' as Address, inputTokenSymbol: 'USDC', outputToken: '0x1D738a3436A8C49CefFbaB7fbF04B660fb528CbD' as Address, outputTokenSymbol: 'aScrUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'aave-v3-usdc', chainId: 100, depositContract: '0xb50201558B00496A145fE76f7424749556E326D8' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83' as Address, inputTokenSymbol: 'USDC', outputToken: '0xc6B7AcA6DE8a6044E0e32d0c841a89244A10D284' as Address, outputTokenSymbol: 'aGnoUSDC', gasLimit: '300000', requiresApproval: true },

  // LIDO wstETH
  { protocolId: 'lido-wsteth', chainId: 1, depositContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address, depositFunction: 'wrap(uint256)', inputToken: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as Address, inputTokenSymbol: 'stETH', outputToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address, outputTokenSymbol: 'wstETH', gasLimit: '100000', requiresApproval: true },

  // ETHERFI weETH
  { protocolId: 'etherfi-weeth', chainId: 1, depositContract: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0x35fA164735182de50811E8e2E824cFb9B6118ac2' as Address, inputTokenSymbol: 'eETH', outputToken: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee' as Address, outputTokenSymbol: 'weETH', gasLimit: '150000', requiresApproval: true },

  // ETHENA sUSDe
  { protocolId: 'ethena-susde', chainId: 1, depositContract: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3' as Address, inputTokenSymbol: 'USDe', outputToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497' as Address, outputTokenSymbol: 'sUSDe', gasLimit: '200000', requiresApproval: true },
  { protocolId: 'ethena-susde', chainId: 42161, depositContract: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address, inputTokenSymbol: 'USDe', outputToken: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address, outputTokenSymbol: 'sUSDe', gasLimit: '200000', requiresApproval: true },
  { protocolId: 'ethena-susde', chainId: 8453, depositContract: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address, inputTokenSymbol: 'USDe', outputToken: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address, outputTokenSymbol: 'sUSDe', gasLimit: '200000', requiresApproval: true },

  // MORPHO USDC
  { protocolId: 'morpho-usdc', chainId: 1, depositContract: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address, inputTokenSymbol: 'USDC', outputToken: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB' as Address, outputTokenSymbol: 'steakUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'morpho-usdc', chainId: 8453, depositContract: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, inputTokenSymbol: 'USDC', outputToken: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A' as Address, outputTokenSymbol: 'spUSDC', gasLimit: '300000', requiresApproval: true },

  // MORPHO WETH
  { protocolId: 'morpho-weth', chainId: 1, depositContract: '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, inputTokenSymbol: 'WETH', outputToken: '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0' as Address, outputTokenSymbol: 're7WETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'morpho-weth', chainId: 8453, depositContract: '0x9eA49b9a8f82d8E38C4E5ED7339c0c79b4639a92' as Address, depositFunction: 'deposit(uint256,address)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0x9eA49b9a8f82d8E38C4E5ED7339c0c79b4639a92' as Address, outputTokenSymbol: 'spWETH', gasLimit: '300000', requiresApproval: true },

  // COMPOUND V3 USDC
  { protocolId: 'compound-v3-usdc', chainId: 1, depositContract: '0xc3d688B66703497DAA19211EEdff47f25384cdc3' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address, inputTokenSymbol: 'USDC', outputToken: '0xc3d688B66703497DAA19211EEdff47f25384cdc3' as Address, outputTokenSymbol: 'cUSDCv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-usdc', chainId: 42161, depositContract: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address, inputTokenSymbol: 'USDC', outputToken: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Address, outputTokenSymbol: 'cUSDCv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-usdc', chainId: 8453, depositContract: '0xb125E6687d4313864e53df431d5425969c15Eb2F' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, inputTokenSymbol: 'USDC', outputToken: '0xb125E6687d4313864e53df431d5425969c15Eb2F' as Address, outputTokenSymbol: 'cUSDCv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-usdc', chainId: 10, depositContract: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address, inputTokenSymbol: 'USDC', outputToken: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB' as Address, outputTokenSymbol: 'cUSDCv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-usdc', chainId: 137, depositContract: '0xF25212E676D1F7F89Cd72fFEe66158f541246445' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address, inputTokenSymbol: 'USDC', outputToken: '0xF25212E676D1F7F89Cd72fFEe66158f541246445' as Address, outputTokenSymbol: 'cUSDCv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-usdc', chainId: 534352, depositContract: '0xB2f97C1bD3bF02f5E74D13F9C178Bc6E8Ee17dd6' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4' as Address, inputTokenSymbol: 'USDC', outputToken: '0xB2f97C1bD3bF02f5E74D13F9C178Bc6E8Ee17dd6' as Address, outputTokenSymbol: 'cUSDCv3', gasLimit: '300000', requiresApproval: true },

  // COMPOUND V3 WETH
  { protocolId: 'compound-v3-weth', chainId: 1, depositContract: '0xA17581A9E3356d9A858b789D68B4d866e593aE94' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, inputTokenSymbol: 'WETH', outputToken: '0xA17581A9E3356d9A858b789D68B4d866e593aE94' as Address, outputTokenSymbol: 'cWETHv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-weth', chainId: 42161, depositContract: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address, inputTokenSymbol: 'WETH', outputToken: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486' as Address, outputTokenSymbol: 'cWETHv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-weth', chainId: 8453, depositContract: '0x46e6b214b524310239732D51387075E0e70970bf' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0x46e6b214b524310239732D51387075E0e70970bf' as Address, outputTokenSymbol: 'cWETHv3', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'compound-v3-weth', chainId: 10, depositContract: '0xE36A30D249f7761327fd973001A32010b521b6Fd' as Address, depositFunction: 'supply(address,uint256)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0xE36A30D249f7761327fd973001A32010b521b6Fd' as Address, outputTokenSymbol: 'cWETHv3', gasLimit: '300000', requiresApproval: true },

  // SEAMLESS
  { protocolId: 'seamless-weth', chainId: 8453, depositContract: '0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0x48bf8fCd44e2977c8a9A744658431A8e6C0d866c' as Address, outputTokenSymbol: 'sWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'seamless-usdc', chainId: 8453, depositContract: '0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7' as Address, depositFunction: 'supply(address,uint256,address,uint16)', inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, inputTokenSymbol: 'USDC', outputToken: '0x53E240C0F985175dA046A62F26D490d1E259036e' as Address, outputTokenSymbol: 'sUSDC', gasLimit: '300000', requiresApproval: true },

  // MOONWELL
  { protocolId: 'moonwell-weth', chainId: 8453, depositContract: '0x628ff693426583D9a7FB391E54366292F509D457' as Address, depositFunction: 'mint(uint256)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0x628ff693426583D9a7FB391E54366292F509D457' as Address, outputTokenSymbol: 'mWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'moonwell-usdc', chainId: 8453, depositContract: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22' as Address, depositFunction: 'mint(uint256)', inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, inputTokenSymbol: 'USDC', outputToken: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22' as Address, outputTokenSymbol: 'mUSDC', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'moonwell-weth', chainId: 10, depositContract: '0xB4104c02bBF4e9BE85AAa41f4a2D7e16b9F7Cd60' as Address, depositFunction: 'mint(uint256)', inputToken: '0x4200000000000000000000000000000000000006' as Address, inputTokenSymbol: 'WETH', outputToken: '0xB4104c02bBF4e9BE85AAa41f4a2D7e16b9F7Cd60' as Address, outputTokenSymbol: 'mWETH', gasLimit: '300000', requiresApproval: true },
  { protocolId: 'moonwell-usdc', chainId: 10, depositContract: '0x8e08617B0D66359d73aA55e9d5B5d0D3c4700E5e' as Address, depositFunction: 'mint(uint256)', inputToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address, inputTokenSymbol: 'USDC', outputToken: '0x8e08617B0D66359d73aA55e9d5B5d0D3c4700E5e' as Address, outputTokenSymbol: 'mUSDC', gasLimit: '300000', requiresApproval: true },
];

export function generateProtocolAction(
  deployment: ProtocolDeployment,
  amount: AmountString,
  userAddress: Address
): ContractCallConfig {
  const { protocolId, depositContract, inputToken, outputToken, gasLimit } = deployment;

  if (protocolId === 'weth-wrap') {
    const callData = encodeFunctionData({ abi: WETH_ABI, functionName: 'deposit' }) as HexData;
    return { toContractAddress: depositContract, toContractCallData: callData, toContractGasLimit: gasLimit, contractOutputsToken: outputToken };
  }

  if (protocolId.startsWith('aave-v3') || protocolId.startsWith('seamless')) {
    const callData = encodeFunctionData({ abi: AAVE_V3_ABI, functionName: 'supply', args: [inputToken, BigInt(amount), userAddress, 0] }) as HexData;
    return { toContractAddress: depositContract, toContractCallData: callData, toContractGasLimit: gasLimit, contractOutputsToken: outputToken };
  }

  if (['ethena-susde', 'morpho-usdc', 'morpho-weth', 'etherfi-weeth'].includes(protocolId)) {
    const callData = encodeFunctionData({ abi: ERC4626_ABI, functionName: 'deposit', args: [BigInt(amount), userAddress] }) as HexData;
    return { toContractAddress: depositContract, toContractCallData: callData, toContractGasLimit: gasLimit, contractOutputsToken: outputToken };
  }

  if (protocolId.startsWith('compound-v3')) {
    const callData = encodeFunctionData({ abi: COMPOUND_V3_ABI, functionName: 'supply', args: [inputToken, BigInt(amount)] }) as HexData;
    return { toContractAddress: depositContract, toContractCallData: callData, toContractGasLimit: gasLimit, contractOutputsToken: outputToken };
  }

  if (protocolId.startsWith('moonwell')) {
    const callData = encodeFunctionData({ abi: MOONWELL_ABI, functionName: 'mint', args: [BigInt(amount)] }) as HexData;
    return { toContractAddress: depositContract, toContractCallData: callData, toContractGasLimit: gasLimit, contractOutputsToken: outputToken };
  }

  if (protocolId === 'lido-wsteth') {
    const callData = encodeFunctionData({ abi: WSTETH_ABI, functionName: 'wrap', args: [BigInt(amount)] }) as HexData;
    return { toContractAddress: depositContract, toContractCallData: callData, toContractGasLimit: gasLimit, contractOutputsToken: outputToken };
  }

  throw new Error(`Unknown protocol: ${protocolId}`);
}

export function getDeploymentsForChain(chainId: ChainId): ProtocolDeployment[] {
  return DEPLOYMENTS.filter((d) => d.chainId === chainId);
}

export function getDeployment(protocolId: string, chainId: ChainId): ProtocolDeployment | undefined {
  return DEPLOYMENTS.find((d) => d.protocolId === protocolId && d.chainId === chainId);
}

export function getProtocol(protocolId: string): ProtocolInfo | undefined {
  return PROTOCOLS.find((p) => p.id === protocolId);
}

export function getChainName(chainId: ChainId): string {
  const entry = Object.entries(CHAIN_IDS).find(([_, id]) => id === chainId);
  return entry ? entry[0] : `Unknown (${chainId})`;
}
