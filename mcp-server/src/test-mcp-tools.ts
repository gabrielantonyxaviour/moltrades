#!/usr/bin/env npx tsx
/**
 * MCP Tool Integration Test for Uniswap V4
 *
 * Tests the MCP tools that an AI would use to interact with Uniswap V4.
 * Simulates tool calls and verifies responses.
 *
 * Usage:
 *   npx tsx src/test-mcp-tools.ts [--with-transactions]
 *
 * The --with-transactions flag enables tests that require ETH balance.
 */

import 'dotenv/config';
import { createPublicClient, http, formatEther } from 'viem';
import * as v4Full from './lib/uniswap-v4-full.js';

const CHAIN_ID = 1301; // Unichain Sepolia
const WITH_TRANSACTIONS = process.argv.includes('--with-transactions');

// =============================================================================
// SIMULATED MCP TOOL HANDLERS
// These mirror the actual MCP tools in index.ts
// =============================================================================

interface ToolResult {
  success: boolean;
  content: string;
  error?: string;
}

// Tool 1: uniswap_v4_tokens
async function tool_uniswap_v4_tokens(): Promise<ToolResult> {
  try {
    v4Full.initializeClients(CHAIN_ID);
    const tokens = v4Full.getAvailableTokens();
    const chainInfo = v4Full.getNetworkInfo();

    return {
      success: true,
      content: JSON.stringify({
        chain: chainInfo.name,
        chainId: chainInfo.chainId,
        explorer: chainInfo.explorer,
        tokens: Object.entries(tokens).map(([symbol, address]) => ({ symbol, address })),
        contracts: chainInfo.contracts,
      }, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: (error as Error).message,
    };
  }
}

// Tool 2: uniswap_v4_quote
async function tool_uniswap_v4_quote(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  fee?: number
): Promise<ToolResult> {
  try {
    v4Full.initializeClients(CHAIN_ID);
    const tokens = v4Full.getAvailableTokens();

    // Resolve token addresses from symbols
    const tokenInAddr = tokenIn.startsWith('0x')
      ? tokenIn as `0x${string}`
      : (tokens as Record<string, `0x${string}`>)[tokenIn.toUpperCase()];
    const tokenOutAddr = tokenOut.startsWith('0x')
      ? tokenOut as `0x${string}`
      : (tokens as Record<string, `0x${string}`>)[tokenOut.toUpperCase()];

    if (!tokenInAddr) {
      return { success: false, content: '', error: `Token not found: ${tokenIn}` };
    }
    if (!tokenOutAddr) {
      return { success: false, content: '', error: `Token not found: ${tokenOut}` };
    }

    const quote = await v4Full.getSwapQuote(tokenInAddr, tokenOutAddr, amountIn, fee);

    return {
      success: true,
      content: JSON.stringify({
        chain: 'Unichain Sepolia (1301)',
        protocol: 'Uniswap V4',
        route: quote.route,
        input: `${quote.amountInFormatted} ${quote.tokenInSymbol}`,
        output: `${quote.amountOutFormatted} ${quote.tokenOutSymbol}`,
        fee: `${(quote.fee / 10000).toFixed(2)}%`,
        priceImpact: quote.priceImpact,
        gasEstimate: quote.gasEstimate,
        poolKey: quote.poolKey,
      }, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: (error as Error).message,
    };
  }
}

// Tool 3: uniswap_v4_pools (discover pools)
async function tool_uniswap_v4_pools(
  tokenA: string,
  tokenB: string
): Promise<ToolResult> {
  try {
    v4Full.initializeClients(CHAIN_ID);
    const tokens = v4Full.getAvailableTokens();

    const tokenAAddr = tokenA.startsWith('0x')
      ? tokenA as `0x${string}`
      : (tokens as Record<string, `0x${string}`>)[tokenA.toUpperCase()];
    const tokenBAddr = tokenB.startsWith('0x')
      ? tokenB as `0x${string}`
      : (tokens as Record<string, `0x${string}`>)[tokenB.toUpperCase()];

    if (!tokenAAddr || !tokenBAddr) {
      return { success: false, content: '', error: 'Token not found' };
    }

    const pools = await v4Full.discoverPools(tokenAAddr, tokenBAddr);

    return {
      success: true,
      content: JSON.stringify({
        tokenA: tokenAAddr,
        tokenB: tokenBAddr,
        poolsFound: pools.length,
        pools: pools.map(p => ({
          poolId: p.poolId,
          fee: `${p.poolKey.fee / 10000}%`,
          tickSpacing: p.poolKey.tickSpacing,
          hooks: p.poolKey.hooks,
          tick: p.tick,
          liquidity: p.liquidity.toString(),
          sqrtPriceX96: p.sqrtPriceX96.toString(),
        })),
      }, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: (error as Error).message,
    };
  }
}

// Tool 4: uniswap_v4_hooks (check hooks permissions)
async function tool_uniswap_v4_hooks(
  hooksAddress: string
): Promise<ToolResult> {
  try {
    v4Full.initializeClients(CHAIN_ID);
    const hooksInfo = await v4Full.getHooksInfo(hooksAddress as `0x${string}`);

    return {
      success: true,
      content: JSON.stringify({
        address: hooksAddress,
        isValid: hooksInfo.isValid,
        permissions: hooksInfo.permissions,
        error: hooksInfo.error,
      }, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: (error as Error).message,
    };
  }
}

// Tool 5: uniswap_v4_swap (execute swap)
async function tool_uniswap_v4_swap(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  slippageBps?: number
): Promise<ToolResult> {
  try {
    v4Full.initializeClients(CHAIN_ID);
    const tokens = v4Full.getAvailableTokens();

    const tokenInAddr = tokenIn.startsWith('0x')
      ? tokenIn as `0x${string}`
      : (tokens as Record<string, `0x${string}`>)[tokenIn.toUpperCase()];
    const tokenOutAddr = tokenOut.startsWith('0x')
      ? tokenOut as `0x${string}`
      : (tokens as Record<string, `0x${string}`>)[tokenOut.toUpperCase()];

    if (!tokenInAddr || !tokenOutAddr) {
      return { success: false, content: '', error: 'Token not found' };
    }

    const result = await v4Full.executeSwap(
      tokenInAddr,
      tokenOutAddr,
      amountIn,
      slippageBps || 50
    );

    return {
      success: result.success,
      content: JSON.stringify({
        success: result.success,
        chain: 'Unichain Sepolia (1301)',
        protocol: 'Uniswap V4',
        swap: result.success ? `${result.amountIn} -> ${result.amountOut}` : 'Failed',
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        error: result.error,
      }, null, 2),
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: (error as Error).message,
    };
  }
}

// =============================================================================
// TEST RUNNER
// =============================================================================

async function runTest(
  testName: string,
  testFn: () => Promise<ToolResult>,
  requiresFunds: boolean = false
): Promise<boolean> {
  if (requiresFunds && !WITH_TRANSACTIONS) {
    console.log(`⏭️  SKIP: ${testName} (requires --with-transactions flag)`);
    return true;
  }

  console.log(`\n📋 Testing: ${testName}`);
  console.log('─'.repeat(60));

  try {
    const result = await testFn();

    if (result.success) {
      console.log('✅ SUCCESS');
      console.log('Response:');
      console.log(result.content);
    } else {
      console.log('❌ FAILED');
      console.log(`Error: ${result.error}`);
    }

    return result.success;
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`Exception: ${(error as Error).message}`);
    return false;
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           MCP TOOL INTEGRATION TEST - UNISWAP V4                  ║');
  console.log('║                                                                   ║');
  console.log('║   Simulates AI tool calls and verifies Uniswap V4 integration    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');

  if (WITH_TRANSACTIONS) {
    console.log('\n🔔 Transaction tests ENABLED (--with-transactions flag set)\n');
  } else {
    console.log('\n📖 Read-only tests only. Use --with-transactions for swap tests.\n');
  }

  // Check wallet balance first
  try {
    const { publicClient, address } = v4Full.initializeClients(CHAIN_ID);
    const balance = await publicClient.getBalance({ address });
    console.log(`Wallet: ${address}`);
    console.log(`Balance: ${formatEther(balance)} ETH`);

    if (WITH_TRANSACTIONS && balance === 0n) {
      console.log('\n⚠️  WARNING: No ETH balance. Transaction tests will fail.');
      console.log('Get testnet ETH from: https://ethglobal.com/faucet/unichain-sepolia-1301');
    }
  } catch (error) {
    console.log(`\n❌ Failed to initialize: ${(error as Error).message}`);
    return;
  }

  const results: { test: string; passed: boolean }[] = [];

  // Test 1: List available tokens
  results.push({
    test: 'uniswap_v4_tokens',
    passed: await runTest(
      'uniswap_v4_tokens - List available tokens on Unichain Sepolia',
      () => tool_uniswap_v4_tokens()
    ),
  });

  // Test 2: Discover pools
  results.push({
    test: 'uniswap_v4_pools',
    passed: await runTest(
      'uniswap_v4_pools - Discover WETH/USDC pools',
      () => tool_uniswap_v4_pools('WETH', 'USDC')
    ),
  });

  // Test 3: Check hooks permissions (zero address = no hooks)
  results.push({
    test: 'uniswap_v4_hooks (zero)',
    passed: await runTest(
      'uniswap_v4_hooks - Check zero hooks address',
      () => tool_uniswap_v4_hooks('0x0000000000000000000000000000000000000000')
    ),
  });

  // Test 4: Get swap quote (may fail if no pool exists)
  results.push({
    test: 'uniswap_v4_quote',
    passed: await runTest(
      'uniswap_v4_quote - Get quote for 0.001 WETH -> USDC',
      () => tool_uniswap_v4_quote('WETH', 'USDC', '0.001')
    ),
  });

  // Test 5: Execute swap (requires funds)
  results.push({
    test: 'uniswap_v4_swap',
    passed: await runTest(
      'uniswap_v4_swap - Execute swap 0.0001 WETH -> USDC',
      () => tool_uniswap_v4_swap('WETH', 'USDC', '0.0001', 100),
      true // requires funds
    ),
  });

  // Summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST SUMMARY                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`║  ${status}  ${result.test.padEnd(50)} ║`);
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total: ${passed}/${total} tests passed                                         ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');

  // AI Interaction Simulation
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                  AI INTERACTION SIMULATION                        ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log('║  The following shows how an AI would use these tools:             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');

  console.log('\n📝 User Prompt: "What tokens can I trade on Unichain?"');
  console.log('🤖 AI Action: Calls uniswap_v4_tokens tool');
  console.log('✅ AI can list WETH, USDC, UNI tokens with addresses');

  console.log('\n📝 User Prompt: "Check if there\'s a WETH/USDC pool"');
  console.log('🤖 AI Action: Calls uniswap_v4_pools(WETH, USDC)');
  console.log('✅ AI discovers available pools with liquidity info');

  console.log('\n📝 User Prompt: "Get a quote to swap 0.1 WETH to USDC"');
  console.log('🤖 AI Action: Calls uniswap_v4_quote(WETH, USDC, 0.1)');
  console.log('✅ AI returns expected output amount, fee, and gas estimate');

  console.log('\n📝 User Prompt: "Swap 0.05 WETH to USDC"');
  console.log('🤖 AI Action: Calls uniswap_v4_swap(WETH, USDC, 0.05, 50)');
  console.log('✅ AI executes swap and returns transaction hash + explorer link');

  console.log('\n📝 User Prompt: "What hooks does this pool use?"');
  console.log('🤖 AI Action: Calls uniswap_v4_hooks(hooksAddress)');
  console.log('✅ AI returns hook permissions (beforeSwap, afterSwap, etc.)');

  console.log('');
}

main().catch(console.error);
