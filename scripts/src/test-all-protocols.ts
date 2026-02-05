/**
 * Test All Protocols Script (COSTS ETH - strategic)
 *
 * Runs small deposits into each protocol that returns valid quotes.
 * Uses minimum viable amounts. Same-chain operations first.
 *
 * Usage: npm run test:protocols
 */

import 'dotenv/config';
import { initializeLifiSDK, CHAIN_IDS } from './lib/config';
import { getComposerQuote } from './lib/quote';
import { executeAndWait, buildExplorerUrl } from './lib/execute';
import { toContractCall } from './lib/actions';
import {
  getAllDeployments,
  getProtocol,
  generateProtocolAction,
  type ProtocolDeployment,
} from './lib/protocols';
import type { Address, AmountString } from './lib/types';

// Minimum test amounts per token type
const TEST_AMOUNTS: Record<string, AmountString> = {
  ETH: '100000000000000',      // 0.0001 ETH
  WETH: '100000000000000',     // 0.0001 WETH
  USDC: '100000',              // 0.1 USDC
  'USDC.e': '100000',
  USDbC: '100000',
  USDe: '100000000000000000',  // 0.1 USDe (18 decimals)
  stETH: '100000000000000',
  eETH: '100000000000000',
};

interface ExecuteTestResult {
  protocolId: string;
  chainId: number;
  chainName: string;
  success: boolean;
  status?: string;
  txHash?: string;
  explorerLink?: string;
  duration?: number;
  error?: string;
}

async function executeDeployment(
  deployment: ProtocolDeployment,
  userAddress: Address
): Promise<ExecuteTestResult> {
  const chainName = deployment.chainId === CHAIN_IDS.BASE ? 'Base' : 'Arbitrum';
  const protocol = getProtocol(deployment.protocolId);
  const name = protocol?.name || deployment.protocolId;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name} on ${chainName}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const amount = TEST_AMOUNTS[deployment.inputTokenSymbol];
    if (!amount) {
      return {
        protocolId: deployment.protocolId,
        chainId: deployment.chainId,
        chainName,
        success: false,
        error: `No test amount for ${deployment.inputTokenSymbol}`,
      };
    }

    // Generate action
    console.log(`  Amount: ${amount} ${deployment.inputTokenSymbol}`);
    const actionConfig = generateProtocolAction(deployment, amount, userAddress);
    const contractCall = toContractCall(actionConfig, amount, deployment.inputToken);

    // Get quote
    console.log('  Getting quote...');
    const quote = await getComposerQuote({
      fromChain: deployment.chainId,
      fromToken: deployment.inputToken,
      fromAddress: userAddress,
      toChain: deployment.chainId,
      toToken: deployment.inputToken,
      toAmount: amount,
      contractCalls: [contractCall],
    });

    console.log(`  Quote: tool=${quote.tool}, gas=$${
      (quote.estimate?.gasCosts || []).reduce((s, c) => s + parseFloat(c.amountUSD || '0'), 0).toFixed(4)
    }`);

    // Execute
    console.log('  Executing...');
    const result = await executeAndWait(quote, {
      onTxSubmitted: (txHash) => {
        console.log(`    TX submitted: ${txHash.slice(0, 14)}...`);
      },
      onTxConfirmed: (_txHash, receipt) => {
        console.log(`    TX confirmed! Gas: ${receipt.gasUsed.toString()}`);
      },
      onError: (error) => {
        console.error(`    ERROR: ${error.message}`);
      },
    });

    const explorerLink = buildExplorerUrl(deployment.chainId, result.sourceTxHash);
    console.log(`  Status: ${result.status}`);
    console.log(`  TX: ${result.sourceTxHash}`);
    console.log(`  Explorer: ${explorerLink}`);
    console.log(`  Duration: ${result.duration}s`);

    return {
      protocolId: deployment.protocolId,
      chainId: deployment.chainId,
      chainName,
      success: result.status === 'DONE',
      status: result.status,
      txHash: result.sourceTxHash,
      explorerLink,
      duration: result.duration,
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
  console.log('=== LI.FI Composer - Test All Protocols ===\n');

  const { address } = initializeLifiSDK();
  console.log(`Wallet: ${address}`);

  // Parse optional filters from CLI args
  const args = process.argv.slice(2);
  const chainFilter = args.find((a) => a.startsWith('--chain='))?.split('=')[1];
  const protocolFilter = args.find((a) => a.startsWith('--protocol='))?.split('=')[1];

  let deployments = getAllDeployments();

  if (chainFilter) {
    const chainId = chainFilter === 'base' ? CHAIN_IDS.BASE : CHAIN_IDS.ARBITRUM;
    deployments = deployments.filter((d) => d.chainId === chainId);
    console.log(`Filtered to chain: ${chainFilter} (${chainId})`);
  }

  if (protocolFilter) {
    deployments = deployments.filter((d) => d.protocolId.includes(protocolFilter));
    console.log(`Filtered to protocol: ${protocolFilter}`);
  }

  console.log(`\nWill test ${deployments.length} protocol deployments\n`);

  const results: ExecuteTestResult[] = [];

  // Execute sequentially
  for (const deployment of deployments) {
    const result = await executeDeployment(deployment, address);
    results.push(result);

    // Delay between executions
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Print summary
  console.log('\n\n=== EXECUTION SUMMARY ===\n');
  console.log(
    'Protocol'.padEnd(25) +
      'Chain'.padEnd(12) +
      'Status'.padEnd(10) +
      'Duration'.padEnd(10) +
      'TX Hash'
  );
  console.log('-'.repeat(90));

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  for (const r of results) {
    const status = r.success ? 'DONE' : 'FAIL';
    const duration = r.duration ? `${r.duration}s` : '-';
    const tx = r.txHash ? `${r.txHash.slice(0, 10)}...` : '-';
    console.log(
      r.protocolId.padEnd(25) +
        r.chainName.padEnd(12) +
        status.padEnd(10) +
        duration.padEnd(10) +
        tx
    );
  }

  console.log(`\nPassed: ${succeeded.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log('\nFailed:');
    for (const r of failed) {
      console.log(`  - ${r.protocolId} (${r.chainName}): ${r.error || r.status}`);
    }
  }

  if (succeeded.length > 0) {
    console.log('\nSuccessful TXs:');
    for (const r of succeeded) {
      console.log(`  - ${r.protocolId} (${r.chainName}): ${r.explorerLink}`);
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
