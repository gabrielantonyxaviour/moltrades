# Frontend Integration Plan: LI.FI Composer

## Executive Summary

Integrate the verified LI.FI Composer protocol infrastructure (from `scripts/`) into the MOLTRADES frontend to enable real cross-chain DeFi operations.

**Current State:**
- Frontend: Mock LI.FI API with hardcoded responses
- Scripts: Working LI.FI Composer integration with 44/48 protocols verified

**Goal:** Replace mocks with real SDK calls, enable wallet connections, and execute real transactions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐     │
│  │ Trade    │───▶│ Intent       │───▶│ LI.FI Service     │     │
│  │ Page     │    │ Parser       │    │ (New)             │     │
│  └──────────┘    └──────────────┘    └─────────┬─────────┘     │
│                                                 │               │
│  ┌──────────┐    ┌──────────────┐    ┌─────────▼─────────┐     │
│  │ Flow     │◀───│ Action       │◀───│ Protocol          │     │
│  │ Canvas   │    │ Generator    │    │ Registry          │     │
│  └──────────┘    └──────────────┘    └───────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Wallet Provider                        │  │
│  │          (wagmi + viem + RainbowKit/ConnectKit)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LI.FI SDK                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Quotes     │  │ Execution  │  │ Status     │                │
│  │ API        │  │ Engine     │  │ Tracker    │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Wallet Integration (Priority: HIGH)

### 1.1 Install Dependencies

```bash
cd frontend
npm install wagmi viem @tanstack/react-query @rainbow-me/rainbowkit
```

### 1.2 Create Wallet Configuration

**File:** `src/lib/wallet/config.ts`

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  bsc,
  avalanche,
  scroll,
  gnosis,
  linea,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'MOLTRADES',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [
    mainnet,
    arbitrum,
    base,
    optimism,
    polygon,
    bsc,
    avalanche,
    scroll,
    gnosis,
    linea,
  ],
  ssr: true,
});

export const SUPPORTED_CHAIN_IDS = [1, 10, 56, 100, 137, 8453, 42161, 43114, 59144, 534352];
```

### 1.3 Create Wallet Provider

**File:** `src/providers/wallet-provider.tsx`

```typescript
'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wallet/config';

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#ff4500',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 1.4 Update Header Connect Button

**File:** `src/components/layout/header.tsx`

Replace mock button with:
```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

// In component:
<ConnectButton />
```

### 1.5 Create Wallet Hook

**File:** `src/hooks/use-wallet.ts`

```typescript
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  return {
    address,
    isConnected,
    chainId,
    switchChain,
    walletClient,
  };
}
```

---

## Phase 2: LI.FI SDK Integration (Priority: HIGH)

### 2.1 Install LI.FI SDK

```bash
npm install @lifi/sdk
```

### 2.2 Create LI.FI Service

**File:** `src/lib/lifi/service.ts`

```typescript
import { createConfig, getContractCallsQuote, EVM } from '@lifi/sdk';
import type { ContractCallsQuoteRequest, LiFiStep } from '@lifi/sdk';

let initialized = false;

export function initLiFiSDK(getWalletClient: () => Promise<any>) {
  if (initialized) return;

  createConfig({
    integrator: 'moltrades',
    providers: [
      EVM({ getWalletClient }),
    ],
  });

  initialized = true;
}

export async function getQuote(request: ContractCallsQuoteRequest): Promise<LiFiStep> {
  return getContractCallsQuote(request);
}

export async function executeQuote(
  quote: LiFiStep,
  walletClient: any,
  callbacks?: {
    onTxSubmitted?: (hash: string) => void;
    onTxConfirmed?: (hash: string) => void;
    onError?: (error: Error) => void;
  }
) {
  // Execute transaction from quote.transactionRequest
  const hash = await walletClient.sendTransaction({
    to: quote.transactionRequest.to,
    data: quote.transactionRequest.data,
    value: BigInt(quote.transactionRequest.value || 0),
  });

  callbacks?.onTxSubmitted?.(hash);

  // Wait for confirmation
  const receipt = await walletClient.waitForTransactionReceipt({ hash });
  callbacks?.onTxConfirmed?.(hash);

  return { hash, receipt };
}
```

### 2.3 Create Protocol Registry (Copy from scripts)

**File:** `src/lib/lifi/protocols.ts`

