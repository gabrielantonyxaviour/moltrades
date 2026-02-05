/**
 * Test Execute Script (COSTS ETH - small amounts)
 *
 * Executes one simple, cheap operation to verify the full flow works.
 * Default test: Wrap 0.0001 ETH to WETH on Base (~$0.01 gas)
 *
 * Usage: npm run test:execute
 */

import 'dotenv/config';
import { initializeLifiSDK, CHAIN_IDS } from './lib/config';
import { getComposerQuote } from './lib/quote';
import { executeComposerRoute, buildExplorerUrl } from './lib/execute';
import { generateWrapAction, toContractCall, NATIVE_TOKEN_ADDRESS, WETH_ADDRESSES } from './lib/actions';

const WRAP_AMOUNT = '100000000000000'; // 0.0001 ETH

async function main() {
  console.log('=== LI.FI Composer Execute Test ===\n');
  console.log('Action: Wrap 0.0001 ETH to WETH on Base');
  console.log(`Amount: ${WRAP_AMOUNT} wei (0.0001 ETH)\n`);

  const { address } = initializeLifiSDK();
  console.log(`Wallet: ${address}`);

  const chainId = CHAIN_IDS.BASE;

  // Step 1: Generate wrap action
  console.log('\n--- Step 1: Generate wrap action ---');
  const wrapConfig = generateWrapAction(chainId, WRAP_AMOUNT);
  console.log('Contract:', wrapConfig.toContractAddress);
  console.log('Output token:', wrapConfig.contractOutputsToken);

  // Step 2: Build contract call
  console.log('\n--- Step 2: Build contract call ---');
  const contractCall = toContractCall(wrapConfig, WRAP_AMOUNT, NATIVE_TOKEN_ADDRESS);

  // Step 3: Get quote
  console.log('\n--- Step 3: Get quote ---');
  const quote = await getComposerQuote({
    fromChain: chainId,
    fromToken: NATIVE_TOKEN_ADDRESS,
    fromAddress: address,
    toChain: chainId,
    toToken: NATIVE_TOKEN_ADDRESS,
    toAmount: WRAP_AMOUNT,
    contractCalls: [contractCall],
  });

  console.log('Quote received:');
  console.log('  Tool:', quote.tool);
  console.log('  From amount:', quote.action.fromAmount);
  console.log('  Gas limit:', quote.transactionRequest?.gasLimit);
  console.log('  Value:', quote.transactionRequest?.value);

  // Step 4: Execute (send transactionRequest directly)
  console.log('\n--- Step 4: Execute ---');
  const result = await executeComposerRoute(quote, {
    onTxSubmitted: (txHash) => {
      console.log('  TX submitted:', txHash);
    },
    onTxConfirmed: (txHash, receipt) => {
      console.log('  TX confirmed! Gas used:', receipt.gasUsed.toString());
    },
    onError: (error) => {
      console.error('  ERROR:', error.message);
    },
  });

  // Results
  console.log('\n--- Results ---');
  console.log('Status:', result.status);
  console.log('TX Hash:', result.sourceTxHash);
  console.log('Contract call succeeded:', result.contractCallSucceeded);
  console.log('Duration:', result.duration, 'seconds');
  console.log('Explorer:', result.explorerLinks.source);

  process.exit(result.status === 'DONE' ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
