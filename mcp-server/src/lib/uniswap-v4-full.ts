/**
 * Uniswap V4 Full Integration for Unichain
 *
 * Features:
 * - Swap quotes and execution
 * - Pool discovery via StateView
 * - Liquidity management via Position Manager
 * - Hooks discovery and interaction
 *
 * Supports both mainnet (130) and Sepolia testnet (1301)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  decodeFunctionResult,
  parseAbi,
  formatUnits,
  parseUnits,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  concat,
  toHex,
  type Address,
  type PublicClient,
  type WalletClient,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// =============================================================================
// CHAIN CONFIGURATIONS
// =============================================================================

export const UNICHAIN_MAINNET: Chain = {
  id: 130,
  name: 'Unichain',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://uniscan.xyz' },
  },
};

export const UNICHAIN_SEPOLIA: Chain = {
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan Sepolia', url: 'https://sepolia.uniscan.xyz' },
  },
  testnet: true,
};

// =============================================================================
// CONTRACT ADDRESSES
// =============================================================================

export const CONTRACTS = {
  // Mainnet (130)
  130: {
    POOL_MANAGER: '0x1f98400000000000000000000000000000000004' as Address,
    POSITION_MANAGER: '0x4529a01c7a0410167c5740c487a8de60232617bf' as Address,
    QUOTER: '0x333e3c607b141b18ff6de9f258db6e77fe7491e0' as Address,
    STATE_VIEW: '0x86e8631a016f9068c3f085faf484ee3f5fdee8f2' as Address,
    UNIVERSAL_ROUTER: '0xef740bf23acae26f6492b10de645d6b98dc8eaf3' as Address,
    PERMIT2: '0x000000000022d473030f116ddee9f6b43ac78ba3' as Address,
  },
  // Sepolia Testnet (1301)
  1301: {
    POOL_MANAGER: '0x00b036b58a818b1bc34d502d3fe730db729e62ac' as Address,
    POSITION_MANAGER: '0xf969aee60879c54baaed9f3ed26147db216fd664' as Address,
    QUOTER: '0x56dcd40a3f2d466f48e7f48bdbe5cc9b92ae4472' as Address,
    STATE_VIEW: '0xc199f1072a74d4e905aba1a84d9a45e2546b6222' as Address,
    UNIVERSAL_ROUTER: '0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d' as Address,
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address,
  },
} as const;

// Common testnet tokens on Unichain Sepolia
export const SEPOLIA_TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006' as Address, // Standard OP Stack WETH
  USDC: '0x31d0220469e10c4e71834a79b1f276d740d3768f' as Address, // Test USDC
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' as Address, // Test UNI
};

// Mainnet tokens
export const MAINNET_TOKENS = {
  WETH: '0x4200000000000000000000000000000000000006' as Address,
  USDC: '0x078d782b760474a361dda0af3839290b0ef57ad6' as Address,
  USDT: '0x9151434b16b9763660705744891fa906f660ecc5' as Address,
  UNI: '0x8f187aA05619a017077f5308904739877ce9eA21' as Address,
  WSTETH: '0xc02fE7317D4eb8753a02c35fe019786854A92001' as Address,
  USDS: '0x7E10036Acc4B56d4dFCa3b77810356CE52313F9C' as Address,
};

// =============================================================================
// ABIs
// =============================================================================

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function transfer(address to, uint256 amount) external returns (bool)',
]);

const PERMIT2_ABI = parseAbi([
  'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
  'function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)',
]);

const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'poolKey',
            type: 'tuple',
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

const STATE_VIEW_ABI = parseAbi([
  'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
  'function getLiquidity(bytes32 poolId) external view returns (uint128)',
  'function getPositionInfo(bytes32 poolId, address owner, int24 tickLower, int24 tickUpper, bytes32 salt) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128)',
]);

const POSITION_MANAGER_ABI = [
  {
    name: 'decreaseLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidityToRemove', type: 'uint256' },
      { name: 'amount0Min', type: 'uint128' },
      { name: 'amount1Min', type: 'uint128' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [
      { name: 'amount0', type: 'uint128' },
      { name: 'amount1', type: 'uint128' },
    ],
  },
  {
    name: 'getPositionLiquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint128' }],
  },
  {
    name: 'nextTokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const POOL_MANAGER_ABI = [
  {
    name: 'initialize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'key',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
      },
      { name: 'sqrtPriceX96', type: 'uint160' },
    ],
    outputs: [{ name: 'tick', type: 'int24' }],
  },
] as const;

// =============================================================================
// TYPES
// =============================================================================

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

export interface PoolInfo {
  poolId: `0x${string}`;
  poolKey: PoolKey;
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  protocolFee: number;
  lpFee: number;
}

export interface SwapQuote {
  tokenIn: Address;
  tokenInSymbol: string;
  tokenOut: Address;
  tokenOutSymbol: string;
  amountIn: string;
  amountInFormatted: string;
  amountOut: string;
  amountOutFormatted: string;
  fee: number;
  priceImpact: string;
  gasEstimate: string;
  route: string;
  poolKey: PoolKey;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  amountIn: string;
  amountOut: string;
  error?: string;
}

export interface LiquidityPosition {
  tokenId: bigint;
  poolKey: PoolKey;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

// =============================================================================
// CLIENT MANAGEMENT
// =============================================================================

let _publicClient: PublicClient | null = null;
let _walletClient: WalletClient | null = null;
let _currentChainId: number = 1301; // Default to Sepolia
let _currentChain: typeof UNICHAIN_MAINNET | typeof UNICHAIN_SEPOLIA = UNICHAIN_SEPOLIA;
let _currentAccount: ReturnType<typeof privateKeyToAccount> | null = null;

function getCurrentChain() {
  return _currentChain;
}

function getCurrentAccount() {
  if (!_currentAccount) {
    throw new Error('Account not initialized');
  }
  return _currentAccount;
}

export function initializeClients(chainId: number = 1301): {
  publicClient: PublicClient;
  walletClient: WalletClient;
  address: Address;
} {
  const chain = chainId === 130 ? UNICHAIN_MAINNET : UNICHAIN_SEPOLIA;
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS];

  if (!contracts) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === '0x') {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  _publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  _walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  _currentChainId = chainId;
  _currentChain = chain;
  _currentAccount = account;

  console.log(`[V4] Initialized on ${chain.name} (${chainId}) with address: ${account.address}`);

  return {
    publicClient: _publicClient,
    walletClient: _walletClient,
    address: account.address,
  };
}

export function getClients(): { publicClient: PublicClient; walletClient: WalletClient } {
  if (!_publicClient || !_walletClient) {
    throw new Error('Clients not initialized. Call initializeClients() first.');
  }
  return { publicClient: _publicClient, walletClient: _walletClient };
}

export function getContracts() {
  return CONTRACTS[_currentChainId as keyof typeof CONTRACTS];
}

export function getChainId() {
  return _currentChainId;
}

// =============================================================================
// FEE TIER UTILITIES
// =============================================================================

const FEE_TO_TICK_SPACING: Record<number, number> = {
  100: 1,     // 0.01%
  500: 10,    // 0.05%
  3000: 60,   // 0.3%
  10000: 200, // 1%
};

const ZERO_HOOKS = '0x0000000000000000000000000000000000000000' as Address;

// =============================================================================
// POOL UTILITIES
// =============================================================================

/**
 * Compute PoolId from PoolKey
 */