Copy the verified protocol registry from `scripts/src/lib/protocols.ts`:
- `CHAIN_IDS`
- `TOKENS`
- `DEPLOYMENTS`
- `generateProtocolAction()`

### 2.4 Create Quote Builder Hook

**File:** `src/hooks/use-lifi-quote.ts`

```typescript
import { useState, useCallback } from 'react';
import { useWallet } from './use-wallet';
import { getQuote } from '@/lib/lifi/service';
import { generateProtocolAction, getDeployment } from '@/lib/lifi/protocols';

interface QuoteParams {
  protocolId: string;
  chainId: number;
  amount: string;
}

export function useLiFiQuote() {
  const { address, chainId } = useWallet();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async (params: QuoteParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deployment = getDeployment(params.protocolId, params.chainId);
      if (!deployment) {
        throw new Error(`Protocol ${params.protocolId} not available on chain ${params.chainId}`);
      }

      const action = generateProtocolAction(deployment, params.amount, address);

      const quoteRequest = {
        fromChain: params.chainId,
        toChain: params.chainId,
        fromToken: deployment.inputToken,
        toToken: deployment.inputToken,
        fromAddress: address,
        toAmount: params.amount,
        contractCalls: [{
          fromAmount: params.amount,
          fromTokenAddress: deployment.inputToken,
          toContractAddress: action.toContractAddress,
          toContractCallData: action.toContractCallData,
          toContractGasLimit: action.toContractGasLimit,
          contractOutputsToken: action.contractOutputsToken,
        }],
      };

      const result = await getQuote(quoteRequest);
      setQuote(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  return { quote, loading, error, fetchQuote };
}
```

---

## Phase 3: Intent Parser Enhancement (Priority: MEDIUM)

### 3.1 Update Intent Parser to Use Real Protocols

**File:** `src/lib/lifi/intent-parser.ts`

Enhance the existing parser to:
1. Map parsed intents to real protocol deployments
2. Validate chain/protocol availability
3. Generate proper contract call configs

```typescript
import { getDeployment, CHAIN_IDS, TOKENS } from './protocols';

// Add protocol mapping
const PROTOCOL_MAPPINGS = {
  aave: 'aave-v3',
  compound: 'compound-v3',
  morpho: 'morpho',
  moonwell: 'moonwell',
  seamless: 'seamless',
  lido: 'lido-wsteth',
  etherfi: 'etherfi-weeth',
  ethena: 'ethena-susde',
};

// Enhance parseIntent to return deployment-ready actions
export function parseIntentToAction(intent: string) {
  const parsed = parseIntent(intent);

  // Convert to protocol deployment
  const deployment = getDeployment(
    `${parsed.protocol}-${parsed.token.toLowerCase()}`,
    CHAIN_IDS[parsed.chain.toUpperCase()]
  );

  if (!deployment) {
    throw new Error(`Unsupported: ${parsed.protocol} on ${parsed.chain}`);
  }

  return {
    ...parsed,
    deployment,
    contractCall: generateProtocolAction(deployment, parsed.amount, address),
  };
}
```

---

## Phase 4: Flow Canvas Integration (Priority: MEDIUM)

### 4.1 Update Flow Nodes with Real Status

**File:** `src/components/trade/nodes/*.tsx`

Add real-time status updates:

```typescript
interface NodeData {
  // Existing fields...
  txHash?: string;
  explorerUrl?: string;
  gasEstimate?: string;
  status: 'idle' | 'pending' | 'executing' | 'confirmed' | 'failed';
}
```

### 4.2 Create Execution Manager

**File:** `src/lib/lifi/execution-manager.ts`

```typescript
import { executeQuote } from './service';

export class ExecutionManager {
  private steps: FlowNode[] = [];
  private currentStep = 0;
  private onUpdate: (step: number, status: NodeStatus) => void;

  constructor(steps: FlowNode[], onUpdate: (step: number, status: NodeStatus) => void) {
    this.steps = steps;
    this.onUpdate = onUpdate;
  }

  async execute(walletClient: any) {
    for (let i = 0; i < this.steps.length; i++) {
      this.currentStep = i;
      this.onUpdate(i, { status: 'executing' });

      try {
        const { hash, receipt } = await executeQuote(
          this.steps[i].quote,
          walletClient,
          {
            onTxSubmitted: (hash) => this.onUpdate(i, { status: 'pending', txHash: hash }),
            onTxConfirmed: (hash) => this.onUpdate(i, { status: 'confirmed', txHash: hash }),
          }
        );

        this.onUpdate(i, {
          status: 'confirmed',
          txHash: hash,
          explorerUrl: buildExplorerUrl(this.steps[i].chainId, hash),
        });
      } catch (error) {
        this.onUpdate(i, { status: 'failed', error: error.message });
        throw error;
      }
    }
  }
}
```

