/**
 * Protocol Matrix Execution Test
 *
 * Executes small test deposits across all protocol/chain combinations
 * to verify end-to-end functionality.
 *
 * CAUTION: This script EXECUTES REAL TRANSACTIONS and costs real ETH/tokens.
 *
 * Usage:
 *   npm run test:matrix -- --dry-run              # Test quotes only
 *   npm run test:matrix -- --chain=base           # Test Base chain only
 *   npm run test:matrix -- --protocol=aave-v3     # Test Aave V3 only
 *   npm run test:matrix -- --execute              # Execute transactions
 */

import { config } from 'dotenv';
import { getContractCallsQuote } from '@lifi/sdk';
import { formatUnits, parseUnits } from 'viem';
import {
  DEPLOYMENTS,
  CHAIN_IDS,
  getChainName,
  generateProtocolAction,
  TOKENS,
  type ProtocolDeployment,
} from './lib/protocols';
import { getWalletClient, getPublicClient, initLiFiSDK } from './lib/config';
import { executeComposerRoute } from './lib/execute';
import type { Address } from './lib/types';

config();

// =============================================================================
// TYPES
// =============================================================================

interface ExecutionResult {
  protocolId: string;
  chainId: number;
  chainName: string;
  inputToken: string;
  outputToken: string;
  testAmount: string;
  quoteStatus: 'success' | 'no-quote' | 'error';
  executionStatus?: 'success' | 'failed' | 'skipped';
  txHash?: string;
  explorerUrl?: string;
  error?: string;
  gasCostUSD?: string;
  timestamp: string;
}

interface TestConfig {
  dryRun: boolean;
  chainFilter?: number;
  protocolFilter?: string;
  maxTests?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// Test amounts per chain (in native token's smallest units)
// These are VERY small amounts for testing (~$0.10-0.50)
const TEST_AMOUNTS_BY_CHAIN: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: '50000000000000', // 0.00005 ETH (~$0.15)
  [CHAIN_IDS.ARBITRUM]: '100000000000000', // 0.0001 ETH (~$0.30)
  [CHAIN_IDS.BASE]: '100000000000000', // 0.0001 ETH (~$0.30)
  [CHAIN_IDS.OPTIMISM]: '100000000000000', // 0.0001 ETH (~$0.30)
  [CHAIN_IDS.POLYGON]: '1000000000000000000', // 1 MATIC (~$0.50)
  [CHAIN_IDS.BSC]: '1000000000000000', // 0.001 BNB (~$0.60)
  [CHAIN_IDS.AVALANCHE]: '100000000000000000', // 0.1 AVAX (~$3)
  [CHAIN_IDS.LINEA]: '100000000000000', // 0.0001 ETH (~$0.30)
  [CHAIN_IDS.SCROLL]: '100000000000000', // 0.0001 ETH (~$0.30)
  [CHAIN_IDS.GNOSIS]: '100000000000000000', // 0.1 xDAI (~$0.10)
};

// Explorer URLs by chain
const EXPLORER_URLS: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: 'https://etherscan.io/tx/',
  [CHAIN_IDS.ARBITRUM]: 'https://arbiscan.io/tx/',
  [CHAIN_IDS.BASE]: 'https://basescan.org/tx/',
  [CHAIN_IDS.OPTIMISM]: 'https://optimistic.etherscan.io/tx/',
  [CHAIN_IDS.POLYGON]: 'https://polygonscan.com/tx/',
  [CHAIN_IDS.BSC]: 'https://bscscan.com/tx/',
  [CHAIN_IDS.AVALANCHE]: 'https://snowtrace.io/tx/',
  [CHAIN_IDS.LINEA]: 'https://lineascan.build/tx/',
  [CHAIN_IDS.SCROLL]: 'https://scrollscan.com/tx/',
  [CHAIN_IDS.GNOSIS]: 'https://gnosisscan.io/tx/',
};

// Get native token for chain
function getNativeToken(chainId: number): Address {
  return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
}

// Get WETH equivalent for chain
function getWethToken(chainId: number): Address | undefined {
  const tokens = TOKENS[chainId as keyof typeof TOKENS];
  return tokens?.WETH || tokens?.WMATIC || tokens?.WBNB || tokens?.WAVAX || tokens?.WXDAI;
}

// =============================================================================
// EXECUTION TESTING
// =============================================================================

