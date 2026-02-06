/**
 * Protocol Registry for LI.FI Composer Integration
 *
 * Comprehensive registry of DeFi protocols supported across all EVM chains
 * with their deposit contract addresses, ABIs, and vault token info.
 *
 * Supported Chains:
 * - Ethereum (1)
 * - Arbitrum (42161)
 * - Base (8453)
 * - Optimism (10)
 * - Polygon (137)
 * - BNB Chain (56)
 * - Avalanche (43114)
 * - Linea (59144)
 * - Scroll (534352)
 * - Gnosis (100)
 */

import { encodeFunctionData, parseAbi } from 'viem';
import type { Address, HexData, AmountString, ChainId } from './types';
import type { ContractCallConfig } from './actions';

// =============================================================================
// CHAIN IDS
// =============================================================================

export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BSC: 56,
  GNOSIS: 100,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  LINEA: 59144,
  SCROLL: 534352,
} as const;

// =============================================================================
// PROTOCOL TYPES
// =============================================================================

export interface ProtocolInfo {
  id: string;
  name: string;
  type: 'lending' | 'staking' | 'vault' | 'liquid-staking' | 'dex' | 'wrap';
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

const SEAMLESS_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
]);

// =============================================================================
// TOKEN ADDRESSES BY CHAIN
// =============================================================================

export const TOKENS: Record<ChainId, Record<string, Address>> = {
  // Ethereum Mainnet
  [CHAIN_IDS.ETHEREUM]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EeadCF5fEbaa0',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    stETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    eETH: '0x35fA164735182de50811E8e2E824cFb9B6118ac2',
    weETH: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
    USDe: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    sUSDe: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    cbETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
    rETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    // Aave aTokens
    aWETH: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
    aUSDC: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    aUSDT: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',
    aDAI: '0x018008bfb33d285247A21d44E50697654f754e63',
  },

  // Arbitrum
  [CHAIN_IDS.ARBITRUM]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDC.e': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    wstETH: '0x5979D7b546E38E9Ab8b54bdeFC1E7d8E7cEe4fd5',
    weETH: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
    USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    sUSDe: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    // Aave aTokens
    aWETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    aUSDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    'aUSDC.e': '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
  },

  // Base
  [CHAIN_IDS.BASE]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    wstETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
    cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    sUSDe: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    rETH: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c',
    // Aave aTokens
    aWETH: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7',
    aUSDC: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    aUSDbC: '0x0a1d576f3eFeF75b330424287a95A366e8281D54',
    // Seamless aTokens
    sWETH: '0x48bf8fCd44e2977c8a9A744658431A8e6C0d866c',
    sUSDC: '0x53E240C0F985175dA046A62F26D490d1E259036e',
  },

  // Optimism
  [CHAIN_IDS.OPTIMISM]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    'USDC.e': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    wstETH: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
    weETH: '0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF',
    OP: '0x4200000000000000000000000000000000000042',
    // Aave aTokens
    aWETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    aUSDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
  },

  // Polygon
  [CHAIN_IDS.POLYGON]: {
    MATIC: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    'USDC.e': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    wstETH: '0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD',
    stMATIC: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
    // Aave aTokens
    aWMATIC: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
    aWETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    aUSDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    'aUSDC.e': '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
  },

  // BNB Chain
  [CHAIN_IDS.BSC]: {
    BNB: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    // Aave aTokens
    aWBNB: '0x9B17bAADf0f21F03e35249e0e59723F34994F806',
    aUSDC: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    aUSDT: '0xa9251ca9DE909CB71783723713B21E4233f1FBbc',
  },

  // Avalanche
  [CHAIN_IDS.AVALANCHE]: {
    AVAX: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    'USDC.e': '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    'WETH.e': '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    'WBTC.e': '0x50b7545627a5162F82A992c33b87aDc75187B218',
    sAVAX: '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE',
    // Aave aTokens
    aWAVAX: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
    aUSDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    'aUSDC.e': '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
  },

  // Linea
  [CHAIN_IDS.LINEA]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    USDC: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
    USDT: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
    DAI: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
    wstETH: '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F',
  },

  // Scroll
  [CHAIN_IDS.SCROLL]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x5300000000000000000000000000000000000004',
    USDC: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    USDT: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df',
    wstETH: '0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32',
    // Aave aTokens
    aWETH: '0xf301805bE1Df81102C957f6d4Ce29d2B8c056B2a',
    aUSDC: '0x1D738a3436A8C49CefFbaB7fbF04B660fb528CbD',
  },

  // Gnosis
  [CHAIN_IDS.GNOSIS]: {
    xDAI: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WXDAI: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    WETH: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
    USDC: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
    USDT: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
    wstETH: '0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6',
    GNO: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
    // Aave aTokens (Spark on Gnosis)
    aWXDAI: '0xd0Dd6cEF72143E22cCED4867eb0d5F2328715533',
    aWETH: '0xa818F1B57c201E092C4A2017A91815034326Efd1',
  },
};