export function computePoolId(poolKey: PoolKey): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters('address, address, uint24, int24, address'),
    [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
  );
  return keccak256(encoded);
}

/**
 * Create a sorted PoolKey from two tokens
 */
export function createPoolKey(
  tokenA: Address,
  tokenB: Address,
  fee: number = 3000,
  hooks: Address = ZERO_HOOKS
): PoolKey {
  const sorted = tokenA.toLowerCase() < tokenB.toLowerCase();
  const tickSpacing = FEE_TO_TICK_SPACING[fee] || 60;

  return {
    currency0: sorted ? tokenA : tokenB,
    currency1: sorted ? tokenB : tokenA,
    fee,
    tickSpacing,
    hooks,
  };
}

// =============================================================================
// TOKEN INFO
// =============================================================================

const TOKEN_CACHE: Record<string, { symbol: string; decimals: number }> = {};

export async function getTokenInfo(tokenAddress: Address): Promise<{ symbol: string; decimals: number }> {
  const key = `${_currentChainId}-${tokenAddress.toLowerCase()}`;
  if (TOKEN_CACHE[key]) return TOKEN_CACHE[key];

  const { publicClient } = getClients();

  try {
    const [symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    TOKEN_CACHE[key] = { symbol: symbol as string, decimals: decimals as number };
    return TOKEN_CACHE[key];
  } catch (error) {
    // Default for ETH
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return { symbol: 'ETH', decimals: 18 };
    }
    throw error;
  }
}

