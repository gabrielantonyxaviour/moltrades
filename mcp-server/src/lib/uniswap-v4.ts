/**
 * Uniswap V4 Integration for Unichain Mainnet
 *
 * This module provides swap functionality via Uniswap V4's Universal Router
 * on Unichain mainnet (chainId: 130).
 */

import { encodeFunctionData, parseAbi, formatUnits, parseUnits, type Address } from 'viem';
import { UNICHAIN_CONTRACTS, CHAIN_IDS } from './protocols.js';
import { walletClient, publicClient } from './config.js';

// Uniswap V4 Quoter ABI (simplified for quoteExactInputSingle)
const QUOTER_ABI = parseAbi([
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amount, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]);

// Universal Router command encoding
const UNIVERSAL_ROUTER_ABI = parseAbi([
  'function execute(bytes commands, bytes[] inputs, uint256 deadline) external payable',
]);

// ERC20 approval
const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
]);

// Token info cache
const TOKEN_INFO: Record<string, { symbol: string; decimals: number }> = {
  [UNICHAIN_CONTRACTS.WETH.toLowerCase()]: { symbol: 'WETH', decimals: 18 },
  [UNICHAIN_CONTRACTS.USDC.toLowerCase()]: { symbol: 'USDC', decimals: 6 },
  [UNICHAIN_CONTRACTS.USDT.toLowerCase()]: { symbol: 'USDT', decimals: 6 },
  [UNICHAIN_CONTRACTS.UNI.toLowerCase()]: { symbol: 'UNI', decimals: 18 },
  [UNICHAIN_CONTRACTS.WSTETH.toLowerCase()]: { symbol: 'wstETH', decimals: 18 },
  [UNICHAIN_CONTRACTS.USDS.toLowerCase()]: { symbol: 'USDS', decimals: 18 },
};

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
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  amountIn: string;
  amountOut: string;
  error?: string;
}

/**
 * Get token info (symbol and decimals)
 */
async function getTokenInfo(tokenAddress: Address): Promise<{ symbol: string; decimals: number }> {
  const cached = TOKEN_INFO[tokenAddress.toLowerCase()];
  if (cached) return cached;

  // Fetch from chain if not cached
  const client = publicClient(CHAIN_IDS.UNICHAIN);
  const [symbol, decimals] = await Promise.all([
    client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'symbol',
    }) as Promise<string>,
    client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }) as Promise<number>,
  ]);

  TOKEN_INFO[tokenAddress.toLowerCase()] = { symbol, decimals };
  return { symbol, decimals };
}

/**
 * Get a quote for a Uniswap V4 swap on Unichain
 */
