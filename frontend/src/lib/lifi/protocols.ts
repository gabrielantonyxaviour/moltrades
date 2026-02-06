/**
 * Protocol Registry for LI.FI Composer Integration
 *
 * Comprehensive registry of DeFi protocols supported across all EVM chains.
 * Ported from scripts/src/lib/protocols.ts for browser use.
 */

import { encodeFunctionData, parseAbi } from "viem";
import type { Address, ChainId, AmountString, HexData, ContractCallConfig, ProtocolDeployment, ProtocolInfo } from "./types";
import { CHAIN_IDS } from "./sdk";

// =============================================================================
// ABIs
// =============================================================================

const AAVE_V3_ABI = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]);

const ERC4626_ABI = parseAbi([
  "function deposit(uint256 assets, address receiver) returns (uint256)",
]);

const COMPOUND_V3_ABI = parseAbi(["function supply(address asset, uint256 amount)"]);

const MOONWELL_ABI = parseAbi(["function mint(uint256 mintAmount) returns (uint256)"]);

const WETH_ABI = parseAbi(["function deposit() payable"]);

const WSTETH_ABI = parseAbi(["function wrap(uint256 _stETHAmount) returns (uint256)"]);

// =============================================================================
// TOKEN ADDRESSES BY CHAIN
// =============================================================================

export const TOKENS: Record<ChainId, Record<string, Address>> = {
  [CHAIN_IDS.ETHEREUM]: {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  },
  [CHAIN_IDS.ARBITRUM]: {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    wstETH: "0x5979D7b546E38E9Ab8b54bdeFC1E7d8E7cEe4fd5",
  },
  [CHAIN_IDS.BASE]: {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    wstETH: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
  },
  [CHAIN_IDS.OPTIMISM]: {
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    wstETH: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb",
  },
  [CHAIN_IDS.POLYGON]: {
    MATIC: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  },
};

// =============================================================================
// PROTOCOL DEFINITIONS
// =============================================================================

export const PROTOCOLS: ProtocolInfo[] = [
  {
    id: "weth-wrap",
    name: "WETH Wrap",
    type: "wrap",
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: "Wrap ETH to WETH",
  },
  {
    id: "aave-v3-weth",
    name: "Aave V3 WETH",
    type: "lending",
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    description: "Supply WETH to Aave V3",
  },
  {
    id: "aave-v3-usdc",
    name: "Aave V3 USDC",
    type: "lending",
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    description: "Supply USDC to Aave V3",
  },
  {
    id: "morpho-usdc",
    name: "Morpho USDC Vault",
    type: "vault",
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.BASE],
    description: "Deposit USDC into Morpho vault",
  },
  {
    id: "morpho-weth",
    name: "Morpho WETH Vault",
    type: "vault",
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.BASE],
    description: "Deposit WETH into Morpho vault",
  },
  {
    id: "compound-v3-usdc",
    name: "Compound V3 USDC",
    type: "lending",
    chains: [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM, CHAIN_IDS.POLYGON],
    description: "Supply USDC to Compound V3",
  },
  {
    id: "moonwell-weth",
    name: "Moonwell WETH",
    type: "lending",
    chains: [CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: "Supply WETH to Moonwell",
  },
  {
    id: "moonwell-usdc",
    name: "Moonwell USDC",
    type: "lending",
    chains: [CHAIN_IDS.BASE, CHAIN_IDS.OPTIMISM],
    description: "Supply USDC to Moonwell",
  },
];

// =============================================================================
// PROTOCOL DEPLOYMENTS (Subset for browser)
// =============================================================================

