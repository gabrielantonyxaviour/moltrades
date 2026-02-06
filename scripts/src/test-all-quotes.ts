/**
 * Comprehensive Quote Test for LI.FI Composer
 *
 * Tests quote availability for ALL protocol/chain combinations.
 * This test does NOT execute any transactions - it only validates
 * that quotes can be obtained.
 *
 * Usage:
 *   npm run test:all-quotes
 *   npm run test:all-quotes -- --chain=base
 *   npm run test:all-quotes -- --protocol=aave-v3-weth
 *   npm run test:all-quotes -- --output=json
 */

import { config } from 'dotenv';
import { getContractCallsQuote } from '@lifi/sdk';
import {
  DEPLOYMENTS,
  CHAIN_IDS,
  getChainName,
  generateProtocolAction,
  type ProtocolDeployment,
} from './lib/protocols';
import { getWalletClient, initLiFiSDK } from './lib/config';
import type { Address } from './lib/types';

config();

// =============================================================================
// TYPES
// =============================================================================

interface QuoteTestResult {
  protocolId: string;
  chainId: number;
  chainName: string;
  inputToken: string;
  outputToken: string;
  status: 'success' | 'no-quote' | 'error';
  tool?: string;
  steps?: number;
  estimatedGasUSD?: string;
  error?: string;
  timestamp: string;
}

