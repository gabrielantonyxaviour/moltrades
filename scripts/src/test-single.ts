/**
 * Test a single protocol with ETH as source.
 *
 * For protocols needing ERC20 tokens (WETH, USDC etc.),
 * uses ETH as fromToken and lets the Composer handle the swap.
 *
 * Usage: npx tsx src/test-single.ts <protocolId> <chainId>
 */

import 'dotenv/config';
import { initializeLifiSDK, CHAIN_IDS } from './lib/config';
import { getComposerQuote } from './lib/quote';
import { executeComposerRoute, buildExplorerUrl } from './lib/execute';
import { toContractCall, NATIVE_TOKEN_ADDRESS } from './lib/actions';
import { getDeployment, generateProtocolAction } from './lib/protocols';
import type { Address, AmountString } from './lib/types';

const TEST_AMOUNT_ETH = '100000000000000'; // 0.0001 ETH

async function main() {
  const [protocolId, chainIdStr] = process.argv.slice(2);
  if (!protocolId) {
    console.log('Usage: npx tsx src/test-single.ts <protocolId> [chainId]');
    console.log('\nAvailable protocols:');
    console.log('  weth-wrap, aave-v3-usdc, aave-v3-weth, ethena-susde');
    console.log('  morpho-usdc, morpho-weth, compound-v3-usdc, compound-v3-weth');
    console.log('  moonwell-usdc, moonwell-weth');
    process.exit(1);
  }

  const chainId = chainIdStr ? parseInt(chainIdStr) : CHAIN_IDS.BASE;
  const { address } = initializeLifiSDK();

  console.log(`\nProtocol: ${protocolId}`);
  console.log(`Chain: ${chainId}`);
  console.log(`Wallet: ${address}\n`);

  const deployment = getDeployment(protocolId, chainId);
  if (!deployment) {
    console.error(`No deployment found for ${protocolId} on chain ${chainId}`);
    process.exit(1);
  }

  // Use small amounts - 1 USDC for USDC protocols, 0.0001 ETH for others
  const isUSDC = deployment.inputTokenSymbol.includes('USDC') || deployment.inputTokenSymbol.includes('USDb');
  const isUSDe = deployment.inputTokenSymbol === 'USDe';
  const amount = isUSDC ? '1000000' : isUSDe ? '1000000000000000000' : TEST_AMOUNT_ETH;

  console.log(`Input token: ${deployment.inputTokenSymbol} (${deployment.inputToken})`);
  console.log(`Amount: ${amount}`);

  // Generate protocol action
  const actionConfig = generateProtocolAction(deployment, amount, address);
  const contractCall = toContractCall(actionConfig, amount, deployment.inputToken);

  // For WETH wrap: fromToken=ETH, toToken=ETH (wrap is a contract call on native)
  // For others: fromToken=ETH, toToken=inputToken (Composer swaps ETH to needed token)
  const isWrap = protocolId === 'weth-wrap';
  const fromToken = NATIVE_TOKEN_ADDRESS;
  const toToken = isWrap ? NATIVE_TOKEN_ADDRESS : deployment.inputToken;
  const toAmount = isWrap ? amount : amount;

  console.log(`\nFrom: ETH (native)`);
  console.log(`To token: ${toToken}`);
  console.log(`Contract target: ${deployment.depositContract}`);

  // Get quote
  console.log('\n--- Getting quote ---');
  try {
    const quote = await getComposerQuote({
      fromChain: chainId,
      fromToken: fromToken,
      fromAddress: address,
      toChain: chainId,
      toToken: toToken,
      toAmount: toAmount,
      contractCalls: [contractCall],
    });

    const gasCosts = quote.estimate?.gasCosts || [];
    const gasUSD = gasCosts.reduce((s, c) => s + parseFloat(c.amountUSD || '0'), 0);

    console.log(`Tool: ${quote.tool}`);
    console.log(`Steps: ${quote.includedSteps?.length}`);
    console.log(`From amount: ${quote.action.fromAmount} (in ETH wei)`);
    console.log(`Gas: $${gasUSD.toFixed(4)}`);
    console.log(`Approval needed: ${!!quote.estimate?.approvalAddress}`);
    if (quote.estimate?.approvalAddress) {
      console.log(`Approval address: ${quote.estimate.approvalAddress}`);
    }

    // Execute
    console.log('\n--- Executing ---');
    const result = await executeComposerRoute(quote, {
      onTxSubmitted: (txHash) => console.log(`TX submitted: ${txHash}`),
      onTxConfirmed: (_txHash, receipt) => console.log(`TX confirmed: ${receipt.status}, gas: ${receipt.gasUsed}`),
      onError: (error) => console.error(`ERROR: ${error.message}`),
    });

    console.log('\n--- Result ---');
    console.log(`Status: ${result.status}`);
    console.log(`TX: ${result.sourceTxHash}`);
    console.log(`Explorer: ${result.explorerLinks.source}`);
    console.log(`Duration: ${result.duration}s`);

    process.exit(result.status === 'DONE' ? 0 : 1);
  } catch (error) {
    console.error('Failed:', (error as Error).message);
    process.exit(1);
  }
}

main();