async function testProtocolExecution(
  deployment: ProtocolDeployment,
  userAddress: Address,
  config: TestConfig
): Promise<ExecutionResult> {
  const { protocolId, chainId, inputToken, inputTokenSymbol, outputToken, outputTokenSymbol } =
    deployment;
  const chainName = getChainName(chainId);
  const testAmount = TEST_AMOUNTS_BY_CHAIN[chainId] || '100000000000000';

  const result: ExecutionResult = {
    protocolId,
    chainId,
    chainName,
    inputToken: inputTokenSymbol,
    outputToken: outputTokenSymbol,
    testAmount,
    quoteStatus: 'error',
    timestamp: new Date().toISOString(),
  };

  try {
    // Generate the protocol action
    const action = generateProtocolAction(deployment, testAmount, userAddress);

    // For WETH wrap, use native token
    const fromToken = protocolId === 'weth-wrap' ? getNativeToken(chainId) : getNativeToken(chainId);
    const toToken = protocolId === 'weth-wrap' ? getNativeToken(chainId) : inputToken;

    // Build quote request
    const quoteRequest = {
      fromChain: chainId,
      toChain: chainId,
      fromToken,
      toToken,
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

    // Get quote
    const quote = await getContractCallsQuote(quoteRequest);

    if (!quote || !quote.transactionRequest) {
      result.quoteStatus = 'no-quote';
      result.executionStatus = 'skipped';
      return result;
    }

    result.quoteStatus = 'success';
    result.gasCostUSD = quote.estimate?.gasCosts?.[0]?.amountUSD || 'N/A';

    // If dry run, skip execution
    if (config.dryRun) {
      result.executionStatus = 'skipped';
      return result;
    }

    // Execute transaction
    console.log(`  Executing transaction...`);

    const executionResult = await executeComposerRoute(quote, {
      onTxSubmitted: (hash) => {
        result.txHash = hash;
        result.explorerUrl = `${EXPLORER_URLS[chainId]}${hash}`;
        console.log(`  TX submitted: ${result.explorerUrl}`);
      },
      onTxConfirmed: (hash, receipt) => {
        console.log(`  TX confirmed in block ${receipt.blockNumber}`);
      },
      onError: (error) => {
        console.log(`  TX error: ${error.message}`);
      },
    });

    if (executionResult.status === 'success') {
      result.executionStatus = 'success';
    } else {
      result.executionStatus = 'failed';
      result.error = executionResult.error || 'Unknown execution error';
    }
  } catch (error) {
    result.quoteStatus = 'error';
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n=== LI.FI Composer Protocol Matrix Test ===\n');

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const chainArg = args.find((a) => a.startsWith('--chain='))?.split('=')[1];
  const protocolArg = args.find((a) => a.startsWith('--protocol='))?.split('=')[1];
  const maxTests = parseInt(args.find((a) => a.startsWith('--max='))?.split('=')[1] || '0');

  const testConfig: TestConfig = {
    dryRun,
    chainFilter: chainArg
      ? Object.entries(CHAIN_IDS).find(([name]) => name.toLowerCase() === chainArg.toLowerCase())?.[1]
      : undefined,
    protocolFilter: protocolArg,
    maxTests: maxTests || undefined,
  };

  if (testConfig.dryRun) {
    console.log('🔍 DRY RUN MODE - No transactions will be executed');
    console.log('   Use --execute flag to execute real transactions');
  } else {
    console.log('⚠️  EXECUTION MODE - Real transactions will be sent!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Initialize LI.FI SDK
  initLiFiSDK();

  // Get wallet address
  const walletClient = getWalletClient(CHAIN_IDS.BASE);
  const userAddress = walletClient.account?.address;
  if (!userAddress) {
    throw new Error('No wallet address found. Set PRIVATE_KEY in .env');
  }

  console.log(`\nWallet: ${userAddress}`);
  console.log(
    `Filters: chain=${testConfig.chainFilter ? getChainName(testConfig.chainFilter) : 'all'}, protocol=${testConfig.protocolFilter || 'all'}`
  );

  // Filter deployments
  let deployments = [...DEPLOYMENTS];

  if (testConfig.chainFilter) {
    deployments = deployments.filter((d) => d.chainId === testConfig.chainFilter);
  }

  if (testConfig.protocolFilter) {
    deployments = deployments.filter((d) =>
      d.protocolId.toLowerCase().includes(testConfig.protocolFilter!.toLowerCase())
    );
  }

  if (testConfig.maxTests && deployments.length > testConfig.maxTests) {
    deployments = deployments.slice(0, testConfig.maxTests);
  }

  if (deployments.length === 0) {
    console.log('\nNo deployments match the filter criteria.');
    process.exit(0);
  }

  console.log(`\nTesting ${deployments.length} protocol deployments...\n`);

  // Results tracking
  const results: ExecutionResult[] = [];
  const summary = {
    total: deployments.length,
    quoteSuccess: 0,
    quoteFail: 0,
    execSuccess: 0,
    execFail: 0,
    skipped: 0,
  };

  // Run tests
  for (let i = 0; i < deployments.length; i++) {
    const deployment = deployments[i];
    const chainName = getChainName(deployment.chainId);

    console.log(`[${i + 1}/${deployments.length}] ${deployment.protocolId} on ${chainName}`);

    const result = await testProtocolExecution(deployment, userAddress, testConfig);
    results.push(result);

    // Update summary
    if (result.quoteStatus === 'success') {
      summary.quoteSuccess++;
    } else {
      summary.quoteFail++;
    }

    if (result.executionStatus === 'success') {
      summary.execSuccess++;
      console.log(`  ✅ Success - Gas: $${result.gasCostUSD}`);
    } else if (result.executionStatus === 'failed') {
      summary.execFail++;
      console.log(`  ❌ Failed: ${result.error}`);
    } else {
      summary.skipped++;
      if (result.quoteStatus === 'success') {
        console.log(`  ⏭️  Skipped (dry run) - Gas estimate: $${result.gasCostUSD}`);
      } else {
        console.log(`  ⚠️  No quote: ${result.error || 'Unknown'}`);
      }
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n=== Test Summary ===\n');
  console.log(`Total Tests:     ${summary.total}`);
  console.log(`Quote Success:   ${summary.quoteSuccess} (${((summary.quoteSuccess / summary.total) * 100).toFixed(1)}%)`);
  console.log(`Quote Failed:    ${summary.quoteFail} (${((summary.quoteFail / summary.total) * 100).toFixed(1)}%)`);

  if (!testConfig.dryRun) {
    console.log(`Exec Success:    ${summary.execSuccess}`);
    console.log(`Exec Failed:     ${summary.execFail}`);
  } else {
    console.log(`Skipped:         ${summary.skipped} (dry run)`);
  }

  // Save results to JSON
  const outputPath = `./matrix-test-results-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        config: testConfig,
        summary,
        results,
      },
      null,
      2
    )
  );
  console.log(`\nResults saved to: ${outputPath}`);

  // Generate markdown matrix
  generateMarkdownMatrix(results);
}

// =============================================================================
// MATRIX GENERATION
// =============================================================================

function generateMarkdownMatrix(results: ExecutionResult[]): void {
  console.log('\n=== Protocol x Chain Matrix ===\n');

  // Get unique chains and protocols
  const chains = [...new Set(results.map((r) => r.chainId))].sort((a, b) => a - b);
  const protocols = [...new Set(results.map((r) => r.protocolId))].sort();

  // Build header
  const header = ['Protocol', ...chains.map((c) => getChainName(c))];
  console.log('| ' + header.join(' | ') + ' |');
  console.log('|' + header.map(() => '---').join('|') + '|');

  // Build rows
  for (const protocol of protocols) {
    const row = [protocol];
    for (const chain of chains) {
      const result = results.find((r) => r.protocolId === protocol && r.chainId === chain);
      if (!result) {
        row.push('-');
      } else if (result.executionStatus === 'success') {
        row.push('✅');
      } else if (result.quoteStatus === 'success') {
        row.push('🔶'); // Quote works, execution skipped
      } else if (result.quoteStatus === 'no-quote') {
        row.push('⚠️');
      } else {
        row.push('❌');
      }
    }
    console.log('| ' + row.join(' | ') + ' |');
  }

  console.log('\nLegend:');
  console.log('  ✅ = Verified working (executed)');
  console.log('  🔶 = Quote available (not executed)');
  console.log('  ⚠️ = No quote available');
  console.log('  ❌ = Error');
  console.log('  -  = Not deployed on chain');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
