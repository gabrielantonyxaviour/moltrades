/**
 * Test Cross-Chain Script (COSTS ETH - moderate)
 *
 * Tests cross-chain flows: Bridge from one chain + deposit into protocol on another.
 *
 * Tests:
 * 1. Arb → Base: Bridge ETH + wrap to WETH
 * 2. Base → Arb: Bridge ETH + deposit into Aave V3
 *
 * Usage: npm run test:cross-chain
 */

import 'dotenv/config';
import { initializeLifiSDK, CHAIN_IDS } from './lib/config';
import { getComposerQuote } from './lib/quote';
import { executeAndWait, buildExplorerUrl } from './lib/execute';
import { generateWrapAction, toContractCall, NATIVE_TOKEN_ADDRESS, WETH_ADDRESSES } from './lib/actions';
import { generateProtocolAction, getDeployment } from './lib/protocols';
import type { Address } from './lib/types';

const BRIDGE_AMOUNT = '200000000000000'; // 0.0002 ETH

interface CrossChainTestResult {
  name: string;
  fromChain: string;
  toChain: string;
  success: boolean;
  sourceTxHash?: string;
  destinationTxHash?: string;
  sourceExplorer?: string;
  destinationExplorer?: string;
  duration?: number;
  error?: string;
}

// Test 1: Arb → Base: Bridge ETH + Wrap to WETH
async function testArbToBaseWrap(userAddress: Address): Promise<CrossChainTestResult> {
  const name = 'Arb → Base: Bridge + Wrap WETH';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const wethBase = WETH_ADDRESSES[CHAIN_IDS.BASE]!;

    // Generate wrap action on Base
    const wrapConfig = generateWrapAction(CHAIN_IDS.BASE, BRIDGE_AMOUNT);
    const contractCall = toContractCall(wrapConfig, BRIDGE_AMOUNT, NATIVE_TOKEN_ADDRESS);

    // Get cross-chain quote: Arb ETH → Base ETH + wrap
    console.log('  Getting cross-chain quote...');
    const quote = await getComposerQuote({
      fromChain: CHAIN_IDS.ARBITRUM,
      fromToken: NATIVE_TOKEN_ADDRESS,
      fromAddress: userAddress,
      toChain: CHAIN_IDS.BASE,
      toToken: NATIVE_TOKEN_ADDRESS,
      toAmount: BRIDGE_AMOUNT,
      contractCalls: [contractCall],
    });

    console.log(`  Quote: tool=${quote.tool}, steps=${quote.includedSteps?.length}`);
    console.log(`  Estimated duration: ${quote.estimate?.executionDuration}s`);
    console.log(`  From amount: ${quote.action.fromAmount}`);

    // Execute
    console.log('  Executing cross-chain route...');
    const result = await executeAndWait(
      quote,
      {
        onTxSubmitted: (txHash) => console.log(`    TX submitted: ${txHash}`),
        onTxConfirmed: (_txHash, receipt) => console.log(`    TX confirmed! Gas: ${receipt.gasUsed.toString()}`),
        onBridgeProgress: (status, progress) =>
          console.log(`    Bridge: ${status} (${progress}%)`),
        onError: (error) => console.error(`    ERROR: ${error.message}`),
      },
      {
        pollInterval: 15000,
        timeout: 600000,
        onStatusUpdate: (status) => console.log(`    Status: ${status.status}`),
      }
    );

    const sourceExplorer = buildExplorerUrl(CHAIN_IDS.ARBITRUM, result.sourceTxHash);
    const destExplorer = result.destinationTxHash
      ? buildExplorerUrl(CHAIN_IDS.BASE, result.destinationTxHash)
      : undefined;

    console.log(`\n  Result: ${result.status}`);
    console.log(`  Source TX: ${result.sourceTxHash}`);
    console.log(`  Source Explorer: ${sourceExplorer}`);
    if (result.destinationTxHash) {
      console.log(`  Dest TX: ${result.destinationTxHash}`);
      console.log(`  Dest Explorer: ${destExplorer}`);
    }
    console.log(`  Duration: ${result.duration}s`);

    return {
      name,
      fromChain: 'Arbitrum',
      toChain: 'Base',
      success: result.status === 'DONE',
      sourceTxHash: result.sourceTxHash,
      destinationTxHash: result.destinationTxHash,
      sourceExplorer,
      destinationExplorer: destExplorer,
      duration: result.duration,
    };
  } catch (error) {
    const err = error as Error;
    console.error(`  FAILED: ${err.message}`);
    return {
      name,
      fromChain: 'Arbitrum',
      toChain: 'Base',
      success: false,
      error: err.message,
    };
  }
}

