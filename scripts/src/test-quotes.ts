/**
 * Test Quotes Script (FREE - no execution)
 *
 * For each protocol deployment, builds a contract call and requests
 * a quote from LI.FI Composer. Validates response structure.
 *
 * Usage: npm run test:quotes
 */

import 'dotenv/config';
import { initializeLifiSDK, CHAIN_IDS } from './lib/config';
import { getComposerQuote } from './lib/quote';
import { toContractCall } from './lib/actions';
import {
  getAllDeployments,
  getProtocol,
  generateProtocolAction,
  type ProtocolDeployment,
} from './lib/protocols';
import type { Address, AmountString } from './lib/types';

// Small test amounts per token type
const TEST_AMOUNTS: Record<string, AmountString> = {
  ETH: '100000000000000',      // 0.0001 ETH
  WETH: '100000000000000',     // 0.0001 WETH
  USDC: '100000',              // 0.1 USDC (6 decimals)
  'USDC.e': '100000',          // 0.1 USDC.e
  USDbC: '100000',             // 0.1 USDbC
  USDe: '100000000000000000',  // 0.1 USDe (18 decimals)
  stETH: '100000000000000',    // 0.0001 stETH
  eETH: '100000000000000',     // 0.0001 eETH
};

interface QuoteTestResult {
  protocolId: string;
  chainId: number;
  chainName: string;
  success: boolean;
  tool?: string;
  steps?: number;
  estimatedOutput?: string;
  gasCostUSD?: string;
  duration?: number;
  error?: string;
}

async function testQuoteForDeployment(
  deployment: ProtocolDeployment,
  userAddress: Address
): Promise<QuoteTestResult> {
  const chainName = deployment.chainId === CHAIN_IDS.BASE ? 'Base' : 'Arbitrum';
  const protocol = getProtocol(deployment.protocolId);

  console.log(`\n--- Testing: ${protocol?.name || deployment.protocolId} on ${chainName} ---`);

  try {
    const amount = TEST_AMOUNTS[deployment.inputTokenSymbol];
    if (!amount) {
      return {
        protocolId: deployment.protocolId,
        chainId: deployment.chainId,
        chainName,
        success: false,
        error: `No test amount configured for ${deployment.inputTokenSymbol}`,
      };
    }

    // Generate the protocol-specific action
    const actionConfig = generateProtocolAction(deployment, amount, userAddress);

    // Build the contract call
    const contractCall = toContractCall(
      actionConfig,
      amount,
      deployment.inputToken
    );

    // For protocols needing approval, we need to include an approve step
    // But for quote testing, we just test the main deposit call

    // Determine source token - for same-chain, use the input token
    // For simplicity, test same-chain quotes (from token = to token on same chain)
    const quote = await getComposerQuote({
      fromChain: deployment.chainId,
      fromToken: deployment.inputToken,
      fromAddress: userAddress,
      toChain: deployment.chainId,
      toToken: deployment.inputToken,
      toAmount: amount,
      contractCalls: [contractCall],
    });

    const gasCosts = quote.estimate?.gasCosts || [];
    const totalGas = gasCosts.reduce((sum, c) => sum + parseFloat(c.amountUSD || '0'), 0);

    console.log(`  Tool: ${quote.tool}`);
    console.log(`  Steps: ${quote.includedSteps?.length || 0}`);
    console.log(`  Estimated output: ${quote.estimate?.toAmount}`);
    console.log(`  Gas cost: $${totalGas.toFixed(4)}`);
    console.log(`  Duration: ${quote.estimate?.executionDuration}s`);

    return {
      protocolId: deployment.protocolId,
      chainId: deployment.chainId,
      chainName,
      success: true,
      tool: quote.tool,
      steps: quote.includedSteps?.length || 0,
      estimatedOutput: quote.estimate?.toAmount,
      gasCostUSD: totalGas.toFixed(4),
      duration: quote.estimate?.executionDuration,
    };
  } catch (error) {
    const err = error as Error;
    console.error(`  FAILED: ${err.message}`);
    return {
      protocolId: deployment.protocolId,
      chainId: deployment.chainId,
      chainName,
      success: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log('=== LI.FI Composer Quote Test ===\n');

  // Initialize SDK
  const { address } = initializeLifiSDK();
  console.log(`Wallet: ${address}\n`);

  const deployments = getAllDeployments();
  console.log(`Testing ${deployments.length} protocol deployments...\n`);

  const results: QuoteTestResult[] = [];

  // Test each deployment sequentially (to avoid rate limiting)
  for (const deployment of deployments) {
    const result = await testQuoteForDeployment(deployment, address);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Print summary
  console.log('\n\n=== SUMMARY ===\n');
  console.log('Protocol'.padEnd(25) + 'Chain'.padEnd(12) + 'Status'.padEnd(10) + 'Tool'.padEnd(15) + 'Gas USD');
  console.log('-'.repeat(75));

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  for (const r of results) {
    const status = r.success ? 'OK' : 'FAIL';
    const tool = r.tool || '-';
    const gas = r.gasCostUSD || '-';
    console.log(
      r.protocolId.padEnd(25) +
        r.chainName.padEnd(12) +
        status.padEnd(10) +
        tool.padEnd(15) +
        gas
    );
  }

  console.log(`\nPassed: ${succeeded.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log('\nFailed protocols:');
    for (const r of failed) {
      console.log(`  - ${r.protocolId} (${r.chainName}): ${r.error}`);
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
