#!/usr/bin/env npx tsx
/**
 * Comprehensive Quote Test Script
 *
 * Tests LI.FI Composer quotes across all protocol deployments and chain pairs.
 * Run: npx tsx scripts/test-all-quotes.ts
 *
 * Requirements:
 *   - PRIVATE_KEY in .env (only used for address, no real trades executed)
 */

import 'dotenv/config';
import { createConfig, EVM, getContractCallsQuote, getQuote } from '@lifi/sdk';
import { createWalletClient, http, encodeFunctionData, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import {
  PROTOCOLS,
  DEPLOYMENTS,
  CHAIN_IDS,
  generateProtocolAction,
  getChainName,
} from '../src/lib/protocols.js';
import type { Address, AmountString } from '../src/lib/types.js';

// =============================================================================
// SETUP
// =============================================================================

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('ERROR: PRIVATE_KEY not set in .env');
  process.exit(1);
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
const fromAddress = account.address as Address;

// Initialize LI.FI SDK
createConfig({
  integrator: 'moltrades-test',
  providers: [
    EVM({
      getWalletClient: async () =>
        createWalletClient({ account, chain: base, transport: http() }),
    }),
  ],
});

// =============================================================================
// TYPES
// =============================================================================

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];
let passed = 0;
let failed = 0;

// =============================================================================
// HELPERS
// =============================================================================

function log(msg: string) {
  console.log(msg);
}

function logResult(result: TestResult) {
  const icon = result.status === 'PASS' ? '\u2705' : '\u274C';
  const dur = `(${result.durationMs}ms)`;
  log(`  ${icon} ${result.name} ${dur}${result.error ? ' — ' + result.error : ''}`);
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const result: TestResult = { name, status: 'PASS', durationMs: Date.now() - start };
    results.push(result);
    logResult(result);
    passed++;
  } catch (error) {
    const err = error as Error;
    const result: TestResult = {
      name,
      status: 'FAIL',
      error: err.message.slice(0, 200),
      durationMs: Date.now() - start,
    };
    results.push(result);
    logResult(result);
    failed++;
  }
}

// Small test amounts per token
function getTestAmount(tokenSymbol: string): AmountString {
  switch (tokenSymbol.toUpperCase()) {
    case 'ETH':
    case 'WETH':
      return '100000000000000'; // 0.0001 ETH
    case 'USDC':
    case 'USDT':
      return '100000'; // 0.1 USDC/USDT (6 decimals)
    case 'DAI':
    case 'USDE':
    case 'SUSDE':
    case 'STETH':
      return '100000000000000'; // 0.0001 (18 decimals)
    default:
      return '100000000000000'; // 0.0001 (18 decimals)
  }
}

// Native ETH address used by LI.FI
const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ZERO = '0x0000000000000000000000000000000000000000';

// =============================================================================
// TEST 1: Protocol Deployment Quotes (same-chain)
// =============================================================================

async function testProtocolDeployments() {
  log('\n=== Protocol Deployment Quotes (Same-Chain) ===\n');

  for (const deployment of DEPLOYMENTS) {
    const chainName = getChainName(deployment.chainId);
    const testName = `${deployment.protocolId} on ${chainName} (${deployment.inputTokenSymbol})`;
    const amount = getTestAmount(deployment.inputTokenSymbol);

    await runTest(testName, async () => {
      const action = generateProtocolAction(deployment, amount, fromAddress);

      const sourceToken =
        deployment.protocolId === 'weth-wrap'
          ? ZERO
          : deployment.inputToken;

      const quote = await getContractCallsQuote({
        fromChain: deployment.chainId,
        toChain: deployment.chainId,
        fromToken: sourceToken,
        toToken: deployment.inputToken,
        toAmount: amount,
        fromAddress,
        contractCalls: [
          {
            fromAmount: amount,
            fromTokenAddress: deployment.inputToken,
            toContractAddress: action.toContractAddress,
            toContractCallData: action.toContractCallData,
            toContractGasLimit: action.toContractGasLimit,
            contractOutputsToken: action.contractOutputsToken,
          },
        ],
        toFallbackAddress: fromAddress,
        slippage: 0.03,
        integrator: 'moltrades-test',
      });

      if (!quote || !quote.estimate) {
        throw new Error('No estimate returned');
      }
    });
  }
}

// =============================================================================
// TEST 2: Cross-Chain Quotes
// =============================================================================

const CROSS_CHAIN_PAIRS: { from: number; to: number; label: string }[] = [
  { from: CHAIN_IDS.ARBITRUM, to: CHAIN_IDS.BASE, label: 'Arbitrum → Base' },
  { from: CHAIN_IDS.BASE, to: CHAIN_IDS.ARBITRUM, label: 'Base → Arbitrum' },
  { from: CHAIN_IDS.ETHEREUM, to: CHAIN_IDS.OPTIMISM, label: 'Ethereum → Optimism' },
  { from: CHAIN_IDS.ETHEREUM, to: CHAIN_IDS.BASE, label: 'Ethereum → Base' },
  { from: CHAIN_IDS.ARBITRUM, to: CHAIN_IDS.OPTIMISM, label: 'Arbitrum → Optimism' },
  { from: CHAIN_IDS.POLYGON, to: CHAIN_IDS.BASE, label: 'Polygon → Base' },
];