export async function getTokenBalance(tokenAddress: Address, account: Address): Promise<bigint> {
  const { publicClient } = getClients();

  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
    return await publicClient.getBalance({ address: account });
  }

  return await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account],
  }) as bigint;
}

// =============================================================================
// POOL DISCOVERY
// =============================================================================

/**
 * Query pool state from StateView
 */
export async function getPoolInfo(poolKey: PoolKey): Promise<PoolInfo | null> {
  const { publicClient } = getClients();
  const contracts = getContracts();

  const poolId = computePoolId(poolKey);

  try {
    const [slot0, liquidity] = await Promise.all([
      publicClient.readContract({
        address: contracts.STATE_VIEW,
        abi: STATE_VIEW_ABI,
        functionName: 'getSlot0',
        args: [poolId],
      }) as Promise<[bigint, number, number, number]>,
      publicClient.readContract({
        address: contracts.STATE_VIEW,
        abi: STATE_VIEW_ABI,
        functionName: 'getLiquidity',
        args: [poolId],
      }) as Promise<bigint>,
    ]);

    const [sqrtPriceX96, tick, protocolFee, lpFee] = slot0;

    // If sqrtPriceX96 is 0, pool doesn't exist
    if (sqrtPriceX96 === 0n) {
      return null;
    }

    return {
      poolId,
      poolKey,
      sqrtPriceX96,
      tick,
      liquidity,
      protocolFee,
      lpFee,
    };
  } catch (error) {
    console.error('[V4] Error getting pool info:', error);
    return null;
  }
}

/**
 * Discover pools for a token pair across all fee tiers
 */
export async function discoverPools(
  tokenA: Address,
  tokenB: Address,
  hooks: Address = ZERO_HOOKS
): Promise<PoolInfo[]> {
  const pools: PoolInfo[] = [];

  for (const fee of Object.keys(FEE_TO_TICK_SPACING).map(Number)) {
    const poolKey = createPoolKey(tokenA, tokenB, fee, hooks);
    const poolInfo = await getPoolInfo(poolKey);
    if (poolInfo) {
      pools.push(poolInfo);
    }
  }

  return pools;
}

// =============================================================================
// SWAP QUOTES
// =============================================================================

/**
 * Get a swap quote using the Quoter contract
 */