---

## Phase 5: Trade Page Rewrite (Priority: HIGH)

### 5.1 Main Trade Page Updates

**File:** `src/app/trade/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useLiFiQuote } from '@/hooks/use-lifi-quote';
import { parseIntentToAction } from '@/lib/lifi/intent-parser';
import { executeQuote } from '@/lib/lifi/service';
import { ChatPanel } from '@/components/trade/chat-panel';
import { FlowCanvas } from '@/components/trade/flow-canvas';

export default function TradePage() {
  const { address, walletClient, isConnected } = useWallet();
  const { fetchQuote, loading: quoteLoading } = useLiFiQuote();
  const [flowNodes, setFlowNodes] = useState([]);
  const [executing, setExecuting] = useState(false);

  const handleIntent = async (intent: string) => {
    try {
      // Parse intent to action
      const action = parseIntentToAction(intent);

      // Get real quote
      const quote = await fetchQuote({
        protocolId: action.protocolId,
        chainId: action.chainId,
        amount: action.amount,
      });

      // Update flow canvas with real data
      setFlowNodes(buildFlowNodes(action, quote));
    } catch (error) {
      // Handle error
    }
  };

  const handleExecute = async () => {
    if (!walletClient || !flowNodes.length) return;

    setExecuting(true);
    try {
      for (const node of flowNodes) {
        await executeQuote(node.quote, walletClient, {
          onTxSubmitted: (hash) => updateNodeStatus(node.id, 'pending', hash),
          onTxConfirmed: (hash) => updateNodeStatus(node.id, 'confirmed', hash),
        });
      }
    } catch (error) {
      // Handle error
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex h-full">
      <ChatPanel onIntent={handleIntent} loading={quoteLoading} />
      <FlowCanvas
        nodes={flowNodes}
        onExecute={handleExecute}
        executing={executing}
      />
    </div>
  );
}
```

---

## Phase 6: Protocol Selection UI (Priority: MEDIUM)

### 6.1 Protocol Picker Component

**File:** `src/components/trade/protocol-picker.tsx`

```typescript
import { PROTOCOLS, getDeploymentsForChain } from '@/lib/lifi/protocols';

interface ProtocolPickerProps {
  chainId: number;
  onSelect: (protocolId: string) => void;
}

export function ProtocolPicker({ chainId, onSelect }: ProtocolPickerProps) {
  const deployments = getDeploymentsForChain(chainId);
  const protocols = [...new Set(deployments.map(d => d.protocolId))];

  return (
    <div className="grid grid-cols-2 gap-2">
      {protocols.map(protocolId => {
        const protocol = PROTOCOLS.find(p => p.id === protocolId);
        return (
          <button
            key={protocolId}
            onClick={() => onSelect(protocolId)}
            className="p-3 rounded-lg border hover:border-primary"
          >
            <div className="font-medium">{protocol?.name}</div>
            <div className="text-xs text-muted-foreground">{protocol?.type}</div>
          </button>
        );
      })}
    </div>
  );
}
```

### 6.2 Chain Selector with Protocol Availability

**File:** `src/components/trade/chain-selector.tsx`

```typescript
import { CHAIN_IDS, getDeploymentCountsByChain } from '@/lib/lifi/protocols';

export function ChainSelector({ onSelect }: { onSelect: (chainId: number) => void }) {
  const counts = getDeploymentCountsByChain();

  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(CHAIN_IDS).map(([name, id]) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className="px-3 py-1 rounded-full border hover:border-primary"
        >
          {name}
          <span className="ml-1 text-xs text-muted-foreground">
            ({counts[id] || 0})
          </span>
        </button>
      ))}
    </div>
  );
}
```

---

## Phase 7: Error Handling & Status (Priority: MEDIUM)

### 7.1 Transaction Status Tracker

**File:** `src/components/trade/tx-status.tsx`