interface TestSummary {
  totalTests: number;
  successful: number;
  noQuote: number;
  errors: number;
  byChain: Record<string, { success: number; fail: number }>;
  byProtocol: Record<string, { success: number; fail: number }>;
  results: QuoteTestResult[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// Test amounts per token type (in smallest units)
const TEST_AMOUNTS: Record<string, string> = {
  ETH: '100000000000000', // 0.0001 ETH
  WETH: '100000000000000', // 0.0001 WETH
  USDC: '100000', // 0.1 USDC (6 decimals)
  USDT: '100000', // 0.1 USDT (6 decimals)
  DAI: '100000000000000000', // 0.1 DAI (18 decimals)
  stETH: '100000000000000', // 0.0001 stETH
  eETH: '100000000000000', // 0.0001 eETH
  USDe: '100000000000000000', // 0.1 USDe (18 decimals)
  'WETH.e': '100000000000000', // 0.0001 WETH.e
  'USDC.e': '100000', // 0.1 USDC.e
  USDbC: '100000', // 0.1 USDbC
  WMATIC: '1000000000000000000', // 1 WMATIC
  WBNB: '1000000000000000', // 0.001 WBNB
  WAVAX: '100000000000000000', // 0.1 WAVAX
  WXDAI: '100000000000000000', // 0.1 WXDAI
};

// Get test amount for a token
function getTestAmount(symbol: string): string {
  // Try exact match first
  if (TEST_AMOUNTS[symbol]) {
    return TEST_AMOUNTS[symbol];
  }
  // Default fallback based on common patterns
  if (symbol.includes('USD') || symbol.includes('DAI')) {
    return '100000'; // 0.1 for stablecoins (6 decimals assumption)
  }
  if (symbol.includes('ETH') || symbol.includes('BTC')) {
    return '100000000000000'; // 0.0001 for ETH-like tokens
  }
  return '100000000000000000'; // 0.1 for 18 decimal tokens
}

// =============================================================================
// QUOTE TESTING
// =============================================================================

async function testQuote(
  deployment: ProtocolDeployment,
  userAddress: Address
): Promise<QuoteTestResult> {
  const { protocolId, chainId, inputToken, inputTokenSymbol, outputToken, outputTokenSymbol } =
    deployment;
  const chainName = getChainName(chainId);
  const testAmount = getTestAmount(inputTokenSymbol);

  const result: QuoteTestResult = {
    protocolId,
    chainId,
    chainName,
    inputToken: inputTokenSymbol,
    outputToken: outputTokenSymbol,
    status: 'error',
    timestamp: new Date().toISOString(),
  };

  try {
    // Generate the protocol action
    const action = generateProtocolAction(deployment, testAmount, userAddress);

    // Build quote request
    const quoteRequest = {
      fromChain: chainId,
      toChain: chainId,
      fromToken: chainId === 137 ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : inputToken, // Use native for fromToken
      toToken: inputToken, // We want to receive the input token for the protocol
      fromAddress: userAddress,
      toAmount: testAmount,
      contractCalls: [
        {
          fromAmount: testAmount,
          fromTokenAddress: inputToken,
          toContractAddress: action.toContractAddress,
          toContractCallData: action.toContractCallData,
          toContractGasLimit: action.toContractGasLimit,
          contractOutputsToken: action.contractOutputsToken,
        },
      ],
    };

    // Special handling for WETH wrap (use native ETH as fromToken)
    if (protocolId === 'weth-wrap') {
      quoteRequest.fromToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      quoteRequest.toToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    }

    // Get quote
    const quote = await getContractCallsQuote(quoteRequest);

    if (quote && quote.transactionRequest) {
      result.status = 'success';
      result.tool = quote.toolDetails?.name || 'unknown';
      result.steps = quote.includedSteps?.length || 0;
      result.estimatedGasUSD = quote.estimate?.gasCosts?.[0]?.amountUSD || 'N/A';
    } else {
      result.status = 'no-quote';
      result.error = 'No quote returned';
    }
  } catch (error) {
    result.status = 'error';
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n=== LI.FI Composer Comprehensive Quote Test ===\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const chainFilter = args.find((a) => a.startsWith('--chain='))?.split('=')[1];
  const protocolFilter = args.find((a) => a.startsWith('--protocol='))?.split('=')[1];
  const outputFormat = args.find((a) => a.startsWith('--output='))?.split('=')[1] || 'table';

  // Initialize LI.FI SDK
  initLiFiSDK();

  // Get wallet address
  const walletClient = getWalletClient(CHAIN_IDS.BASE);
  const userAddress = walletClient.account?.address;
  if (!userAddress) {
    throw new Error('No wallet address found. Set PRIVATE_KEY in .env');
  }

  console.log(`Wallet: ${userAddress}`);
  console.log(`Filters: chain=${chainFilter || 'all'}, protocol=${protocolFilter || 'all'}`);
  console.log('');

  // Filter deployments
  let deployments = [...DEPLOYMENTS];

  if (chainFilter) {
    const chainId = Object.entries(CHAIN_IDS).find(
      ([name]) => name.toLowerCase() === chainFilter.toLowerCase()
    )?.[1];
    if (chainId) {
      deployments = deployments.filter((d) => d.chainId === chainId);
    } else {
      console.error(`Unknown chain: ${chainFilter}`);
      console.log('Available chains:', Object.keys(CHAIN_IDS).join(', '));
      process.exit(1);
    }
  }

  if (protocolFilter) {
    deployments = deployments.filter((d) =>
      d.protocolId.toLowerCase().includes(protocolFilter.toLowerCase())
    );
  }

  if (deployments.length === 0) {
    console.log('No deployments match the filter criteria.');
    process.exit(0);
  }

  console.log(`Testing ${deployments.length} protocol deployments...\n`);

  // Initialize summary
  const summary: TestSummary = {
    totalTests: deployments.length,
    successful: 0,
    noQuote: 0,
    errors: 0,
    byChain: {},
    byProtocol: {},
    results: [],
  };

  // Run tests
  for (const deployment of deployments) {
    const chainName = getChainName(deployment.chainId);
    process.stdout.write(
      `Testing ${deployment.protocolId} on ${chainName}... `
    );

    const result = await testQuote(deployment, userAddress);
    summary.results.push(result);

    // Update counters
    if (result.status === 'success') {
      summary.successful++;
      console.log(`✅ ${result.tool} (${result.steps} steps)`);
    } else if (result.status === 'no-quote') {
      summary.noQuote++;
      console.log(`⚠️ No quote available`);
    } else {
      summary.errors++;
      console.log(`❌ Error: ${result.error?.substring(0, 50)}...`);
    }

    // Update chain stats
    if (!summary.byChain[chainName]) {
      summary.byChain[chainName] = { success: 0, fail: 0 };
    }
    if (result.status === 'success') {
      summary.byChain[chainName].success++;
    } else {
      summary.byChain[chainName].fail++;
    }

    // Update protocol stats
    if (!summary.byProtocol[deployment.protocolId]) {
      summary.byProtocol[deployment.protocolId] = { success: 0, fail: 0 };
    }
    if (result.status === 'success') {
      summary.byProtocol[deployment.protocolId].success++;
    } else {
      summary.byProtocol[deployment.protocolId].fail++;
    }

    // Rate limiting - wait 500ms between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n=== Summary ===\n');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Successful:  ${summary.successful} (${((summary.successful / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`No Quote:    ${summary.noQuote} (${((summary.noQuote / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Errors:      ${summary.errors} (${((summary.errors / summary.totalTests) * 100).toFixed(1)}%)`);

  console.log('\n--- By Chain ---');
  for (const [chain, stats] of Object.entries(summary.byChain)) {
    const total = stats.success + stats.fail;
    console.log(`${chain}: ${stats.success}/${total} (${((stats.success / total) * 100).toFixed(0)}%)`);
  }

  console.log('\n--- By Protocol ---');
  for (const [protocol, stats] of Object.entries(summary.byProtocol)) {
    const total = stats.success + stats.fail;
    console.log(`${protocol}: ${stats.success}/${total} (${((stats.success / total) * 100).toFixed(0)}%)`);
  }

  // Output JSON if requested
  if (outputFormat === 'json') {
    const outputPath = `./quote-test-results-${Date.now()}.json`;
    const fs = await import('fs');
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
  }

  // Exit with error code if there were failures
  if (summary.errors > 0 || summary.noQuote > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