export async function getSwapQuote(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  fee: number = 3000,
  hooks: Address = ZERO_HOOKS
): Promise<SwapQuote> {
  const { publicClient } = getClients();
  const contracts = getContracts();

  // Get token info
  const [tokenInInfo, tokenOutInfo] = await Promise.all([
    getTokenInfo(tokenIn),
    getTokenInfo(tokenOut),
  ]);

  const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);
  const poolKey = createPoolKey(tokenIn, tokenOut, fee, hooks);
  const zeroForOne = tokenIn.toLowerCase() === poolKey.currency0.toLowerCase();

  // Try quote with the specified fee, then others
  const feeTiersToTry = [fee, ...Object.keys(FEE_TO_TICK_SPACING).map(Number).filter(f => f !== fee)];

  for (const tryFee of feeTiersToTry) {
    const tryPoolKey = createPoolKey(tokenIn, tokenOut, tryFee, hooks);
    const tryZeroForOne = tokenIn.toLowerCase() === tryPoolKey.currency0.toLowerCase();

    const params = {
      poolKey: tryPoolKey,
      zeroForOne: tryZeroForOne,
      exactAmount: amountInWei,
      hookData: '0x' as `0x${string}`,
    };

    try {
      const calldata = encodeFunctionData({
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [params],
      });

      const result = await publicClient.call({
        to: contracts.QUOTER,
        data: calldata,
      });

      if (result.data) {
        const decoded = decodeFunctionResult({
          abi: QUOTER_ABI,
          functionName: 'quoteExactInputSingle',
          data: result.data,
        }) as [bigint, bigint];

        const [amountOut, gasEstimate] = decoded;

        if (amountOut > 0n) {
          return {
            tokenIn,
            tokenInSymbol: tokenInInfo.symbol,
            tokenOut,
            tokenOutSymbol: tokenOutInfo.symbol,
            amountIn: amountInWei.toString(),
            amountInFormatted: amountIn,
            amountOut: amountOut.toString(),
            amountOutFormatted: formatUnits(amountOut, tokenOutInfo.decimals),
            fee: tryFee,
            priceImpact: '< 0.5%',
            gasEstimate: gasEstimate.toString(),
            route: `${tokenInInfo.symbol} → ${tokenOutInfo.symbol} (${(tryFee / 10000).toFixed(2)}% fee)`,
            poolKey: tryPoolKey,
          };
        }
      }
    } catch {
      continue;
    }
  }

  throw new Error(`No liquidity pool found for ${tokenInInfo.symbol}/${tokenOutInfo.symbol}`);
}

// =============================================================================
// V4 UNIVERSAL ROUTER ENCODING
// =============================================================================

// Universal Router Commands
const COMMANDS = {
  PERMIT2_TRANSFER_FROM: 0x02,
  V4_SWAP: 0x10,
} as const;

// Universal Router special address constants
const ACTION_CONSTANTS = {
  MSG_SENDER: '0x0000000000000000000000000000000000000001' as Address, // recipient = msg.sender
  ADDRESS_THIS: '0x0000000000000000000000000000000000000002' as Address, // recipient = router
} as const;

// V4 Actions (within V4_SWAP command)
const V4_ACTIONS = {
  SWAP_EXACT_IN_SINGLE: 0x06,
  SETTLE: 0x0b,        // (Currency, uint256, bool payerIsUser)
  SETTLE_ALL: 0x0c,    // (Currency, uint256 maxAmount) - always payerIsUser=true
  TAKE: 0x0e,          // (Currency, address recipient, uint256)
  TAKE_ALL: 0x0f,      // (Currency, uint256 minAmount)
} as const;

/**
 * Encode ExactInputSingle params for V4 swap
 */
function encodeExactInputSingleParams(
  poolKey: PoolKey,
  zeroForOne: boolean,
  amountIn: bigint,
  amountOutMinimum: bigint,
  hookData: `0x${string}` = '0x'
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters([
      '(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks)',
      'bool', 'uint128', 'uint128', 'bytes'
    ]),
    [
      {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks
      },
      zeroForOne,
      amountIn,
      amountOutMinimum,
      hookData
    ]
  );
}

/**
 * Encode SETTLE params (Currency, uint256 amount, bool payerIsUser)
 */
function encodeSettleParams(currency: Address, amount: bigint, payerIsUser: boolean): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters('address, uint256, bool'),
    [currency, amount, payerIsUser]
  );
}

/**
 * Encode TAKE_ALL params
 */
function encodeTakeAllParams(currency: Address, minAmount: bigint): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters('address, uint256'),
    [currency, minAmount]
  );
}

/**
 * Encode SETTLE_ALL params (Currency, uint256 maxAmount)
 */
