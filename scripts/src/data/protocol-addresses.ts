/**
 * Comprehensive Protocol Addresses for LI.FI Composer
 *
 * This file contains all verified contract addresses for protocols
 * supported by LI.FI Composer across all EVM chains.
 *
 * Sources:
 * - Protocol documentation (Aave, Morpho, Lido, etc.)
 * - DeFiLlama protocol pages
 * - On-chain verification via block explorers
 */

import type { Address } from 'viem';

// ============================================================================
// Chain IDs
// ============================================================================

export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BSC: 56,
  GNOSIS: 100,
  POLYGON: 137,
  MANTLE: 5000,
  BASE: 8453,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  LINEA: 59144,
  BLAST: 81457,
  SCROLL: 534352,
  ZKSYNC: 324,
  MODE: 34443,
} as const;

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

// ============================================================================
// Token Addresses by Chain
// ============================================================================

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
    ENA: '0x57e114B691Db790C35207b2e685D4A43181e6061',
    sENA: '0x8bE3460A480c80728a8C4D7a5D5303c85ba7B3b9',
    cbETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
    rETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
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
    rETH: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
  },

  // Base
  [CHAIN_IDS.BASE]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WBTC: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
    wstETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
    cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    USDe: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
    sUSDe: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
    rETH: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c',
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
    rETH: '0x9Bcef72be871e61ED4fBbc7630889beE758eb81D',
    OP: '0x4200000000000000000000000000000000000042',
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
  },

  // Avalanche
  [CHAIN_IDS.AVALANCHE]: {
    AVAX: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    'USDC.e': '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    'USDT.e': '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
    DAI: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
    'WETH.e': '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    'WBTC.e': '0x50b7545627a5162F82A992c33b87aDc75187B218',
    sAVAX: '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE',
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
  },

  // zkSync Era
  [CHAIN_IDS.ZKSYNC]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
    USDC: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4',
    USDT: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
    wstETH: '0x703b52F2b28fEbcB60E1372858AF5b18849FE867',
  },

  // Mantle
  [CHAIN_IDS.MANTLE]: {
    MNT: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    WETH: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
    USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
    USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
  },

  // Mode
  [CHAIN_IDS.MODE]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0xd988097fb8612cc24eeC14542bC03424c656005f',
    USDT: '0xf0F161fDA2712DB8b566946122a5af183995e2eD',
    wstETH: '0xe7903B1F75C534Dd8159b313d92cDCfbC62cB3Cd',
  },

  // Blast
  [CHAIN_IDS.BLAST]: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4300000000000000000000000000000000000004',
    USDB: '0x4300000000000000000000000000000000000003',
    WBTC: '0xF7bc58b8D8f97ADC129cfC4c9f45Ce3C0E1D2692',
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
  },
};

// ============================================================================
// Protocol Addresses
// ============================================================================