async function testCrossChainBridge() {
  log('\n=== Cross-Chain Bridge Quotes (ETH) ===\n');

  for (const pair of CROSS_CHAIN_PAIRS) {
    const testName = `Bridge ETH ${pair.label}`;

    await runTest(testName, async () => {
      const quote = await getQuote({
        fromChain: pair.from,
        toChain: pair.to,
        fromToken: NATIVE_ETH,
        toToken: NATIVE_ETH,
        fromAmount: '100000000000000', // 0.0001 ETH
        fromAddress,
        slippage: 0.03,
        integrator: 'moltrades-test',
      });

      if (!quote || !quote.estimate) {
        throw new Error('No estimate returned');
      }
    });
  }
}

// =============================================================================
// TEST 3: Simple Swaps (ETH → USDC) per chain
// =============================================================================

const USDC_BY_CHAIN: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [CHAIN_IDS.ARBITRUM]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [CHAIN_IDS.BASE]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [CHAIN_IDS.OPTIMISM]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  [CHAIN_IDS.POLYGON]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  [CHAIN_IDS.AVALANCHE]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  [CHAIN_IDS.SCROLL]: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
  [CHAIN_IDS.GNOSIS]: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
};

async function testSimpleSwaps() {
  log('\n=== Simple Swap Quotes (ETH → USDC) ===\n');

  for (const [chainIdStr, usdcAddr] of Object.entries(USDC_BY_CHAIN)) {
    const chainId = Number(chainIdStr);
    const chainName = getChainName(chainId);
    const testName = `Swap ETH → USDC on ${chainName}`;

    await runTest(testName, async () => {
      const quote = await getQuote({
        fromChain: chainId,
        toChain: chainId,
        fromToken: NATIVE_ETH,
        toToken: usdcAddr,
        fromAmount: '100000000000000', // 0.0001 ETH
        fromAddress,
        slippage: 0.03,
        integrator: 'moltrades-test',
      });

      if (!quote || !quote.estimate) {
        throw new Error('No estimate returned');
      }
    });
  }
}

// =============================================================================
// TEST 4: Cross-chain + Deposit (Aave V3 WETH)
// =============================================================================

async function testCrossChainDeposit() {
  log('\n=== Cross-Chain Deposit Quotes ===\n');

  // Aave V3 WETH on Base, sourcing from Arbitrum
  const aaveBaseDeployment = DEPLOYMENTS.find(
    (d) => d.protocolId === 'aave-v3-weth' && d.chainId === CHAIN_IDS.BASE
  );

  if (aaveBaseDeployment) {
    await runTest('ETH on Arbitrum → Aave V3 WETH on Base', async () => {
      const amount = '100000000000000'; // 0.0001 ETH
      const action = generateProtocolAction(aaveBaseDeployment, amount, fromAddress);

      const quote = await getContractCallsQuote({
        fromChain: CHAIN_IDS.ARBITRUM,
        toChain: CHAIN_IDS.BASE,
        fromToken: NATIVE_ETH,
        toToken: aaveBaseDeployment.inputToken,
        toAmount: amount,
        fromAddress,
        contractCalls: [
          {
            fromAmount: amount,
            fromTokenAddress: aaveBaseDeployment.inputToken,
            toContractAddress: action.toContractAddress,
            toContractCallData: action.toContractCallData,
            toContractGasLimit: action.toContractGasLimit,
            contractOutputsToken: action.contractOutputsToken,
          },
        ],
        toFallbackAddress: fromAddress,
        slippage: 0.03,
        integrator: 'moltrades-test',
      });

      if (!quote || !quote.estimate) {
        throw new Error('No estimate returned');
      }
    });
  }

  // Compound V3 USDC on Optimism, sourcing from Ethereum
  const compoundOptDeployment = DEPLOYMENTS.find(
    (d) => d.protocolId === 'compound-v3-usdc' && d.chainId === CHAIN_IDS.OPTIMISM
  );

  if (compoundOptDeployment) {
    await runTest('USDC on Ethereum → Compound V3 USDC on Optimism', async () => {
      const amount = '100000'; // 0.1 USDC
      const action = generateProtocolAction(compoundOptDeployment, amount, fromAddress);

      const quote = await getContractCallsQuote({
        fromChain: CHAIN_IDS.ETHEREUM,
        toChain: CHAIN_IDS.OPTIMISM,
        fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
        toToken: compoundOptDeployment.inputToken,
        toAmount: amount,
        fromAddress,
        contractCalls: [
          {
            fromAmount: amount,
            fromTokenAddress: compoundOptDeployment.inputToken,
            toContractAddress: action.toContractAddress,
            toContractCallData: action.toContractCallData,
            toContractGasLimit: action.toContractGasLimit,
            contractOutputsToken: action.contractOutputsToken,
          },
        ],
        toFallbackAddress: fromAddress,
        slippage: 0.03,
        integrator: 'moltrades-test',
      });

      if (!quote || !quote.estimate) {
        throw new Error('No estimate returned');
      }
    });
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  log('==========================================================');
  log('  Moltrades — Comprehensive Quote Test Suite');
  log(`  Address: ${fromAddress}`);
  log(`  Protocols: ${PROTOCOLS.length}`);
  log(`  Deployments: ${DEPLOYMENTS.length}`);
  log(`  Chains: ${Object.keys(CHAIN_IDS).length}`);
  log('==========================================================');

  await testProtocolDeployments();
  await testCrossChainBridge();
  await testSimpleSwaps();
  await testCrossChainDeposit();

  log('\n==========================================================');
  log(`  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`);
  log('==========================================================');

  if (failed > 0) {
    log('\nFailed tests:');
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      log(`  - ${r.name}: ${r.error}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