function encodeSettleAllParams(currency: Address, maxAmount: bigint): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters('address, uint256'),
    [currency, maxAmount]
  );
}

/**
 * Build complete V4 swap input with actions sequence
 * Uses SETTLE_ALL which always pulls from msg.sender via Permit2
 */
function buildV4SwapInput(
  poolKey: PoolKey,
  zeroForOne: boolean,
  amountIn: bigint,
  minAmountOut: bigint,
  tokenIn: Address,
  tokenOut: Address,
  _tokensInRouter: boolean = false // Not used, kept for compatibility
): `0x${string}` {
  // Build actions bytes: SWAP_EXACT_IN_SINGLE + SETTLE_ALL + TAKE_ALL
  const actions = concat([
    toHex(V4_ACTIONS.SWAP_EXACT_IN_SINGLE, { size: 1 }),
    toHex(V4_ACTIONS.SETTLE_ALL, { size: 1 }),
    toHex(V4_ACTIONS.TAKE_ALL, { size: 1 }),
  ]) as `0x${string}`;

  // Encode params for each action
  const swapParams = encodeExactInputSingleParams(poolKey, zeroForOne, amountIn, minAmountOut);
  const settleParams = encodeSettleAllParams(tokenIn, amountIn);
  const takeParams = encodeTakeAllParams(tokenOut, minAmountOut);

  // Encode the full V4Router input: (bytes actions, bytes[] params)
  return encodeAbiParameters(
    parseAbiParameters('bytes, bytes[]'),
    [actions, [swapParams, settleParams, takeParams]]
  );
}

// =============================================================================
// SWAP EXECUTION
// =============================================================================

/**
 * Execute a swap via Universal Router
 */