```typescript
import { useState, useEffect } from 'react';
import { getStatus } from '@lifi/sdk';

export function TxStatus({ txHash, bridge, fromChain, toChain }) {
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const poll = async () => {
      const result = await getStatus({ txHash, bridge, fromChain, toChain });
      setStatus(result.status);
      // Update progress based on substatus
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [txHash]);

  return (
    <div className="flex items-center gap-2">
      <StatusIcon status={status} />
      <span>{status}</span>
      {status === 'PENDING' && <Progress value={progress} />}
    </div>
  );
}
```

---

## Implementation Order

| Phase | Task | Priority | Effort | Dependencies |
|-------|------|----------|--------|--------------|
| 1 | Wallet Integration | HIGH | 2-3 hours | None |
| 2 | LI.FI SDK Integration | HIGH | 3-4 hours | Phase 1 |
| 3 | Intent Parser Enhancement | MEDIUM | 2-3 hours | Phase 2 |
| 4 | Flow Canvas Integration | MEDIUM | 3-4 hours | Phase 2, 3 |
| 5 | Trade Page Rewrite | HIGH | 4-5 hours | Phase 1-4 |
| 6 | Protocol Selection UI | MEDIUM | 2-3 hours | Phase 2 |
| 7 | Error Handling & Status | MEDIUM | 2-3 hours | Phase 5 |

**Total Estimated Effort: 18-25 hours**

---

## File Structure After Integration

```
frontend/src/
├── app/
│   └── trade/
│       └── page.tsx          # Updated with real execution
├── components/
│   └── trade/
│       ├── chat-panel.tsx    # Enhanced with protocol hints
│       ├── flow-canvas.tsx   # Real-time status updates
│       ├── protocol-picker.tsx   # NEW
│       ├── chain-selector.tsx    # NEW
│       ├── tx-status.tsx         # NEW
│       └── nodes/
│           └── *.tsx         # Real status + tx hashes
├── hooks/
│   ├── use-wallet.ts         # NEW
│   ├── use-lifi-quote.ts     # NEW
│   └── use-tx-status.ts      # NEW
├── lib/
│   ├── lifi/
│   │   ├── service.ts        # NEW - SDK wrapper
│   │   ├── protocols.ts      # COPY from scripts
│   │   ├── execution-manager.ts  # NEW
│   │   └── intent-parser.ts  # ENHANCED
│   └── wallet/
│       └── config.ts         # NEW
└── providers/
    └── wallet-provider.tsx   # NEW
```

---

## Environment Variables Needed

```env
# .env.local
NEXT_PUBLIC_WC_PROJECT_ID=xxx     # WalletConnect Project ID
NEXT_PUBLIC_LIFI_INTEGRATOR=moltrades
```

---

## Testing Checklist

After each phase:

- [ ] **Phase 1:** Connect wallet, switch chains, see address in header
- [ ] **Phase 2:** Get real quotes for Aave/Compound/Moonwell deposits
- [ ] **Phase 3:** Parse "Deposit 0.1 ETH into Aave on Base" → real quote
- [ ] **Phase 4:** See real gas estimates and tx status in flow canvas
- [ ] **Phase 5:** Execute full flow: connect → parse → quote → execute → confirm
- [ ] **Phase 6:** Select protocols from UI, see chain availability
- [ ] **Phase 7:** Track cross-chain tx status, handle errors gracefully

---

## Verified Protocols to Enable

From testing (91.7% success rate):

| Protocol | Chains | Status |
|----------|--------|--------|
| WETH Wrap | ETH, ARB, BASE, OP, LINEA, SCROLL | ✅ |
| Aave V3 WETH | ETH, ARB, BASE, OP, POLY, AVAX, SCROLL, GNO | ✅ |
| Aave V3 USDC | ETH, ARB, BASE, OP, POLY, BSC, AVAX, SCROLL, GNO | ✅ |
| Compound V3 USDC | ETH, ARB, BASE, OP, POLY | ✅ |
| Compound V3 WETH | ETH, ARB, BASE, OP | ✅ |
| Morpho USDC | ETH, BASE | ✅ |
| Lido wstETH | ETH | ✅ |
| EtherFi weETH | ETH | ✅ |
| Ethena sUSDe | ETH, ARB, BASE | ✅ |
| Seamless | BASE | ✅ |
| Moonwell | BASE | ✅ |