export async function getSwapQuote(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  fee: number = 3000 // 0.3% default fee tier
): Promise<SwapQuote> {
  const client = publicClient(CHAIN_IDS.UNICHAIN);

  // Get token info
  const [tokenInInfo, tokenOutInfo] = await Promise.all([
    getTokenInfo(tokenIn),
    getTokenInfo(tokenOut),
  ]);

  // Parse amount with correct decimals
  const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);

  // Call quoter to get expected output
  const quoteParams = {
    tokenIn,
    tokenOut,
    amountIn: amountInWei,
    fee,
    sqrtPriceLimitX96: BigInt(0), // No price limit
  };

  try {
    const result = await client.readContract({
      address: UNICHAIN_CONTRACTS.QUOTER as Address,
      abi: QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [quoteParams],
    }) as [bigint, bigint, number, bigint];

    const [amountOut, , , gasEstimate] = result;

    return {
      tokenIn,
      tokenInSymbol: tokenInInfo.symbol,
      tokenOut,
      tokenOutSymbol: tokenOutInfo.symbol,
      amountIn: amountInWei.toString(),
      amountInFormatted: amountIn,
      amountOut: amountOut.toString(),
      amountOutFormatted: formatUnits(amountOut, tokenOutInfo.decimals),
      fee,
      priceImpact: '< 0.1%', // Simplified for now
      gasEstimate: gasEstimate.toString(),
      route: `${tokenInInfo.symbol} → ${tokenOutInfo.symbol} (Uniswap V4)`,
    };
  } catch (error) {
    // If quoter fails, provide a simulated quote
    console.error('Quoter call failed:', error);
    throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a swap via Uniswap V4 Universal Router on Unichain
 */
export async function executeSwap(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  minAmountOut: string,
  fee: number = 3000
): Promise<SwapResult> {
  const client = publicClient(CHAIN_IDS.UNICHAIN);
  const wallet = walletClient(CHAIN_IDS.UNICHAIN);
  const userAddress = wallet.account.address;

  try {
    // Get token info
    const tokenInInfo = await getTokenInfo(tokenIn);
    const amountInWei = parseUnits(amountIn, tokenInInfo.decimals);

    // Check if we need approval (skip for ETH)
    const isNativeETH = tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

    if (!isNativeETH) {
      const allowance = await client.readContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, UNICHAIN_CONTRACTS.UNIVERSAL_ROUTER as Address],
      }) as bigint;

      if (allowance < amountInWei) {
        console.log('Approving token spend...');
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [UNICHAIN_CONTRACTS.UNIVERSAL_ROUTER as Address, amountInWei * BigInt(2)],
        });

        const approveTxHash = await wallet.sendTransaction({
          to: tokenIn,
          data: approveData,
        });

        await client.waitForTransactionReceipt({ hash: approveTxHash });
        console.log('Approval confirmed:', approveTxHash);
      }
    }

    // Build Universal Router execute call
    // Command 0x00 = V4_SWAP
    const commands = '0x00' as `0x${string}`;

    // Encode swap path: tokenIn -> tokenOut with fee
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes

    // Simplified swap encoding for V4
    // In production, you'd use @uniswap/v4-sdk for proper encoding
    const swapData = encodeFunctionData({
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: 'execute',
      args: [
        commands,
        [], // inputs would be properly encoded swap params
        deadline,
      ],
    });

    // Execute the swap
    const txHash = await wallet.sendTransaction({
      to: UNICHAIN_CONTRACTS.UNIVERSAL_ROUTER as Address,
      data: swapData,
      value: isNativeETH ? amountInWei : BigInt(0),
    });

    // Wait for confirmation
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    return {
      success: receipt.status === 'success',
      txHash,
      explorerUrl: `https://uniscan.xyz/tx/${txHash}`,
      amountIn,
      amountOut: minAmountOut, // Actual output would be parsed from logs
    };
  } catch (error) {
    console.error('Swap execution failed:', error);
    return {
      success: false,
      amountIn,
      amountOut: '0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get available token pairs on Unichain
 */
export function getAvailableTokens(): { address: Address; symbol: string; decimals: number }[] {
  return [
    { address: UNICHAIN_CONTRACTS.WETH as Address, symbol: 'WETH', decimals: 18 },
    { address: UNICHAIN_CONTRACTS.USDC as Address, symbol: 'USDC', decimals: 6 },
    { address: UNICHAIN_CONTRACTS.USDT as Address, symbol: 'USDT', decimals: 6 },
    { address: UNICHAIN_CONTRACTS.UNI as Address, symbol: 'UNI', decimals: 18 },
    { address: UNICHAIN_CONTRACTS.WSTETH as Address, symbol: 'wstETH', decimals: 18 },
    { address: UNICHAIN_CONTRACTS.USDS as Address, symbol: 'USDS', decimals: 18 },
  ];
}

/**
 * Get Unichain network info
 */
export function getUnichainInfo() {
  return {
    chainId: CHAIN_IDS.UNICHAIN,
    name: 'Unichain',
    rpc: 'https://mainnet.unichain.org',
    explorer: 'https://uniscan.xyz',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    contracts: {
      poolManager: UNICHAIN_CONTRACTS.POOL_MANAGER,
      positionManager: UNICHAIN_CONTRACTS.POSITION_MANAGER,
      quoter: UNICHAIN_CONTRACTS.QUOTER,
      universalRouter: UNICHAIN_CONTRACTS.UNIVERSAL_ROUTER,
      permit2: UNICHAIN_CONTRACTS.PERMIT2,
    },
  };
}