// =============================================================================
// PROTOCOL DEFINITIONS
// =============================================================================

export const PROTOCOLS: ProtocolInfo[] = [
  // --- Wrapping ---
  {
    id: 'weth-wrap',
    name: 'WETH Wrap',
    type: 'wrap',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.BASE,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.LINEA,
      CHAIN_IDS.SCROLL,
      CHAIN_IDS.GNOSIS,
    ],
    description: 'Wrap ETH to WETH',
  },

  // --- Liquid Staking ---
  {
    id: 'lido-wsteth',
    name: 'Lido wstETH',
    type: 'liquid-staking',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.BASE,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.LINEA,
      CHAIN_IDS.SCROLL,
      CHAIN_IDS.GNOSIS,
    ],
    description: 'Wrap stETH to wstETH (liquid staking derivative)',
  },
  {
    id: 'etherfi-weeth',
    name: 'EtherFi weETH',
    type: 'liquid-staking',
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: 'Wrap eETH to weETH (ERC4626 liquid staking)',
  },

  // --- Aave V3 Lending ---
  {
    id: 'aave-v3-weth',
    name: 'Aave V3 WETH',
    type: 'lending',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.BASE,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.BSC,
      CHAIN_IDS.AVALANCHE,
      CHAIN_IDS.SCROLL,
      CHAIN_IDS.GNOSIS,
    ],
    description: 'Supply WETH to Aave V3',
  },
  {
    id: 'aave-v3-usdc',
    name: 'Aave V3 USDC',
    type: 'lending',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.BASE,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.BSC,
      CHAIN_IDS.AVALANCHE,
      CHAIN_IDS.SCROLL,
      CHAIN_IDS.GNOSIS,
    ],
    description: 'Supply USDC to Aave V3',
  },
  {
    id: 'aave-v3-usdt',
    name: 'Aave V3 USDT',
    type: 'lending',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.BSC,
      CHAIN_IDS.AVALANCHE,
    ],
    description: 'Supply USDT to Aave V3',
  },
  {
    id: 'aave-v3-dai',
    name: 'Aave V3 DAI',
    type: 'lending',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.AVALANCHE,
    ],
    description: 'Supply DAI to Aave V3',
  },

  // --- Ethena ---
  {
    id: 'ethena-susde',
    name: 'Ethena sUSDe',
    type: 'staking',
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE],
    description: 'Stake USDe to sUSDe (ERC4626 vault)',
    depositOnly: true,
  },

  // --- Morpho Vaults ---
  {
    id: 'morpho-usdc',
    name: 'Morpho USDC Vault',
    type: 'vault',
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.BASE],
    description: 'Deposit USDC into Morpho vault',
  },
  {
    id: 'morpho-weth',
    name: 'Morpho WETH Vault',
    type: 'vault',
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.BASE],
    description: 'Deposit WETH into Morpho vault',
  },

  // --- Compound V3 ---
  {
    id: 'compound-v3-usdc',
    name: 'Compound V3 USDC',
    type: 'lending',
    chains: [
      CHAIN_IDS.ETHEREUM,
      CHAIN_IDS.ARBITRUM,
      CHAIN_IDS.BASE,
      CHAIN_IDS.OPTIMISM,
      CHAIN_IDS.POLYGON,
      CHAIN_IDS.SCROLL,
    ],
    description: 'Supply USDC to Compound V3',
  },
  {
    id: 'compound-v3-weth',
    name: 'Compound V3 WETH',
    type: 'lending',
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: 'Supply WETH to Compound V3',
  },

  // --- Seamless (Base only - Aave V3 Fork) ---
  {
    id: 'seamless-weth',
    name: 'Seamless WETH',
    type: 'lending',
    chains: [CHAIN_IDS.BASE],
    description: 'Supply WETH to Seamless on Base',
  },
  {
    id: 'seamless-usdc',
    name: 'Seamless USDC',
    type: 'lending',
    chains: [CHAIN_IDS.BASE],
    description: 'Supply USDC to Seamless on Base',
  },

  // --- Moonwell (Base & Optimism) ---
  {
    id: 'moonwell-weth',
    name: 'Moonwell WETH',
    type: 'lending',
    chains: [CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: 'Supply WETH to Moonwell',
  },
  {
    id: 'moonwell-usdc',
    name: 'Moonwell USDC',
    type: 'lending',
    chains: [CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: 'Supply USDC to Moonwell',
  },
];

// =============================================================================
// PROTOCOL DEPLOYMENTS
// =============================================================================

export const DEPLOYMENTS: ProtocolDeployment[] = [
  // ===========================================================================
  // WETH WRAP
  // ===========================================================================
  {
    protocolId: 'weth-wrap',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    depositFunction: 'deposit()',
    inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    inputTokenSymbol: 'ETH',
    outputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },
  {
    protocolId: 'weth-wrap',
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    depositFunction: 'deposit()',
    inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    inputTokenSymbol: 'ETH',
    outputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },
  {
    protocolId: 'weth-wrap',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x4200000000000000000000000000000000000006',
    depositFunction: 'deposit()',
    inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    inputTokenSymbol: 'ETH',
    outputToken: '0x4200000000000000000000000000000000000006',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },
  {
    protocolId: 'weth-wrap',
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0x4200000000000000000000000000000000000006',
    depositFunction: 'deposit()',
    inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    inputTokenSymbol: 'ETH',
    outputToken: '0x4200000000000000000000000000000000000006',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },
  {
    protocolId: 'weth-wrap',
    chainId: CHAIN_IDS.LINEA,
    depositContract: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    depositFunction: 'deposit()',
    inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    inputTokenSymbol: 'ETH',
    outputToken: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },
  {
    protocolId: 'weth-wrap',
    chainId: CHAIN_IDS.SCROLL,
    depositContract: '0x5300000000000000000000000000000000000004',
    depositFunction: 'deposit()',
    inputToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    inputTokenSymbol: 'ETH',
    outputToken: '0x5300000000000000000000000000000000000004',
    outputTokenSymbol: 'WETH',
    gasLimit: '50000',
    requiresApproval: false,
  },

  // ===========================================================================
  // AAVE V3 WETH
  // ===========================================================================
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    inputTokenSymbol: 'WETH',
    outputToken: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
    outputTokenSymbol: 'aEthWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    inputTokenSymbol: 'WETH',
    outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    outputTokenSymbol: 'aArbWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.BASE,
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
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    outputTokenSymbol: 'aOptWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.POLYGON,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    inputTokenSymbol: 'WETH',
    outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    outputTokenSymbol: 'aPolWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.AVALANCHE,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    inputTokenSymbol: 'WETH.e',
    outputToken: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
    outputTokenSymbol: 'aAvaWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.SCROLL,
    depositContract: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x5300000000000000000000000000000000000004',
    inputTokenSymbol: 'WETH',
    outputToken: '0xf301805bE1Df81102C957f6d4Ce29d2B8c056B2a',
    outputTokenSymbol: 'aScrWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-weth',
    chainId: CHAIN_IDS.GNOSIS,
    depositContract: '0xb50201558B00496A145fE76f7424749556E326D8',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
    inputTokenSymbol: 'WETH',
    outputToken: '0xa818F1B57c201E092C4A2017A91815034326Efd1',
    outputTokenSymbol: 'aGnoWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // AAVE V3 USDC
  // ===========================================================================
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    inputTokenSymbol: 'USDC',
    outputToken: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    outputTokenSymbol: 'aEthUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    inputTokenSymbol: 'USDC',
    outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    outputTokenSymbol: 'aArbUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.BASE,
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
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    inputTokenSymbol: 'USDC',
    outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    outputTokenSymbol: 'aOptUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.POLYGON,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    inputTokenSymbol: 'USDC',
    outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    outputTokenSymbol: 'aPolUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.BSC,
    depositContract: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    inputTokenSymbol: 'USDC',
    outputToken: '0x00901a076785e0906d1028c7d6372d247bec7d61',
    outputTokenSymbol: 'aBnbUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.AVALANCHE,
    depositContract: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    inputTokenSymbol: 'USDC',
    outputToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
    outputTokenSymbol: 'aAvaUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.SCROLL,
    depositContract: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    inputTokenSymbol: 'USDC',
    outputToken: '0x1D738a3436A8C49CefFbaB7fbF04B660fb528CbD',
    outputTokenSymbol: 'aScrUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'aave-v3-usdc',
    chainId: CHAIN_IDS.GNOSIS,
    depositContract: '0xb50201558B00496A145fE76f7424749556E326D8',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
    inputTokenSymbol: 'USDC',
    outputToken: '0xc6B7AcA6DE8a6044E0e32d0c841a89244A10D284',
    outputTokenSymbol: 'aGnoUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // LIDO wstETH (bridged on L2s)
  // ===========================================================================
  // Note: On L2s, wstETH is bridged, not wrapped from stETH. These deployments
  // are placeholders for LI.FI to route swaps to wstETH as the output token.
  {
    protocolId: 'lido-wsteth',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    depositFunction: 'wrap(uint256)',
    inputToken: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    inputTokenSymbol: 'stETH',
    outputToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    outputTokenSymbol: 'wstETH',
    gasLimit: '100000',
    requiresApproval: true,
  },

  // ===========================================================================
  // ETHERFI weETH (ERC4626)
  // ===========================================================================
  {
    protocolId: 'etherfi-weeth',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x35fA164735182de50811E8e2E824cFb9B6118ac2',
    inputTokenSymbol: 'eETH',
    outputToken: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
    outputTokenSymbol: 'weETH',
    gasLimit: '150000',
    requiresApproval: true,
  },

  // ===========================================================================
  // ETHENA sUSDe (ERC4626)
  // ===========================================================================
  {
    protocolId: 'ethena-susde',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    inputTokenSymbol: 'USDe',
    outputToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    outputTokenSymbol: 'sUSDe',
    gasLimit: '200000',
    requiresApproval: true,
  },
  {
    protocolId: 'ethena-susde',
    chainId: CHAIN_IDS.ARBITRUM,
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
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    inputTokenSymbol: 'USDe',
    outputToken: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    outputTokenSymbol: 'sUSDe',
    gasLimit: '200000',
    requiresApproval: true,
  },

  // ===========================================================================
  // MORPHO USDC VAULT
  // ===========================================================================
  {
    protocolId: 'morpho-usdc',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB', // Steakhouse USDC
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    inputTokenSymbol: 'USDC',
    outputToken: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB',
    outputTokenSymbol: 'steakUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'morpho-usdc',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A', // Moonwell Flagship USDC
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',
    outputTokenSymbol: 'spUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // MORPHO WETH VAULT
  // ===========================================================================
  {
    protocolId: 'morpho-weth',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0', // RE7 WETH
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    inputTokenSymbol: 'WETH',
    outputToken: '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0',
    outputTokenSymbol: 're7WETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'morpho-weth',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x9ea49B9a8F82D8E38C4E5eD7339C0c79b4639A92', // Moonwell Flagship ETH
    depositFunction: 'deposit(uint256,address)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x9ea49B9a8F82D8E38C4E5eD7339C0c79b4639A92',
    outputTokenSymbol: 'spWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // COMPOUND V3 USDC
  // ===========================================================================
  {
    protocolId: 'compound-v3-usdc',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    inputTokenSymbol: 'USDC',
    outputToken: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-usdc',
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    inputTokenSymbol: 'USDC',
    outputToken: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-usdc',
    chainId: CHAIN_IDS.BASE,
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
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    inputTokenSymbol: 'USDC',
    outputToken: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-usdc',
    chainId: CHAIN_IDS.POLYGON,
    depositContract: '0xF25212E676D1F7F89Cd72fFEe66158f541246445',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    inputTokenSymbol: 'USDC',
    outputToken: '0xF25212E676D1F7F89Cd72fFEe66158f541246445',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-usdc',
    chainId: CHAIN_IDS.SCROLL,
    depositContract: '0xB2f97c1Bd3bf02f5e74d13f9c178bc6e8eE17Dd6',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
    inputTokenSymbol: 'USDC',
    outputToken: '0xB2f97c1Bd3bf02f5e74d13f9c178bc6e8eE17Dd6',
    outputTokenSymbol: 'cUSDCv3',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // COMPOUND V3 WETH
  // ===========================================================================
  {
    protocolId: 'compound-v3-weth',
    chainId: CHAIN_IDS.ETHEREUM,
    depositContract: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    inputTokenSymbol: 'WETH',
    outputToken: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
    outputTokenSymbol: 'cWETHv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-weth',
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    inputTokenSymbol: 'WETH',
    outputToken: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
    outputTokenSymbol: 'cWETHv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-weth',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x46e6b214b524310239732D51387075E0e70970bf',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x46e6b214b524310239732D51387075E0e70970bf',
    outputTokenSymbol: 'cWETHv3',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'compound-v3-weth',
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0xE36A30D249f7761327fd973001A32010b521b6Fd',
    depositFunction: 'supply(address,uint256)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0xE36A30D249f7761327fd973001A32010b521b6Fd',
    outputTokenSymbol: 'cWETHv3',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // SEAMLESS (Base only - Aave V3 Fork)
  // ===========================================================================
  {
    protocolId: 'seamless-weth',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x48bf8fCd44e2977c8a9A744658431A8e6C0d866c',
    outputTokenSymbol: 'sWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'seamless-usdc',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0x53E240C0F985175dA046A62F26D490d1E259036e',
    outputTokenSymbol: 'sUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },

  // ===========================================================================
  // MOONWELL
  // ===========================================================================
  {
    protocolId: 'moonwell-weth',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0x628ff693426583D9a7FB391E54366292F509D457',
    depositFunction: 'mint(uint256)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0x628ff693426583D9a7FB391E54366292F509D457',
    outputTokenSymbol: 'mWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'moonwell-usdc',
    chainId: CHAIN_IDS.BASE,
    depositContract: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22',
    depositFunction: 'mint(uint256)',
    inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    inputTokenSymbol: 'USDC',
    outputToken: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22',
    outputTokenSymbol: 'mUSDC',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'moonwell-weth',
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0xb4104C02BBf4E9be85AAa41F4A2D7E16B9F7cD60',
    depositFunction: 'mint(uint256)',
    inputToken: '0x4200000000000000000000000000000000000006',
    inputTokenSymbol: 'WETH',
    outputToken: '0xb4104C02BBf4E9be85AAa41F4A2D7E16B9F7cD60',
    outputTokenSymbol: 'mWETH',
    gasLimit: '300000',
    requiresApproval: true,
  },
  {
    protocolId: 'moonwell-usdc',
    chainId: CHAIN_IDS.OPTIMISM,
    depositContract: '0x8E08617b0d66359D73Aa55E9D5B5d0d3C4700E5E',
    depositFunction: 'mint(uint256)',
    inputToken: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    inputTokenSymbol: 'USDC',
    outputToken: '0x8E08617b0d66359D73Aa55E9D5B5d0d3C4700E5E',
    outputTokenSymbol: 'mUSDC',
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

  // Aave V3 / Seamless supply - use exact amount
  if (protocolId.startsWith('aave-v3') || protocolId.startsWith('seamless')) {
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

export function getChainName(chainId: ChainId): string {
  const entry = Object.entries(CHAIN_IDS).find(([_, id]) => id === chainId);
  return entry ? entry[0] : `Unknown (${chainId})`;
}

export function getAllChainIds(): ChainId[] {
  return Object.values(CHAIN_IDS);
}

/**
 * Get all unique protocol IDs
 */
export function getAllProtocolIds(): string[] {
  return [...new Set(DEPLOYMENTS.map((d) => d.protocolId))];
}

/**
 * Get deployment counts by chain
 */
export function getDeploymentCountsByChain(): Record<ChainId, number> {
  const counts: Record<number, number> = {};
  for (const d of DEPLOYMENTS) {
    counts[d.chainId] = (counts[d.chainId] || 0) + 1;
  }
  return counts as Record<ChainId, number>;
}

/**
 * Print deployment summary
 */
export function printDeploymentSummary(): void {
  console.log('\n=== Protocol Deployment Summary ===\n');

  const byChain = getDeploymentCountsByChain();
  console.log('Deployments by Chain:');
  for (const [chainId, count] of Object.entries(byChain)) {
    console.log(`  ${getChainName(Number(chainId))}: ${count} deployments`);
  }

  console.log('\nTotal Protocols:', PROTOCOLS.length);
  console.log('Total Deployments:', DEPLOYMENTS.length);
  console.log('');
}
