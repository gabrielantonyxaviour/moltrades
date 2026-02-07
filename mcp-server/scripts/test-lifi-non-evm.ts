import 'dotenv/config';
import {
  createConfig,
  getQuote,
  getChains,
  ChainType,
  EVM,
  Solana,
} from '@lifi/sdk';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Initialize the LI.FI SDK (required before any API call)
createConfig({
  integrator: 'moltrades-test',
  providers: [EVM(), Solana()],
});

// Chain IDs
const SOLANA_CHAIN_ID = 1151111081099710;
const BASE_CHAIN_ID = 8453;

// Well-known token addresses
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const WBTC_BASE = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'; // cbBTC on Base (wrapped BTC variant)

// Native token placeholder used by LI.FI for the chain's native gas token
const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

// Dummy addresses for quote requests (we never execute, just fetch quotes)
const DUMMY_SOL_ADDRESS = 'So11111111111111111111111111111111111111112'; // Wrapped SOL mint (acts as a valid Solana address)
const DUMMY_EVM_ADDRESS = '0x552008c0f6b3588E0028576592739482DfAd7B65';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function separator(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70) + '\n');
}

function logChainSummary(chains: { id: number; name: string; chainType: string }[]) {
  const grouped: Record<string, { id: number; name: string }[]> = {};
  for (const c of chains) {
    if (!grouped[c.chainType]) grouped[c.chainType] = [];
    grouped[c.chainType].push({ id: c.id, name: c.name });
  }
  for (const [type, list] of Object.entries(grouped)) {
    console.log(`  ${type} (${list.length} chains):`);
    for (const c of list.slice(0, 8)) {
      console.log(`    - ${c.name} (id: ${c.id})`);
    }
    if (list.length > 8) {
      console.log(`    ... and ${list.length - 8} more`);
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Discover supported chain types
// ---------------------------------------------------------------------------

async function discoverChainTypes() {
  separator('Step 1: Discover supported chain types via getChains()');

  // Fetch all chains (no filter)
  console.log('Fetching ALL chains...');
  const allChains = await getChains();
  console.log(`Total chains returned: ${allChains.length}\n`);
  logChainSummary(allChains);

  // Now fetch per chain-type to confirm non-EVM support
  const chainTypes = [ChainType.EVM, ChainType.SVM, ChainType.UTXO, ChainType.MVM, ChainType.TVM];
  for (const ct of chainTypes) {
    try {
      const chains = await getChains({ chainTypes: [ct] });
      console.log(`\n  getChains({ chainTypes: ['${ct}'] }) => ${chains.length} chains`);
      if (chains.length > 0) {
        for (const c of chains.slice(0, 5)) {
          console.log(`    - ${c.name} (id: ${c.id})`);
        }
        if (chains.length > 5) console.log(`    ... and ${chains.length - 5} more`);
      }
    } catch (err: any) {
      console.log(`  getChains({ chainTypes: ['${ct}'] }) => ERROR: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Test specific cross-chain quote routes
// ---------------------------------------------------------------------------

interface RouteTest {
  label: string;
  fromChain: number;
  fromToken: string;
  fromAddress: string;
  fromAmount: string;
  toChain: number;
  toToken: string;
  toAddress: string;
}

const routeTests: RouteTest[] = [
  {
    label: 'SOL (Solana) -> USDC on Base',
    fromChain: SOLANA_CHAIN_ID,
    fromToken: NATIVE_TOKEN, // native SOL
    fromAddress: DUMMY_SOL_ADDRESS,
    fromAmount: '1000000000', // 1 SOL (9 decimals)
    toChain: BASE_CHAIN_ID,
    toToken: USDC_BASE,
    toAddress: DUMMY_EVM_ADDRESS,
  },
  {
    label: 'USDC (Solana) -> USDC on Base',
    fromChain: SOLANA_CHAIN_ID,
    fromToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana (SPL mint)
    fromAddress: DUMMY_SOL_ADDRESS,
    fromAmount: '1000000', // 1 USDC (6 decimals)
    toChain: BASE_CHAIN_ID,
    toToken: USDC_BASE,
    toAddress: DUMMY_EVM_ADDRESS,
  },
  {
    label: 'BTC (Bitcoin / UTXO) -> cbBTC on Base',
    fromChain: 20000000000001, // LI.FI Bitcoin chain ID (if supported)
    fromToken: NATIVE_TOKEN,
    fromAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', // dummy BTC address
    fromAmount: '10000000', // 0.1 BTC (8 decimals)
    toChain: BASE_CHAIN_ID,
    toToken: WBTC_BASE,
    toAddress: DUMMY_EVM_ADDRESS,
  },
];

async function testQuoteRoutes() {
  separator('Step 2: Test cross-chain quote routes (non-EVM -> EVM)');

  for (const route of routeTests) {
    console.log(`\n--- ${route.label} ---`);
    console.log(`  fromChain: ${route.fromChain}`);
    console.log(`  fromToken: ${route.fromToken}`);
    console.log(`  fromAmount: ${route.fromAmount}`);
    console.log(`  toChain: ${route.toChain}`);
    console.log(`  toToken: ${route.toToken}`);

    try {
      const quote = await getQuote({
        fromChain: route.fromChain,
        fromToken: route.fromToken,
        fromAddress: route.fromAddress,
        fromAmount: route.fromAmount,
        toChain: route.toChain,
        toToken: route.toToken,
        toAddress: route.toAddress,
        slippage: 0.03, // 3%
      });

      console.log('\n  QUOTE FOUND!');
      console.log(`  Tool used     : ${quote.tool}`);
      console.log(`  Type          : ${quote.type}`);
      console.log(`  From          : ${quote.action.fromToken.symbol} on chain ${quote.action.fromChainId}`);
      console.log(`  To            : ${quote.action.toToken.symbol} on chain ${quote.action.toChainId}`);
      console.log(`  fromAmount    : ${quote.action.fromAmount}`);
      console.log(`  Est. toAmount : ${quote.estimate.toAmount}`);
      console.log(`  Est. toAmountMin: ${quote.estimate.toAmountMin}`);
      if (quote.estimate.gasCosts && quote.estimate.gasCosts.length > 0) {
        for (const gc of quote.estimate.gasCosts) {
          console.log(`  Gas cost      : ${gc.amount} ${gc.token.symbol} (~$${gc.amountUSD})`);
        }
      }
      if (quote.estimate.feeCosts && quote.estimate.feeCosts.length > 0) {
        for (const fc of quote.estimate.feeCosts) {
          console.log(`  Fee           : ${fc.amount} ${fc.token.symbol} (~$${fc.amountUSD})`);
        }
      }
    } catch (err: any) {
      console.log(`\n  NO ROUTE / ERROR:`);
      console.log(`  ${err.message || err}`);
      if (err.code) console.log(`  Error code: ${err.code}`);
      if (err.htmlMessage) console.log(`  Details: ${err.htmlMessage}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Summary of SUI support (attempt chain discovery)
// ---------------------------------------------------------------------------

async function checkSuiSupport() {
  separator('Step 3: Check SUI chain support');

  try {
    const allChains = await getChains();
    const suiChains = allChains.filter(
      (c) => c.name.toLowerCase().includes('sui') || c.chainType === ('SUI' as any)
    );

    if (suiChains.length > 0) {
      console.log(`Found ${suiChains.length} SUI-related chain(s):`);
      for (const c of suiChains) {
        console.log(`  - ${c.name} (id: ${c.id}, type: ${c.chainType})`);
      }

      // If we found a SUI chain, try a quote
      const suiChain = suiChains[0];
      console.log(`\nAttempting quote: SUI native -> USDC on Base...`);
      try {
        const quote = await getQuote({
          fromChain: suiChain.id,
          fromToken: NATIVE_TOKEN,
          fromAddress: '0x0000000000000000000000000000000000000000000000000000000000000001', // dummy SUI address
          fromAmount: '1000000000', // 1 SUI (9 decimals)
          toChain: BASE_CHAIN_ID,
          toToken: USDC_BASE,
          toAddress: DUMMY_EVM_ADDRESS,
          slippage: 0.03,
        });
        console.log(`  QUOTE FOUND! Tool: ${quote.tool}, est. toAmount: ${quote.estimate.toAmount}`);
      } catch (err: any) {
        console.log(`  NO ROUTE / ERROR: ${err.message || err}`);
      }
    } else {
      console.log('No SUI chains found in getChains() response.');
      console.log('SUI bridging may not yet be supported by LI.FI.');
    }
  } catch (err: any) {
    console.log(`Error checking SUI support: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('==================================================');
  console.log('  LI.FI SDK - Non-EVM Chain Support Test');
  console.log('  Testing: Solana, SUI, BTC -> EVM (Base) routes');
  console.log('==================================================');

  await discoverChainTypes();
  await testQuoteRoutes();
  await checkSuiSupport();

  separator('Done');
  console.log('All tests complete. No transactions were executed.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