export const DEPLOYMENTS: ProtocolDeployment[] = [
  // WETH Wrap
  {
    protocolId: "weth-wrap",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0x4200000000000000000000000000000000000006",
    depositFunction: "deposit()",
    inputToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    inputTokenSymbol: "ETH",
    outputToken: "0x4200000000000000000000000000000000000006",
    outputTokenSymbol: "WETH",
    gasLimit: "50000",
    requiresApproval: false,
  },
  {
    protocolId: "weth-wrap",
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    depositFunction: "deposit()",
    inputToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    inputTokenSymbol: "ETH",
    outputToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    outputTokenSymbol: "WETH",
    gasLimit: "50000",
    requiresApproval: false,
  },

  // Aave V3 WETH
  {
    protocolId: "aave-v3-weth",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    depositFunction: "supply(address,uint256,address,uint16)",
    inputToken: "0x4200000000000000000000000000000000000006",
    inputTokenSymbol: "WETH",
    outputToken: "0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7",
    outputTokenSymbol: "aBasWETH",
    gasLimit: "300000",
    requiresApproval: true,
  },
  {
    protocolId: "aave-v3-weth",
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    depositFunction: "supply(address,uint256,address,uint16)",
    inputToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    inputTokenSymbol: "WETH",
    outputToken: "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8",
    outputTokenSymbol: "aArbWETH",
    gasLimit: "300000",
    requiresApproval: true,
  },

  // Aave V3 USDC
  {
    protocolId: "aave-v3-usdc",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    depositFunction: "supply(address,uint256,address,uint16)",
    inputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    inputTokenSymbol: "USDC",
    outputToken: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
    outputTokenSymbol: "aBasUSDC",
    gasLimit: "300000",
    requiresApproval: true,
  },
  {
    protocolId: "aave-v3-usdc",
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    depositFunction: "supply(address,uint256,address,uint16)",
    inputToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    inputTokenSymbol: "USDC",
    outputToken: "0x724dc807b04555b71ed48a6896b6F41593b8C637",
    outputTokenSymbol: "aArbUSDC",
    gasLimit: "300000",
    requiresApproval: true,
  },

  // Morpho USDC
  {
    protocolId: "morpho-usdc",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    depositFunction: "deposit(uint256,address)",
    inputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    inputTokenSymbol: "USDC",
    outputToken: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    outputTokenSymbol: "spUSDC",
    gasLimit: "300000",
    requiresApproval: true,
  },

  // Morpho WETH
  {
    protocolId: "morpho-weth",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0x9ea49B9a8F82D8E38C4E5eD7339C0c79b4639A92",
    depositFunction: "deposit(uint256,address)",
    inputToken: "0x4200000000000000000000000000000000000006",
    inputTokenSymbol: "WETH",
    outputToken: "0x9ea49B9a8F82D8E38C4E5eD7339C0c79b4639A92",
    outputTokenSymbol: "spWETH",
    gasLimit: "300000",
    requiresApproval: true,
  },

  // Compound V3 USDC
  {
    protocolId: "compound-v3-usdc",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0xb125E6687d4313864e53df431d5425969c15Eb2F",
    depositFunction: "supply(address,uint256)",
    inputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    inputTokenSymbol: "USDC",
    outputToken: "0xb125E6687d4313864e53df431d5425969c15Eb2F",
    outputTokenSymbol: "cUSDCv3",
    gasLimit: "300000",
    requiresApproval: true,
  },
  {
    protocolId: "compound-v3-usdc",
    chainId: CHAIN_IDS.ARBITRUM,
    depositContract: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
    depositFunction: "supply(address,uint256)",
    inputToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    inputTokenSymbol: "USDC",
    outputToken: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
    outputTokenSymbol: "cUSDCv3",
    gasLimit: "300000",
    requiresApproval: true,
  },

  // Moonwell
  {
    protocolId: "moonwell-weth",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0x628ff693426583D9a7FB391E54366292F509D457",
    depositFunction: "mint(uint256)",
    inputToken: "0x4200000000000000000000000000000000000006",
    inputTokenSymbol: "WETH",
    outputToken: "0x628ff693426583D9a7FB391E54366292F509D457",
    outputTokenSymbol: "mWETH",
    gasLimit: "300000",
    requiresApproval: true,
  },
  {
    protocolId: "moonwell-usdc",
    chainId: CHAIN_IDS.BASE,
    depositContract: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
    depositFunction: "mint(uint256)",
    inputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    inputTokenSymbol: "USDC",
    outputToken: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
    outputTokenSymbol: "mUSDC",
    gasLimit: "300000",
    requiresApproval: true,
  },
];

