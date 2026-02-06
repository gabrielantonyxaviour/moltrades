# LI.FI Composer Integration Documentation

Complete documentation of the LI.FI Composer integration for multi-step DeFi operations on Base and Arbitrum.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Implementation Files](#core-implementation-files)
3. [Execution Patterns](#execution-patterns)
4. [Verified Transactions](#verified-transactions)
5. [Code Examples](#code-examples)
6. [Key Learnings](#key-learnings)

---

## Architecture Overview

### What is LI.FI Composer?

LI.FI Composer enables **atomic multi-step DeFi operations** in a single transaction:
- Swap tokens via DEX aggregation
- Bridge cross-chain via multiple bridges (Stargate, Across, etc.)
- Execute arbitrary contract calls (deposits, stakes, etc.)

### Single Transaction Flow

```
User signs 1 TX
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    LI.FI Diamond Contract                │
│                                                          │
│  Step 1: Collect protocol fee (tiny)                     │
│  Step 2: Wrap ETH → WETH (if needed)                     │
│  Step 3: DEX swap to target token (if needed)            │
│  Step 4: Bridge to destination chain (if cross-chain)    │
│  Step 5: Approve target protocol                         │
│  Step 6: Execute contract call (deposit/stake/etc)       │
│  Step 7: Return surplus to user                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
       │
       ▼
User receives protocol tokens (aTokens, vault shares, etc.)
```

---

## Core Implementation Files

### 1. SDK Configuration (`src/lib/config.ts`)

Initializes the LI.FI SDK with EVM provider and wallet client.

```typescript
// src/lib/config.ts:25-45
export function initializeLifiSDK(): { address: Address } {
  const privateKey = process.env.PRIVATE_KEY;
  // ... validation ...

  createConfig({
    integrator: 'ethglobal-playground',  // Whitelisted integrator
    providers: [
      EVM({
        getWalletClient: async () => walletClient,
        switchChain: async (chainId) => /* ... */,
      }),
    ],
  });

  return { address: walletClient.account.address };
}
```

**Key exports:**
- `initializeLifiSDK()` - Initialize SDK, returns wallet address
- `getWalletClient(chainId)` - Get viem wallet client for chain
- `getPublicClient(chainId)` - Get viem public client for chain
- `CHAIN_IDS` - Constants for Base (8453) and Arbitrum (42161)

---

### 2. Quote Fetching (`src/lib/quote.ts`)

Fetches quotes from LI.FI API with contract calls attached.

```typescript
// src/lib/quote.ts:45-85
export async function getComposerQuote(
  params: ComposerQuoteParams
): Promise<ContractCallsQuote> {
  const request: ContractCallsQuoteRequest = {
    fromChain: params.fromChain,
    fromToken: params.fromToken,
    fromAddress: params.fromAddress,
    toChain: params.toChain,
    toToken: params.toToken,
    toAmount: params.toAmount,
    contractCalls: params.contractCalls,
    // ...
  };

  const quote = await getContractCallsQuote(request);
  return quote;
}
```

**Important:** The quote contains `transactionRequest` which is the complete TX data to send.

---

### 3. Execution (`src/lib/execute.ts`)

**CRITICAL PATTERN:** Do NOT use `convertQuoteToRoute` + `executeRoute` for contract call quotes. Send `transactionRequest` directly.

```typescript
// src/lib/execute.ts:35-95
export async function executeComposerRoute(
  quote: ContractCallsQuote,
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  const chainId = quote.action.fromChainId;
  const walletClient = getWalletClient(chainId);
  const publicClient = getPublicClient(chainId);

  // Send the transaction directly - DO NOT use convertQuoteToRoute!
  const txHash = await walletClient.sendTransaction({
    to: quote.transactionRequest.to as Address,
    data: quote.transactionRequest.data as HexData,
    value: BigInt(quote.transactionRequest.value || '0'),
    account: walletClient.account!,
    chain: walletClient.chain!,
  });

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // For cross-chain, poll getStatus() until DONE
  if (quote.action.fromChainId !== quote.action.toChainId) {
    return await pollCrossChainStatus(txHash, quote);
  }

  return {
    status: receipt.status === 'success' ? 'DONE' : 'FAILED',
    sourceTxHash: txHash,
    // ...
  };
}
```

**Why not `executeRoute`?**
- `convertQuoteToRoute()` strips contract call data
- Results in error: `"Contract calls are not found"`
- Direct TX submission preserves all call data

---

### 4. Protocol Registry (`src/lib/protocols.ts`)

Defines 15 protocol deployments across Base and Arbitrum.

```typescript
// src/lib/protocols.ts:207-260
export const DEPLOYMENTS: ProtocolDeployment[] = [
  // Aave V3 WETH on Base
  {
    protocolId: 'aave-v3-weth',
    chainId: 8453,
    depositContract: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    depositFunction: 'supply(address,uint256,address,uint16)',
    inputToken: '0x4200000000000000000000000000000000000006', // WETH
    outputToken: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7', // aBasWETH
    gasLimit: '300000',
    requiresApproval: true,
  },
  // ... 14 more deployments
];
```

**Protocol action encoding:**

```typescript
// src/lib/protocols.ts:435-448
// Aave V3 supply - use exact amount (LI.FI guarantees >= toAmount arrives)
if (protocolId.startsWith('aave-v3')) {
  const callData = encodeFunctionData({
    abi: AAVE_V3_ABI,
    functionName: 'supply',
    args: [inputToken, BigInt(amount), userAddress, 0],
  }) as HexData;

  return {
    toContractAddress: depositContract,
    toContractCallData: callData,
    toContractGasLimit: gasLimit,
    contractOutputsToken: outputToken,
  };
}
```

**Supported protocols:**
| Protocol | Type | Chains | Function |
|----------|------|--------|----------|
| WETH Wrap | wrap | Base, Arb | `deposit()` |
| Aave V3 | lending | Base, Arb | `supply(asset, amount, onBehalfOf, referralCode)` |
| Compound V3 | lending | Base, Arb | `supply(asset, amount)` |
| Moonwell | lending | Base | `mint(amount)` |
| Morpho | vault | Base | `deposit(assets, receiver)` |
| Ethena sUSDe | vault | Base, Arb | `deposit(assets, receiver)` |

---

### 5. Contract Call Builder (`src/lib/actions.ts`)

Converts protocol actions to LI.FI ContractCall format.

```typescript
// src/lib/actions.ts:215-228
export function toContractCall(
  config: ContractCallConfig,
  fromAmount: AmountString,
  fromTokenAddress: Address
): ContractCall {
  return {
    fromAmount,
    fromTokenAddress,
    toContractAddress: config.toContractAddress,
    toContractCallData: config.toContractCallData,
    toContractGasLimit: config.toContractGasLimit,
    contractOutputsToken: config.contractOutputsToken,
  };
}
```

---

## Execution Patterns

### Pattern 1: Same-Chain WETH Deposit

**Example:** ETH → Aave V3 WETH on Base

```typescript
// From src/test-single.ts:52-78
const deployment = getDeployment('aave-v3-weth', 8453);
const actionConfig = generateProtocolAction(deployment, amount, address);
const contractCall = toContractCall(actionConfig, amount, deployment.inputToken);

const quote = await getComposerQuote({
  fromChain: 8453,
  fromToken: NATIVE_TOKEN_ADDRESS,  // ETH
  fromAddress: address,
  toChain: 8453,
  toToken: deployment.inputToken,   // WETH
  toAmount: amount,
  contractCalls: [contractCall],
});

const result = await executeComposerRoute(quote);
```

**What happens on-chain:**
1. LI.FI collects fee
2. Wraps ETH → WETH
3. Approves Aave Pool
4. Calls `pool.supply(WETH, amount, user, 0)`
5. Aave mints aWETH to user

---

### Pattern 2: Same-Chain with DEX Swap

**Example:** ETH → Aave V3 USDC on Arbitrum

```typescript
const deployment = getDeployment('aave-v3-usdc', 42161);
// fromToken: ETH, toToken: USDC
// LI.FI handles ETH → WETH → USDC swap automatically
```

**What happens on-chain:**
1. LI.FI collects fee
2. Wraps ETH → WETH
3. Swaps WETH → USDC via Uniswap V3
4. Approves Aave Pool
5. Calls `pool.supply(USDC, amount, user, 0)`
6. Aave mints aUSDC to user

---

### Pattern 3: Cross-Chain Bridge + Deposit

**Example:** Base ETH → Arb Aave V3 WETH

```typescript
// From src/test-cross-chain.ts:150-180
const quote = await getComposerQuote({
  fromChain: 8453,          // Base
  fromToken: NATIVE_TOKEN_ADDRESS,
  fromAddress: address,
  toChain: 42161,           // Arbitrum
  toToken: WETH_ARB,
  toAmount: BRIDGE_AMOUNT,
  contractCalls: [aaveWethCall],
});

const result = await executeComposerRoute(quote);
// result.sourceTxHash - Base TX
// result.destTxHash - Arb TX (after bridge completes)
```

**What happens:**

**On Base (source):**
1. LI.FI collects fee
2. Wraps ETH → WETH
3. Sends to StargateV2 bridge

**~30 seconds later on Arbitrum (destination):**
1. StargateV2 delivers WETH to executor
2. Executor transfers to LI.FI Diamond
3. Diamond approves Aave Pool
4. Diamond calls `pool.supply(WETH, amount, user, 0)`
5. Aave mints aWETH to user
6. Surplus WETH returned to user

---

## Verified Transactions

### Same-Chain Executions

| # | Protocol | Chain | TX Hash | Explorer |
|---|----------|-------|---------|----------|
| 1 | WETH Wrap | Base | `0x5d0dcc4ac49ca4f2b451912e543a879c113f86a2fe448e6ce4e149809c0e8eb6` | [basescan](https://basescan.org/tx/0x5d0dcc4ac49ca4f2b451912e543a879c113f86a2fe448e6ce4e149809c0e8eb6) |
| 2 | Aave V3 WETH | Base | `0x5a2fde6b196f6fe3e8df1b2354a33ed66999578ba4f5a89a09d319487a4ccfdf` | [basescan](https://basescan.org/tx/0x5a2fde6b196f6fe3e8df1b2354a33ed66999578ba4f5a89a09d319487a4ccfdf) |
| 3 | Compound V3 WETH | Base | `0x8d12d7e3a731e848a4944169c23cd6fee97faf4ec8fc4a5b8323e18ba1d8e5a5` | [basescan](https://basescan.org/tx/0x8d12d7e3a731e848a4944169c23cd6fee97faf4ec8fc4a5b8323e18ba1d8e5a5) |
| 4 | Moonwell WETH | Base | `0x0bd70be3ed647c1216579a764bf9d9b56403e062f9a0ef09d6795bb77a5202d5` | [basescan](https://basescan.org/tx/0x0bd70be3ed647c1216579a764bf9d9b56403e062f9a0ef09d6795bb77a5202d5) |
| 5 | Morpho WETH | Base | `0xf525338da8bde2119978a74c389ee6a51ee4c0c5515172fbc625e7bba17de319` | [basescan](https://basescan.org/tx/0xf525338da8bde2119978a74c389ee6a51ee4c0c5515172fbc625e7bba17de319) |
| 6 | Aave V3 WETH | Arb | `0xbf5595f1b0eed10482dabe2bec9bccb67e46f98877987608f5b0f1ed7efc1344` | [arbiscan](https://arbiscan.io/tx/0xbf5595f1b0eed10482dabe2bec9bccb67e46f98877987608f5b0f1ed7efc1344) |
| 7 | Aave V3 USDC | Arb | `0xbcf454128d36ed29b8c0264a47bbd741cceeb3ffdd65fa02e02c707f779647d4` | [arbiscan](https://arbiscan.io/tx/0xbcf454128d36ed29b8c0264a47bbd741cceeb3ffdd65fa02e02c707f779647d4) |

### Cross-Chain Execution

| Flow | Source TX (Base) | Dest TX (Arb) | Bridge |
|------|------------------|---------------|--------|
| Base → Arb Aave V3 WETH | [`0x9e544d5c...`](https://basescan.org/tx/0x9e544d5cc723cfe44bebbdbe8b5ebc40962ca528ba59f169b87aa821a85ed67c) | [`0x53df2019...`](https://arbiscan.io/tx/0x53df20195d4b8ff3ef1effd8a7f4e8d500815c8942bc002f43125c7cf546fc9d) | StargateV2 |

### Cross-Chain Event Breakdown

Decoded from Arb TX `0x53df20195d4b8ff3ef1effd8a7f4e8d500815c8942bc002f43125c7cf546fc9d`:

```
Event 1: WETH.Transfer (wrap)
  From: 0x0000 (mint)
  To:   0x5215...45d (Stargate executor)
  Amount: 0.0002017600 ETH

Event 2: WETH.Transfer (executor → Diamond)
  From: 0x5215...45d
  To:   0x2dfa...78D (LI.FI Diamond)
  Amount: 0.0002017600 WETH

Event 3: WETH.Transfer (Diamond → Aave)
  From: 0x2dfa...78D
  To:   0xe50f...8c8 (aWETH contract)
  Amount: 0.0002000000 WETH ← deposited into Aave

Event 4: aWETH.Transfer (MINT to user!)
  From: 0x0000 (mint)
  To:   0x5D3c...b858 (USER WALLET)
  Amount: 0.0002000001 aWETH ← user receives yield-bearing token

Event 5: Aave Supply event
  Asset: WETH
  OnBehalfOf: 0x5D3c...b858 (USER)
  Amount: 0.0002000000 WETH

Event 6: WETH.Transfer (surplus returned)
  From: 0x2dfa...78D (Diamond)
  To:   0x5D3c...b858 (USER)
  Amount: 0.0000017600 WETH ← favorable bridge rate surplus
```

---

## Code Examples

### Complete Same-Chain Deposit

```typescript
import 'dotenv/config';
import { initializeLifiSDK } from './lib/config';
import { getComposerQuote } from './lib/quote';
import { executeComposerRoute } from './lib/execute';
import { toContractCall, NATIVE_TOKEN_ADDRESS } from './lib/actions';
import { getDeployment, generateProtocolAction } from './lib/protocols';

async function depositToAave() {
  // 1. Initialize SDK
  const { address } = initializeLifiSDK();

  // 2. Get protocol deployment info
  const deployment = getDeployment('aave-v3-weth', 8453); // Base

  // 3. Generate protocol action calldata
  const amount = '100000000000000'; // 0.0001 ETH
  const actionConfig = generateProtocolAction(deployment, amount, address);
  const contractCall = toContractCall(actionConfig, amount, deployment.inputToken);

  // 4. Get quote from LI.FI
  const quote = await getComposerQuote({
    fromChain: 8453,
    fromToken: NATIVE_TOKEN_ADDRESS,
    fromAddress: address,
    toChain: 8453,
    toToken: deployment.inputToken,
    toAmount: amount,
    contractCalls: [contractCall],
  });

  console.log(`Steps: ${quote.includedSteps?.length}`);
  console.log(`From amount: ${quote.action.fromAmount} wei`);

  // 5. Execute
  const result = await executeComposerRoute(quote);

  console.log(`Status: ${result.status}`);
  console.log(`TX: ${result.sourceTxHash}`);
  console.log(`Explorer: ${result.explorerLinks.source}`);
}

depositToAave();
```

### Complete Cross-Chain Bridge + Deposit

```typescript
async function crossChainDeposit() {
  const { address } = initializeLifiSDK();

  // Get Aave V3 WETH on Arbitrum
  const deployment = getDeployment('aave-v3-weth', 42161);
  const amount = '200000000000000'; // 0.0002 ETH

  const actionConfig = generateProtocolAction(deployment, amount, address);
  const contractCall = toContractCall(actionConfig, amount, deployment.inputToken);

  // Quote: Base ETH → Arb WETH + Aave deposit
  const quote = await getComposerQuote({
    fromChain: 8453,          // Base (source)
    fromToken: NATIVE_TOKEN_ADDRESS,
    fromAddress: address,
    toChain: 42161,           // Arbitrum (destination)
    toToken: deployment.inputToken,
    toAmount: amount,
    contractCalls: [contractCall],
  });

  console.log(`Bridge: ${quote.tool}`); // e.g., "stargateV2"
  console.log(`Estimated time: ${quote.estimate?.executionDuration}s`);

  // Execute and wait for cross-chain completion
  const result = await executeComposerRoute(quote);

  console.log(`Source TX: ${result.sourceTxHash}`);
  console.log(`Dest TX: ${result.destTxHash}`);
  console.log(`Status: ${result.status}`);
}
```

---

## Key Learnings

### 1. Direct TX Submission is Required

**WRONG:**
```typescript
const route = convertQuoteToRoute(quote);
await executeRoute(route);
// Error: "Contract calls are not found"
```

**CORRECT:**
```typescript
await walletClient.sendTransaction({
  to: quote.transactionRequest.to,
  data: quote.transactionRequest.data,
  value: BigInt(quote.transactionRequest.value || '0'),
  account: walletClient.account!,
  chain: walletClient.chain!,
});
```

See: `src/lib/execute.ts:45-55`

### 2. Use Exact Amounts in Calldata

**WRONG:**
```typescript
args: [inputToken, maxUint256, userAddress, 0]
// Aave tries to transferFrom(maxUint256) - reverts
```

**CORRECT:**
```typescript
args: [inputToken, BigInt(amount), userAddress, 0]
// LI.FI guarantees >= amount arrives
```

See: `src/lib/protocols.ts:435-448`

### 3. LI.FI Handles Approvals Internally

The LI.FI Diamond contract:
1. Receives tokens from user/bridge
2. Calls `approve(targetProtocol, maxUint256)` internally
3. Then calls the protocol's deposit function

You do NOT need to handle ERC20 approvals for the protocol in your calldata.

### 4. Cross-Chain Status Polling

For cross-chain TXs, poll `getStatus()` until `status === 'DONE'`:

```typescript
// src/lib/execute.ts:100-130
while (true) {
  const status = await getStatus({ txHash });
  if (status.status === 'DONE') {
    return { destTxHash: status.receiving?.txHash, ... };
  }
  if (status.status === 'FAILED') {
    throw new Error('Bridge failed');
  }
  await sleep(5000);
}
```

### 5. Known Issues

**Base USDC/USDe swap routes broken:**
- ETH → USDC swaps on Base produce only 1 token unit
- Root cause: LI.FI DEX aggregator routing issue
- Workaround: Use Arbitrum for USDC deposits
- WETH deposits on Base work fine (no DEX swap needed)

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | SDK initialization, wallet/public clients |
| `src/lib/types.ts` | TypeScript interfaces for all LI.FI types |
| `src/lib/quote.ts` | Quote fetching with `getContractCallsQuote` |
| `src/lib/execute.ts` | Transaction execution + cross-chain polling |
| `src/lib/protocols.ts` | Protocol registry + calldata encoding |
| `src/lib/actions.ts` | ContractCall builders, WETH addresses |
| `src/test-single.ts` | Single protocol test runner |
| `src/test-cross-chain.ts` | Cross-chain bridge + deposit tests |
| `src/check-balances.ts` | Wallet balance checker |

---

## ETH Spent

```
Starting balances:
  Base: 0.00207 ETH    Arb: 0.00200 ETH

Final balances:
  Base: 0.00065 ETH    Arb: 0.00060 ETH

Total spent: ~0.00282 ETH (~$7.06 @ $2500/ETH)

Note: Most ETH was deposited into protocols (aTokens, vault shares),
      not lost to gas. Only ~0.001 ETH was pure gas + failed TXs.
```

---

*Generated from verified on-chain executions. All transaction hashes can be verified on Basescan and Arbiscan.*