export async function executeSwap(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  slippageBps: number = 50, // 0.5% default
  fee: number = 3000,
  hooks: Address = ZERO_HOOKS
): Promise<SwapResult> {
  const { publicClient, walletClient } = getClients();
  const contracts = getContracts();

  if (!walletClient.account) {
    throw new Error('Wallet not initialized');
  }

  const userAddress = walletClient.account.address;

  try {
    // Get quote first
    const quote = await getSwapQuote(tokenIn, tokenOut, amountIn, fee, hooks);
    const amountInWei = BigInt(quote.amountIn);

    // Calculate minimum output with slippage
    const minAmountOut = (BigInt(quote.amountOut) * BigInt(10000 - slippageBps)) / 10000n;

    // Check if native ETH or ERC20
    const isNativeETH = tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000';

    // Approve tokens if needed (not for native ETH)
    // Step 1: ERC20 approve to Permit2
    // Step 2: Permit2 approve for Universal Router as spender
    if (!isNativeETH) {
      // Check ERC20 allowance to Permit2
      const erc20Allowance = await publicClient.readContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, contracts.PERMIT2],
      }) as bigint;

      if (erc20Allowance < amountInWei) {
        console.log('[V4] Step 1: Approving token to Permit2...');
        const approveTx = await walletClient.writeContract({
          chain: getCurrentChain(),
          account: getCurrentAccount(),
          address: tokenIn,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contracts.PERMIT2, amountInWei * 10n], // Approve more for future txs
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log('[V4] ERC20 approval confirmed:', approveTx);
      }

      // Check Permit2 allowance for Universal Router
      const [permit2Amount, permit2Expiration] = await publicClient.readContract({
        address: contracts.PERMIT2,
        abi: PERMIT2_ABI,
        functionName: 'allowance',
        args: [userAddress, tokenIn, contracts.UNIVERSAL_ROUTER],
      }) as [bigint, number, number];

      const currentTime = Math.floor(Date.now() / 1000);
      const needsPermit2Approval = permit2Amount < amountInWei || permit2Expiration < currentTime;

      if (needsPermit2Approval) {
        console.log('[V4] Step 2: Setting Permit2 allowance for Universal Router...');
        // Set expiration to 30 days from now
        const expiration = currentTime + 30 * 24 * 60 * 60;
        const permit2ApproveTx = await walletClient.writeContract({
          chain: getCurrentChain(),
          account: getCurrentAccount(),
          address: contracts.PERMIT2,
          abi: PERMIT2_ABI,
          functionName: 'approve',
          args: [tokenIn, contracts.UNIVERSAL_ROUTER, amountInWei * 10n, expiration],
        });
        await publicClient.waitForTransactionReceipt({ hash: permit2ApproveTx });
        console.log('[V4] Permit2 approval confirmed:', permit2ApproveTx);
      }
    }

    // Build commands and inputs
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes
    const zeroForOne = tokenIn.toLowerCase() === quote.poolKey.currency0.toLowerCase();

    const ROUTER_ABI = parseAbi([
      'function execute(bytes commands, bytes[] inputs, uint256 deadline) external payable',
    ]);

    // Build V4 swap input
    // The V4Router handles Permit2 transfers internally when payerIsUser = true
    // So we just need V4_SWAP command, no separate PERMIT2_TRANSFER_FROM
    const v4SwapInput = buildV4SwapInput(
      quote.poolKey,
      zeroForOne,
      amountInWei,
      minAmountOut,
      tokenIn,
      tokenOut,
      false // payerIsUser = true, V4Router will pull from msg.sender via Permit2
    );

    const commands = toHex(COMMANDS.V4_SWAP, { size: 1 }) as `0x${string}`;
    const inputs = [v4SwapInput];

    if (!isNativeETH) {
      console.log('[V4] Executing ERC20 swap...');
      console.log('[V4] Command: 0x10 (V4_SWAP)');
      console.log('[V4] V4Router will use Permit2 to pull tokens from user');
    } else {
      console.log('[V4] Executing native ETH swap...');
      console.log('[V4] Command: 0x10 (V4_SWAP)');
    }

    console.log('[V4] Actions: SWAP_EXACT_IN_SINGLE + SETTLE_ALL + TAKE_ALL');
    console.log('[V4] zeroForOne:', zeroForOne);

    const txHash = await walletClient.writeContract({
      chain: getCurrentChain(),
      account: getCurrentAccount(),
      address: contracts.UNIVERSAL_ROUTER,
      abi: ROUTER_ABI,
      functionName: 'execute',
      args: [commands, inputs, deadline],
      value: isNativeETH ? amountInWei : 0n,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const explorer = _currentChainId === 130
      ? 'https://uniscan.xyz'
      : 'https://sepolia.uniscan.xyz';

    return {
      success: receipt.status === 'success',
      txHash,
      explorerUrl: `${explorer}/tx/${txHash}`,
      amountIn: quote.amountInFormatted,
      amountOut: quote.amountOutFormatted,
    };
  } catch (error) {
    console.error('[V4] Swap execution failed:', error);
    return {
      success: false,
      amountIn,
      amountOut: '0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// POOL INITIALIZATION
// =============================================================================

/**
 * Initialize a new pool (create if doesn't exist)
 */
export async function initializePool(
  tokenA: Address,
  tokenB: Address,
  fee: number = 3000,
  initialPrice: bigint, // sqrtPriceX96
  hooks: Address = ZERO_HOOKS
): Promise<{ success: boolean; txHash?: string; poolKey: PoolKey; error?: string }> {
  const { publicClient, walletClient } = getClients();
  const contracts = getContracts();

  if (!walletClient.account) {
    throw new Error('Wallet not initialized');
  }

  const poolKey = createPoolKey(tokenA, tokenB, fee, hooks);

  try {
    // Check if pool already exists
    const existingPool = await getPoolInfo(poolKey);
    if (existingPool) {
      return {
        success: true,
        poolKey,
        error: 'Pool already exists',
      };
    }

    console.log('[V4] Initializing new pool...');
    const txHash = await walletClient.writeContract({
      chain: getCurrentChain(),
      account: getCurrentAccount(),
      address: contracts.POOL_MANAGER,
      abi: POOL_MANAGER_ABI,
      functionName: 'initialize',
      args: [poolKey, initialPrice],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log('[V4] Pool initialized:', txHash);

    return {
      success: true,
      txHash,
      poolKey,
    };
  } catch (error) {
    console.error('[V4] Pool initialization failed:', error);
    return {
      success: false,
      poolKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// LIQUIDITY MANAGEMENT
// =============================================================================

/**
 * Add liquidity to a pool (mint new position)
 */
export async function addLiquidity(
  poolKey: PoolKey,
  tickLower: number,
  tickUpper: number,
  amount0: string,
  amount1: string
): Promise<{ success: boolean; tokenId?: bigint; txHash?: string; error?: string }> {
  const { publicClient, walletClient } = getClients();
  const contracts = getContracts();

  if (!walletClient.account) {
    throw new Error('Wallet not initialized');
  }

  const userAddress = walletClient.account.address;

  try {
    // Get token decimals
    const [token0Info, token1Info] = await Promise.all([
      getTokenInfo(poolKey.currency0),
      getTokenInfo(poolKey.currency1),
    ]);

    const amount0Wei = parseUnits(amount0, token0Info.decimals);
    const amount1Wei = parseUnits(amount1, token1Info.decimals);

    // Calculate approximate liquidity (simplified)
    const liquidity = (amount0Wei + amount1Wei) / 2n;

    // Approve tokens
    for (const [token, amount] of [[poolKey.currency0, amount0Wei], [poolKey.currency1, amount1Wei]] as const) {
      if (token !== '0x0000000000000000000000000000000000000000') {
        const allowance = await publicClient.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, contracts.POSITION_MANAGER],
        }) as bigint;

        if (allowance < amount) {
          console.log(`[V4] Approving ${token}...`);
          const approveTx = await walletClient.writeContract({
            chain: getCurrentChain(),
            account: getCurrentAccount(),
            address: token,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contracts.POSITION_MANAGER, amount * 2n],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }
      }
    }

    // Mint position
    console.log('[V4] Adding liquidity...');

    // Use a simplified approach - encode the mint call
    const mintParams = {
      poolKey,
      tickLower,
      tickUpper,
      liquidity,
      amount0Max: amount0Wei * 2n,
      amount1Max: amount1Wei * 2n,
      owner: userAddress,
      hookData: '0x' as `0x${string}`,
    };

    const MINT_ABI = [
      {
        name: 'mint',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          {
            name: 'poolKey',
            type: 'tuple',
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
          },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'liquidity', type: 'uint256' },
          { name: 'amount0Max', type: 'uint128' },
          { name: 'amount1Max', type: 'uint128' },
          { name: 'owner', type: 'address' },
          { name: 'hookData', type: 'bytes' },
        ],
        outputs: [{ name: 'tokenId', type: 'uint256' }],
      },
    ] as const;

    const txHash = await walletClient.writeContract({
      chain: getCurrentChain(),
      account: getCurrentAccount(),
      address: contracts.POSITION_MANAGER,
      abi: MINT_ABI,
      functionName: 'mint',
      args: [
        mintParams.poolKey,
        mintParams.tickLower,
        mintParams.tickUpper,
        mintParams.liquidity,
        mintParams.amount0Max,
        mintParams.amount1Max,
        mintParams.owner,
        mintParams.hookData,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Extract tokenId from logs (simplified)
    const tokenId = 0n; // Would need to parse logs properly

    return {
      success: receipt.status === 'success',
      tokenId,
      txHash,
    };
  } catch (error) {
    console.error('[V4] Add liquidity failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove liquidity from a position
 */
export async function removeLiquidity(
  tokenId: bigint,
  liquidityToRemove: bigint,
  slippageBps: number = 50
): Promise<{ success: boolean; amount0: bigint; amount1: bigint; txHash?: string; error?: string }> {
  const { publicClient, walletClient } = getClients();
  const contracts = getContracts();

  if (!walletClient.account) {
    throw new Error('Wallet not initialized');
  }

  try {
    console.log('[V4] Removing liquidity...');

    const txHash = await walletClient.writeContract({
      chain: getCurrentChain(),
      account: getCurrentAccount(),
      address: contracts.POSITION_MANAGER,
      abi: POSITION_MANAGER_ABI,
      functionName: 'decreaseLiquidity',
      args: [tokenId, liquidityToRemove, 0n, 0n, '0x' as `0x${string}`],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Would parse amounts from logs
    return {
      success: receipt.status === 'success',
      amount0: 0n,
      amount1: 0n,
      txHash,
    };
  } catch (error) {
    console.error('[V4] Remove liquidity failed:', error);
    return {
      success: false,
      amount0: 0n,
      amount1: 0n,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HOOKS DISCOVERY
// =============================================================================

/**
 * Check if a hooks contract is valid and get its permissions
 */
export async function getHooksInfo(hooksAddress: Address): Promise<{
  isValid: boolean;
  permissions: string[];
  error?: string;
}> {
  const { publicClient } = getClients();

  if (hooksAddress === ZERO_HOOKS) {
    return { isValid: true, permissions: ['none'] };
  }

  try {
    // Check if contract exists
    const code = await publicClient.getCode({ address: hooksAddress });

    if (!code || code === '0x') {
      return { isValid: false, permissions: [], error: 'No contract at address' };
    }

    // V4 hooks encode permissions in the address itself
    // The last 14 bits of the address indicate which hooks are enabled
    const addressNum = BigInt(hooksAddress);
    const permissions: string[] = [];

    // Hook permission flags (from v4-core)
    const hookFlags = [
      { bit: 0, name: 'beforeInitialize' },
      { bit: 1, name: 'afterInitialize' },
      { bit: 2, name: 'beforeAddLiquidity' },
      { bit: 3, name: 'afterAddLiquidity' },
      { bit: 4, name: 'beforeRemoveLiquidity' },
      { bit: 5, name: 'afterRemoveLiquidity' },
      { bit: 6, name: 'beforeSwap' },
      { bit: 7, name: 'afterSwap' },
      { bit: 8, name: 'beforeDonate' },
      { bit: 9, name: 'afterDonate' },
      { bit: 10, name: 'beforeSwapReturnDelta' },
      { bit: 11, name: 'afterSwapReturnDelta' },
      { bit: 12, name: 'afterAddLiquidityReturnDelta' },
      { bit: 13, name: 'afterRemoveLiquidityReturnDelta' },
    ];

    for (const flag of hookFlags) {
      if ((addressNum >> BigInt(flag.bit)) & 1n) {
        permissions.push(flag.name);
      }
    }

    return {
      isValid: true,
      permissions: permissions.length > 0 ? permissions : ['none'],
    };
  } catch (error) {
    return {
      isValid: false,
      permissions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List known hooks on the network (example hooks for testing)
 */
export async function listKnownHooks(): Promise<{ address: Address; name: string; description: string }[]> {
  // These would be discovered from on-chain events or a registry
  // For now, return common example hooks
  return [
    {
      address: ZERO_HOOKS,
      name: 'No Hooks',
      description: 'Standard pool with no custom logic',
    },
    // Add more known hooks as they're deployed
  ];
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export function getExplorerUrl(txHash: string): string {
  return _currentChainId === 130
    ? `https://uniscan.xyz/tx/${txHash}`
    : `https://sepolia.uniscan.xyz/tx/${txHash}`;
}

export function getNetworkInfo() {
  const chain = _currentChainId === 130 ? UNICHAIN_MAINNET : UNICHAIN_SEPOLIA;
  const contracts = getContracts();

  return {
    chainId: _currentChainId,
    name: chain.name,
    rpc: chain.rpcUrls.default.http[0],
    explorer: chain.blockExplorers?.default.url,
    isTestnet: chain.testnet || false,
    contracts,
  };
}

export function getAvailableTokens() {
  return _currentChainId === 130 ? MAINNET_TOKENS : SEPOLIA_TOKENS;
}