// =============================================================================
// ACTION GENERATORS
// =============================================================================

export function generateProtocolAction(
  deployment: ProtocolDeployment,
  amount: AmountString,
  userAddress: Address
): ContractCallConfig {
  const { protocolId, depositContract, inputToken, outputToken, gasLimit } = deployment;

  // WETH wrap
  if (protocolId === "weth-wrap") {
    const callData = encodeFunctionData({
      abi: WETH_ABI,
      functionName: "deposit",
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Aave V3 supply
  if (protocolId.startsWith("aave-v3")) {
    const callData = encodeFunctionData({
      abi: AAVE_V3_ABI,
      functionName: "supply",
      args: [inputToken, BigInt(amount), userAddress, 0],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // ERC4626 vaults (Morpho)
  if (protocolId.startsWith("morpho")) {
    const callData = encodeFunctionData({
      abi: ERC4626_ABI,
      functionName: "deposit",
      args: [BigInt(amount), userAddress],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Compound V3 supply
  if (protocolId.startsWith("compound-v3")) {
    const callData = encodeFunctionData({
      abi: COMPOUND_V3_ABI,
      functionName: "supply",
      args: [inputToken, BigInt(amount)],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Moonwell mint
  if (protocolId.startsWith("moonwell")) {
    const callData = encodeFunctionData({
      abi: MOONWELL_ABI,
      functionName: "mint",
      args: [BigInt(amount)],
    }) as HexData;

    return {
      toContractAddress: depositContract,
      toContractCallData: callData,
      toContractGasLimit: gasLimit,
      contractOutputsToken: outputToken,
    };
  }

  // Lido wstETH
  if (protocolId === "lido-wsteth") {
    const callData = encodeFunctionData({
      abi: WSTETH_ABI,
      functionName: "wrap",
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

export function getTokenAddress(chainId: ChainId, symbol: string): Address | undefined {
  return TOKENS[chainId]?.[symbol];
}

export function getAllProtocolIds(): string[] {
  return [...new Set(DEPLOYMENTS.map((d) => d.protocolId))];
}

// =============================================================================
// PROTOCOL NAME MAPPING
// =============================================================================

export const PROTOCOL_NAME_MAP: Record<string, string> = {
  aave: "aave-v3",
  morpho: "morpho",
  compound: "compound-v3",
  moonwell: "moonwell",
  lido: "lido",
};

export function findProtocolByName(name: string, token: string, chainId: ChainId): ProtocolDeployment | undefined {
  const normalizedName = name.toLowerCase();
  const normalizedToken = token.toUpperCase();

  // Try direct protocol lookup
  for (const [alias, prefix] of Object.entries(PROTOCOL_NAME_MAP)) {
    if (normalizedName.includes(alias)) {
      const protocolId = `${prefix}-${normalizedToken.toLowerCase()}`;
      const deployment = getDeployment(protocolId, chainId);
      if (deployment) return deployment;

      // Try WETH for ETH
      if (normalizedToken === "ETH") {
        const wethDeployment = getDeployment(`${prefix}-weth`, chainId);
        if (wethDeployment) return wethDeployment;
      }
    }
  }

  // Fallback: search all deployments
  return DEPLOYMENTS.find(
    (d) =>
      d.chainId === chainId &&
      d.protocolId.includes(normalizedName) &&
      (d.inputTokenSymbol === normalizedToken ||
        (normalizedToken === "ETH" && d.inputTokenSymbol === "WETH"))
  );
}