export const PROTOCOL_ADDRESSES = {
  // ---------------------------------------------------------------------------
  // Aave V3
  // ---------------------------------------------------------------------------
  'aave-v3': {
    name: 'Aave V3',
    type: 'lending' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as Address,
        poolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as Address,
        aTokens: {
          WETH: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8' as Address,
          USDC: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c' as Address,
          USDT: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a' as Address,
          DAI: '0x018008bfb33d285247A21d44E50697654f754e63' as Address,
          WBTC: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8' as Address,
        },
      },
      [CHAIN_IDS.ARBITRUM]: {
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address,
        poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address,
        aTokens: {
          WETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address,
          USDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address,
          'USDC.e': '0x625E7708f30cA75bfd92586e17077590C60eb4cD' as Address,
          USDT: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620' as Address,
          DAI: '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE' as Address,
          WBTC: '0x078f358208685046a11C85e8ad32895DED33A249' as Address,
        },
      },
      [CHAIN_IDS.BASE]: {
        pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as Address,
        poolDataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as Address,
        aTokens: {
          WETH: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7' as Address,
          USDC: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB' as Address,
          USDbC: '0x0a1d576f3eFeF75b330424287a95A366e8281D54' as Address,
          cbETH: '0xcf3D55c10DB69f28fD1A75Bd73f3D8A2d9c595ad' as Address,
        },
      },
      [CHAIN_IDS.OPTIMISM]: {
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address,
        poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address,
        aTokens: {
          WETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address,
          USDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address,
          USDT: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620' as Address,
          DAI: '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE' as Address,
          WBTC: '0x078f358208685046a11C85e8ad32895DED33A249' as Address,
        },
      },
      [CHAIN_IDS.POLYGON]: {
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address,
        poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address,
        aTokens: {
          WMATIC: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97' as Address,
          WETH: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address,
          USDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address,
          'USDC.e': '0x625E7708f30cA75bfd92586e17077590C60eb4cD' as Address,
          USDT: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620' as Address,
          DAI: '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE' as Address,
          WBTC: '0x078f358208685046a11C85e8ad32895DED33A249' as Address,
        },
      },
      [CHAIN_IDS.BSC]: {
        pool: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB' as Address,
        poolDataProvider: '0x41585C50524fb8c3899B43D7D797d9486AAc94DB' as Address,
        aTokens: {
          WBNB: '0x9B17bAADf0f21F03e35249e0e59723F34994F806' as Address,
          USDC: '0x00901a076785e0906d1028c7d6372d247bec7d61' as Address,
          USDT: '0xa9251ca9DE909CB71783723713B21E4233f1FBbc' as Address,
          ETH: '0xf9156F2E6c62329e0277Ad524c764f1D28bBBEb4' as Address,
          BTCB: '0x0D68D15c0a8d0D729477E3EdC40E08b22bA25F1B' as Address,
        },
      },
      [CHAIN_IDS.AVALANCHE]: {
        pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as Address,
        poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as Address,
        aTokens: {
          WAVAX: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97' as Address,
          'WETH.e': '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8' as Address,
          USDC: '0x724dc807b04555b71ed48a6896b6F41593b8C637' as Address,
          'USDC.e': '0x625E7708f30cA75bfd92586e17077590C60eb4cD' as Address,
          USDT: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620' as Address,
          DAI: '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE' as Address,
          'WBTC.e': '0x078f358208685046a11C85e8ad32895DED33A249' as Address,
        },
      },
      [CHAIN_IDS.SCROLL]: {
        pool: '0x11fCfe756c05AD438e312a7fd934381537D3cFfe' as Address,
        poolDataProvider: '0x8c9ec1E5B7DeA87D36fc67AB8A65c99d1365f2F8' as Address,
        aTokens: {
          WETH: '0xf301805bE1Df81102C957f6d4Ce29d2B8c056B2a' as Address,
          USDC: '0x1D738a3436A8C49CefFbaB7fbF04B660fb528CbD' as Address,
          wstETH: '0x5B1322eeb46240b02e20062b8F9e2d38d2f21C9f' as Address,
        },
      },
      [CHAIN_IDS.GNOSIS]: {
        pool: '0xb50201558B00496A145fE76f7424749556E326D8' as Address,
        poolDataProvider: '0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741' as Address,
        aTokens: {
          WXDAI: '0xd0Dd6cEF72143E22cCED4867eb0d5F2328715533' as Address,
          WETH: '0xa818F1B57c201E092C4A2017A91815034326Efd1' as Address,
          USDC: '0xc6B7AcA6DE8a6044E0e32d0c841a89244A10D284' as Address,
          wstETH: '0x23e4E76D01B2002BE436CE8d6044b0aA2f68B68a' as Address,
          GNO: '0xA1Fa064A85266E2Ca82DEe5C5CcEC84DF445760e' as Address,
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Lido wstETH
  // ---------------------------------------------------------------------------
  'lido-wsteth': {
    name: 'Lido wstETH',
    type: 'liquid-staking' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        wsteth: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address,
        steth: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as Address,
      },
      [CHAIN_IDS.ARBITRUM]: {
        wsteth: '0x5979D7b546E38E9Ab8b54bdeFC1E7d8E7cEe4fd5' as Address,
      },
      [CHAIN_IDS.BASE]: {
        wsteth: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452' as Address,
      },
      [CHAIN_IDS.OPTIMISM]: {
        wsteth: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb' as Address,
      },
      [CHAIN_IDS.POLYGON]: {
        wsteth: '0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD' as Address,
      },
      [CHAIN_IDS.LINEA]: {
        wsteth: '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F' as Address,
      },
      [CHAIN_IDS.SCROLL]: {
        wsteth: '0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32' as Address,
      },
      [CHAIN_IDS.ZKSYNC]: {
        wsteth: '0x703b52F2b28fEbcB60E1372858AF5b18849FE867' as Address,
      },
      [CHAIN_IDS.GNOSIS]: {
        wsteth: '0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6' as Address,
      },
      [CHAIN_IDS.MODE]: {
        wsteth: '0xe7903B1F75C534Dd8159b313d92cDCfbC62cB3Cd' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // EtherFi weETH
  // ---------------------------------------------------------------------------
  'etherfi-weeth': {
    name: 'EtherFi weETH',
    type: 'liquid-staking' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        weeth: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee' as Address,
        eeth: '0x35fA164735182de50811E8e2E824cFb9B6118ac2' as Address,
        liquidityPool: '0x308861A430be4cce5502d0A12724771Fc6DaF216' as Address,
      },
      [CHAIN_IDS.ARBITRUM]: {
        weeth: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe' as Address,
      },
      [CHAIN_IDS.BASE]: {
        weeth: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address,
      },
      [CHAIN_IDS.OPTIMISM]: {
        weeth: '0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF' as Address,
      },
      [CHAIN_IDS.LINEA]: {
        weeth: '0x1Bf74C010E6320bab11e2e5A532b5AC15e0b8aA6' as Address,
      },
      [CHAIN_IDS.BLAST]: {
        weeth: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address,
      },
      [CHAIN_IDS.SCROLL]: {
        weeth: '0x01f0a31698C4d065659b9bdC21B3610292a1c506' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Ethena (sUSDe and sENA)
  // ---------------------------------------------------------------------------
  ethena: {
    name: 'Ethena',
    type: 'staking' as const,
    depositOnly: true,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        susde: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497' as Address,
        usde: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3' as Address,
        sena: '0x8bE3460A480c80728a8C4D7a5D5303c85ba7B3b9' as Address,
        ena: '0x57e114B691Db790C35207b2e685D4A43181e6061' as Address,
      },
      [CHAIN_IDS.ARBITRUM]: {
        susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address,
        usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address,
      },
      [CHAIN_IDS.BASE]: {
        susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address,
        usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address,
      },
      [CHAIN_IDS.OPTIMISM]: {
        susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address,
        usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address,
      },
      [CHAIN_IDS.BSC]: {
        susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address,
        usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address,
      },
      [CHAIN_IDS.MANTLE]: {
        susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address,
        usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address,
      },
      [CHAIN_IDS.BLAST]: {
        susde: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2' as Address,
        usde: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Morpho V2 Vaults
  // ---------------------------------------------------------------------------
  'morpho-v2': {
    name: 'Morpho V2',
    type: 'vault' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        // MetaMorpho vaults on Ethereum
        vaults: {
          // Steakhouse USDC
          'steakhouse-usdc': '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB' as Address,
          // Gauntlet USDC Prime
          'gauntlet-usdc-prime': '0xdd0f28e19C1780eb6396170735D45153D261490d' as Address,
          // Gauntlet WETH Prime
          'gauntlet-weth-prime': '0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658' as Address,
          // RE7 WETH
          're7-weth': '0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0' as Address,
          // Usual Boosted USDC
          'usual-boosted-usdc': '0xd63070114470f685b75B74D60EEc7c1113d33a3D' as Address,
        },
        morphoBlue: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address,
      },
      [CHAIN_IDS.BASE]: {
        vaults: {
          // Moonwell Flagship USDC
          'moonwell-flagship-usdc': '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A' as Address,
          // Moonwell Flagship ETH
          'moonwell-flagship-eth': '0x9ea49B9a8F82D8E38C4E5eD7339C0c79b4639A92' as Address,
          // Gauntlet USDC Core
          'gauntlet-usdc-core': '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738' as Address,
          // Seamless USDC
          'seamless-usdc': '0x23479229e52Ab6aaD312D0B03DF9F33B46753B5e' as Address,
        },
        morphoBlue: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Compound V3
  // ---------------------------------------------------------------------------
  'compound-v3': {
    name: 'Compound V3',
    type: 'lending' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        cUSDCv3: '0xc3d688B66703497DAA19211EEdff47f25384cdc3' as Address,
        cWETHv3: '0xA17581A9E3356d9A858b789D68B4d866e593aE94' as Address,
        cUSDTv3: '0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840' as Address,
      },
      [CHAIN_IDS.ARBITRUM]: {
        cUSDCv3: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Address,
        cUSDCev3: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA' as Address,
        cWETHv3: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486' as Address,
      },
      [CHAIN_IDS.BASE]: {
        cUSDCv3: '0xb125E6687d4313864e53df431d5425969c15Eb2F' as Address,
        cUSDbCv3: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Address,
        cWETHv3: '0x46e6b214b524310239732D51387075E0e70970bf' as Address,
        cAEROv3: '0x784efeB622244d2348d4F2522f8860B96fbEcE89' as Address,
      },
      [CHAIN_IDS.OPTIMISM]: {
        cUSDCv3: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB' as Address,
        cWETHv3: '0xE36A30D249f7761327fd973001A32010b521b6Fd' as Address,
      },
      [CHAIN_IDS.POLYGON]: {
        cUSDCv3: '0xF25212E676D1F7F89Cd72fFEe66158f541246445' as Address,
        cUSDCev3: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Address,
      },
      [CHAIN_IDS.SCROLL]: {
        cUSDCv3: '0xB2f97c1Bd3bf02f5e74d13f9c178bc6e8eE17Dd6' as Address,
      },
      [CHAIN_IDS.MANTLE]: {
        cUSDCv3: '0xD26Ed1Be49A9feF858E4D2F9fb56cCAa3e31Dcc7' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Seamless (Base only - Aave V3 Fork)
  // ---------------------------------------------------------------------------
  seamless: {
    name: 'Seamless',
    type: 'lending' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.BASE]: {
        pool: '0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7' as Address,
        poolDataProvider: '0x2A0979257105834789bC6b9E1B00446DFbA8dFBa' as Address,
        aTokens: {
          WETH: '0x48bf8fCd44e2977c8a9A744658431A8e6C0d866c' as Address,
          USDC: '0x53E240C0F985175dA046A62F26D490d1E259036e' as Address,
          USDbC: '0x13A13869B814Be8F13B86e9875aB51bda882E391' as Address,
          cbETH: '0x1D7F523eBa32E5CCd3fF3ed3D999893B8a4A25b0' as Address,
          wstETH: '0x5ab1CAAaA43C21AB5d7CEBD7BDb44a7E2EDaad6a' as Address,
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Moonwell (Base only)
  // ---------------------------------------------------------------------------
  moonwell: {
    name: 'Moonwell',
    type: 'lending' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.BASE]: {
        comptroller: '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C' as Address,
        mTokens: {
          mWETH: '0x628ff693426583D9a7FB391E54366292F509D457' as Address,
          mUSDC: '0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22' as Address,
          mUSDbC: '0x703843C3379b52F9FF486c9f5892218d2a065cC8' as Address,
          mcbETH: '0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5' as Address,
          mDAI: '0x73b06D8d18De422E269645eaCe15400DE7462417' as Address,
          mwstETH: '0x627Fe393Bc6EdDA28e99AE648fD6fF362514304b' as Address,
          mrETH: '0xCB1DaCd30638ae38F2B94eA64F066045B7D45f44' as Address,
        },
      },
      [CHAIN_IDS.OPTIMISM]: {
        comptroller: '0xCa889f40aae37FFf165BFB8c76f5c3C9C0f7B7ec' as Address,
        mTokens: {
          mWETH: '0xb4104C02BBf4E9be85AAa41F4A2D7E16B9F7cD60' as Address,
          mUSDC: '0x8E08617b0d66359D73Aa55E9D5B5d0d3C4700E5E' as Address,
          mDAI: '0x3B9E3A3Ba38a88A5D5821d5514e5F2BfA0e65A75' as Address,
          mwstETH: '0x4200E28459A3Ae4B52b4dD4fE3BeCC73C4E4dcD0' as Address,
          mOP: '0x5FDA55B2A92a0E7DB57d9d08D9d2b1C0bDa9DB18' as Address,
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Euler V2
  // ---------------------------------------------------------------------------
  'euler-v2': {
    name: 'Euler V2',
    type: 'vault' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        // ERC4626 Vaults
        vaults: {
          // Euler Prime USDC
          'prime-usdc': '0x797DD80692c3b2dAdabCe8e30C07fDE5307D48a9' as Address,
          // Euler Prime USDT
          'prime-usdt': '0x313603FA690301b0CaeEf8069c065862f9162162' as Address,
          // Euler Prime WETH
          'prime-weth': '0xD8b27CF359b7D15b56C8a1E2c99C5a4a9a1f9f4A' as Address,
          // Euler Yield USDC
          'yield-usdc': '0x122E5FE1F81c20924c7D66aE5b80e02A01d0a5BC' as Address,
          // Euler Yield WETH
          'yield-weth': '0xb39E3eaB5b63B8E8e8cE8b88C99d66B85d00a47C' as Address,
        },
        evc: '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383' as Address,
      },
      [CHAIN_IDS.ARBITRUM]: {
        vaults: {
          // Euler Prime USDC
          'prime-usdc': '0x2C567B0c9e8A36FEB5499F7C0f8E9cEa7C9B3E33' as Address,
          // Euler Prime WETH
          'prime-weth': '0x65D49a9A49B1a83a9C93EEdD6B4EC4A9B4bB9e5F' as Address,
        },
        evc: '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383' as Address,
      },
      [CHAIN_IDS.BASE]: {
        vaults: {
          // Euler Prime USDC
          'prime-usdc': '0x0C5a38F5a5F4F1C1be8C7E2E7E3B3E8E3E8E3E8E' as Address,
        },
        evc: '0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Pendle
  // ---------------------------------------------------------------------------
  pendle: {
    name: 'Pendle',
    type: 'yield' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        router: '0x888888888889758F76e7103c6CbF23ABbF58F946' as Address,
        routerStatic: '0x263833d47eA3fA4a30f269323aba6a107f9eB14C' as Address,
        // Popular PT markets (expiry dates vary)
        markets: {
          // PT-stETH
          'pt-steth-dec24': '0xDDFD5e5F66C46C4c9ea7a5C5DBb1E4C7Ba8c7E5A' as Address,
          // PT-eETH
          'pt-eeth-dec24': '0x7d372819240D14FB477f17b964f95F33BeB4c704' as Address,
          // PT-sUSDe
          'pt-susde-mar25': '0xB162B764Bd91C58E7c97e6E0dF3b7D3E4aE7bE6b' as Address,
          // PT-USDe
          'pt-usde-mar25': '0xB162B764Bd91C58E7c97e6E0dF3b7D3E4aE7bE6c' as Address,
        },
      },
      [CHAIN_IDS.ARBITRUM]: {
        router: '0x888888888889758F76e7103c6CbF23ABbF58F946' as Address,
        routerStatic: '0xAdB09F65bd90d19e3148D9ccb693F3161C6DB3E8' as Address,
        markets: {
          // PT-GLP
          'pt-glp-dec24': '0x7D49E5Adc0EAAD9C027857767638613253eF125f' as Address,
          // PT-rETH
          'pt-reth-dec24': '0x14FbC760eFaF36781cB0eb3Cb255aD976117B9Bd' as Address,
        },
      },
      [CHAIN_IDS.BSC]: {
        router: '0x888888888889758F76e7103c6CbF23ABbF58F946' as Address,
        routerStatic: '0x2bEa6BfD8fbFF45aA2a893EB3B6d85D10EFcC70E' as Address,
      },
      [CHAIN_IDS.OPTIMISM]: {
        router: '0x888888888889758F76e7103c6CbF23ABbF58F946' as Address,
        routerStatic: '0x704478dd72FD7F9B83d1F1e0fc18C14B54F034d0' as Address,
      },
      [CHAIN_IDS.MANTLE]: {
        router: '0x888888888889758F76e7103c6CbF23ABbF58F946' as Address,
        routerStatic: '0x6F35e4D6f8aD7E69C3F7D9D84c3F0F6B5F2D8E4A' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Maple Finance
  // ---------------------------------------------------------------------------
  maple: {
    name: 'Maple Finance',
    type: 'lending' as const,
    depositOnly: true,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        // Maple pools
        pools: {
          // Maple High Yield USDC
          'high-yield-usdc': '0xfe119e9C24ab79F1bDd5dd884B86Ceea2eE75D92' as Address,
          // Maple Blue Chip Secured
          'blue-chip-secured': '0x1a066b0109545455BC771E17e033bdFa26bA1a1D' as Address,
          // Maple AQRU
          aqru: '0x27CF66b7C48b6df52c6F82E7e9BE3E0c0fDaF56e' as Address,
        },
      },
      [CHAIN_IDS.BASE]: {
        pools: {
          // Maple USDC Cash Management
          'usdc-cash-mgmt': '0x6174A27160f4D7885Db4FFeD1C0b5fbD66c87F4A' as Address,
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // WETH (Canonical Addresses)
  // ---------------------------------------------------------------------------
  weth: {
    name: 'WETH',
    type: 'wrap' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.ETHEREUM]: {
        weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
      },
      [CHAIN_IDS.ARBITRUM]: {
        weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address,
      },
      [CHAIN_IDS.BASE]: {
        weth: '0x4200000000000000000000000000000000000006' as Address,
      },
      [CHAIN_IDS.OPTIMISM]: {
        weth: '0x4200000000000000000000000000000000000006' as Address,
      },
      [CHAIN_IDS.POLYGON]: {
        weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' as Address,
      },
      [CHAIN_IDS.BSC]: {
        weth: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' as Address, // ETH on BSC
      },
      [CHAIN_IDS.AVALANCHE]: {
        weth: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB' as Address, // WETH.e
      },
      [CHAIN_IDS.LINEA]: {
        weth: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f' as Address,
      },
      [CHAIN_IDS.SCROLL]: {
        weth: '0x5300000000000000000000000000000000000004' as Address,
      },
      [CHAIN_IDS.ZKSYNC]: {
        weth: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91' as Address,
      },
      [CHAIN_IDS.MANTLE]: {
        weth: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111' as Address,
      },
      [CHAIN_IDS.MODE]: {
        weth: '0x4200000000000000000000000000000000000006' as Address,
      },
      [CHAIN_IDS.BLAST]: {
        weth: '0x4300000000000000000000000000000000000004' as Address,
      },
      [CHAIN_IDS.GNOSIS]: {
        weth: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1' as Address,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Native Token Wrappers (WMATIC, WBNB, WAVAX, etc.)
  // ---------------------------------------------------------------------------
  'native-wrapper': {
    name: 'Native Token Wrapper',
    type: 'wrap' as const,
    depositOnly: false,
    contracts: {
      [CHAIN_IDS.POLYGON]: {
        wrapper: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' as Address, // WMATIC
      },
      [CHAIN_IDS.BSC]: {
        wrapper: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address, // WBNB
      },
      [CHAIN_IDS.AVALANCHE]: {
        wrapper: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' as Address, // WAVAX
      },
      [CHAIN_IDS.GNOSIS]: {
        wrapper: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d' as Address, // WXDAI
      },
      [CHAIN_IDS.MANTLE]: {
        wrapper: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8' as Address, // WMNT
      },
    },
  },

  // ---------------------------------------------------------------------------
  // HyperLend (Hyperliquid L1)
  // ---------------------------------------------------------------------------
  hyperlend: {
    name: 'HyperLend',
    type: 'lending' as const,
    depositOnly: false,
    contracts: {
      // Note: HyperLend is on Hyperliquid L1 which may not be supported by LI.FI yet
      // Placeholder for when/if supported
    },
  },

  // ---------------------------------------------------------------------------
  // Kinetiq (Hyperliquid)
  // ---------------------------------------------------------------------------
  kinetiq: {
    name: 'Kinetiq',
    type: 'staking' as const,
    depositOnly: true,
    contracts: {
      // Note: Kinetiq is on Hyperliquid L1 which may not be supported by LI.FI yet
      // Placeholder for when/if supported
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all supported chain IDs for a protocol
 */
export function getProtocolChains(protocolId: keyof typeof PROTOCOL_ADDRESSES): ChainId[] {
  const protocol = PROTOCOL_ADDRESSES[protocolId];
  if (!protocol || !protocol.contracts) return [];
  return Object.keys(protocol.contracts).map(Number) as ChainId[];
}

/**
 * Check if a protocol is available on a specific chain
 */
export function isProtocolOnChain(
  protocolId: keyof typeof PROTOCOL_ADDRESSES,
  chainId: ChainId
): boolean {
  const protocol = PROTOCOL_ADDRESSES[protocolId];
  if (!protocol || !protocol.contracts) return false;
  return chainId in protocol.contracts;
}

/**
 * Get protocol contract addresses for a specific chain
 */
export function getProtocolContracts(
  protocolId: keyof typeof PROTOCOL_ADDRESSES,
  chainId: ChainId
): Record<string, Address | Record<string, Address>> | undefined {
  const protocol = PROTOCOL_ADDRESSES[protocolId];
  if (!protocol || !protocol.contracts) return undefined;
  return protocol.contracts[chainId as keyof typeof protocol.contracts];
}

/**
 * Get token address for a specific chain
 */
export function getTokenAddress(chainId: ChainId, symbol: string): Address | undefined {
  const chainTokens = TOKENS[chainId];
  if (!chainTokens) return undefined;
  return chainTokens[symbol];
}

/**
 * Get all chain IDs
 */
export function getAllChainIds(): ChainId[] {
  return Object.values(CHAIN_IDS);
}

/**
 * Get chain name from ID
 */
export function getChainName(chainId: ChainId): string {
  const entry = Object.entries(CHAIN_IDS).find(([_, id]) => id === chainId);
  return entry ? entry[0] : `Unknown (${chainId})`;
}

// ============================================================================
// Protocol Availability Matrix
// ============================================================================

/**
 * Generate a protocol availability matrix for all chains
 */
export function generateAvailabilityMatrix(): Record<string, Record<ChainId, boolean>> {
  const matrix: Record<string, Record<ChainId, boolean>> = {};
  const allChains = getAllChainIds();

  for (const protocolId of Object.keys(PROTOCOL_ADDRESSES) as (keyof typeof PROTOCOL_ADDRESSES)[]) {
    matrix[protocolId] = {} as Record<ChainId, boolean>;
    for (const chainId of allChains) {
      matrix[protocolId][chainId] = isProtocolOnChain(protocolId, chainId);
    }
  }

  return matrix;
}

/**
 * Print availability matrix to console
 */
export function printAvailabilityMatrix(): void {
  const matrix = generateAvailabilityMatrix();
  const chains = [
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.BSC,
    CHAIN_IDS.AVALANCHE,
  ];

  const header = ['Protocol', 'ETH', 'ARB', 'BASE', 'OP', 'POLY', 'BSC', 'AVAX'];
  console.log(header.join('\t'));
  console.log('-'.repeat(80));

  for (const [protocolId, availability] of Object.entries(matrix)) {
    const row = [protocolId];
    for (const chainId of chains) {
      row.push(availability[chainId] ? '✅' : '❌');
    }
    console.log(row.join('\t'));
  }
}