// Test 2: Base → Arb: Bridge ETH + deposit into Aave V3 WETH
async function testBaseToArbAave(userAddress: Address): Promise<CrossChainTestResult> {
  const name = 'Base → Arb: Bridge + Aave V3 WETH';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const deployment = getDeployment('aave-v3-weth', CHAIN_IDS.ARBITRUM);
    if (!deployment) {
      throw new Error('Aave V3 WETH deployment not found on Arbitrum');
    }

    // For Aave, we need WETH on destination
    // So: Bridge ETH from Base → Arb, swap to WETH, then supply to Aave
    const actionConfig = generateProtocolAction(deployment, BRIDGE_AMOUNT, userAddress);
    const contractCall = toContractCall(actionConfig, BRIDGE_AMOUNT, deployment.inputToken);

    console.log('  Getting cross-chain quote...');
    const quote = await getComposerQuote({
      fromChain: CHAIN_IDS.BASE,
      fromToken: NATIVE_TOKEN_ADDRESS,
      fromAddress: userAddress,
      toChain: CHAIN_IDS.ARBITRUM,
      toToken: deployment.inputToken, // WETH on Arb
      toAmount: BRIDGE_AMOUNT,
      contractCalls: [contractCall],
    });

    console.log(`  Quote: tool=${quote.tool}, steps=${quote.includedSteps?.length}`);
    console.log(`  Estimated duration: ${quote.estimate?.executionDuration}s`);

    // Execute
    console.log('  Executing cross-chain route...');
    const result = await executeAndWait(
      quote,
      {
        onTxSubmitted: (txHash) => console.log(`    TX submitted: ${txHash}`),
        onTxConfirmed: (_txHash, receipt) => console.log(`    TX confirmed! Gas: ${receipt.gasUsed.toString()}`),
        onBridgeProgress: (status, progress) =>
          console.log(`    Bridge: ${status} (${progress}%)`),
        onError: (error) => console.error(`    ERROR: ${error.message}`),
      },
      {
        pollInterval: 15000,
        timeout: 600000,
        onStatusUpdate: (status) => console.log(`    Status: ${status.status}`),
      }
    );

    const sourceExplorer = buildExplorerUrl(CHAIN_IDS.BASE, result.sourceTxHash);
    const destExplorer = result.destinationTxHash
      ? buildExplorerUrl(CHAIN_IDS.ARBITRUM, result.destinationTxHash)
      : undefined;

    console.log(`\n  Result: ${result.status}`);
    console.log(`  Source TX: ${result.sourceTxHash}`);
    console.log(`  Source Explorer: ${sourceExplorer}`);
    if (result.destinationTxHash) {
      console.log(`  Dest TX: ${result.destinationTxHash}`);
      console.log(`  Dest Explorer: ${destExplorer}`);
    }
    console.log(`  Duration: ${result.duration}s`);

    return {
      name,
      fromChain: 'Base',
      toChain: 'Arbitrum',
      success: result.status === 'DONE',
      sourceTxHash: result.sourceTxHash,
      destinationTxHash: result.destinationTxHash,
      sourceExplorer,
      destinationExplorer: destExplorer,
      duration: result.duration,
    };
  } catch (error) {
    const err = error as Error;
    console.error(`  FAILED: ${err.message}`);
    return {
      name,
      fromChain: 'Base',
      toChain: 'Arbitrum',
      success: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log('=== LI.FI Composer - Cross-Chain Tests ===\n');
  console.log(`Bridge amount: ${BRIDGE_AMOUNT} wei (0.0002 ETH)\n`);

  const { address } = initializeLifiSDK();
  console.log(`Wallet: ${address}`);

  const results: CrossChainTestResult[] = [];

  // Test: Base → Arb + Aave (cheapest source chain)
  results.push(await testBaseToArbAave(address));

  // Summary
  console.log('\n\n=== CROSS-CHAIN TEST SUMMARY ===\n');
  console.log(
    'Test'.padEnd(40) +
      'Status'.padEnd(10) +
      'Duration'.padEnd(10) +
      'Source TX'
  );
  console.log('-'.repeat(85));

  for (const r of results) {
    const status = r.success ? 'DONE' : 'FAIL';
    const duration = r.duration ? `${r.duration}s` : '-';
    const tx = r.sourceTxHash ? `${r.sourceTxHash.slice(0, 10)}...` : '-';
    console.log(r.name.padEnd(40) + status.padEnd(10) + duration.padEnd(10) + tx);
  }

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\nPassed: ${succeeded.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log('\nFailed tests:');
    for (const r of failed) {
      console.log(`  - ${r.name}: ${r.error}`);
    }
  }

  if (succeeded.length > 0) {
    console.log('\nSuccessful TXs:');
    for (const r of succeeded) {
      console.log(`  - ${r.name}:`);
      console.log(`    Source: ${r.sourceExplorer}`);
      if (r.destinationExplorer) {
        console.log(`    Dest:   ${r.destinationExplorer}`);
      }
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
