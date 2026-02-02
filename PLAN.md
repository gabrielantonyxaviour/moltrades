# Visual Flow Builder Implementation Plan

## Overview
Build a ChatGPT-like interface combined with an n8n-style visual flow builder for constructing and executing cross-chain DeFi trades using LI.FI Composer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         /trade (new page)                           │
├──────────────────┬──────────────────────────────┬───────────────────┤
│   Chat Panel     │      Flow Canvas             │   Details Panel   │
│   (left)         │      (center)                │   (right)         │
│                  │                              │                   │
│  - Message list  │  - ReactFlow canvas          │  - Node config    │
│  - Input box     │  - Custom DeFi nodes         │  - Execution log  │
│  - Suggestions   │  - Animated connections      │  - Route details  │
│                  │  - Mini map                  │  - Gas estimates  │
└──────────────────┴──────────────────────────────┴───────────────────┘
```

---

## File Structure

```
src/
├── app/
│   └── (main)/
│       └── trade/
│           └── page.tsx              # Main trade builder page
│
├── components/
│   └── trade/
│       ├── index.ts                  # Exports
│       ├── chat-panel.tsx            # Chat interface
│       ├── message-bubble.tsx        # Chat message component
│       ├── flow-canvas.tsx           # ReactFlow wrapper
│       ├── details-panel.tsx         # Right panel for config/logs
│       ├── execution-status.tsx      # Execution progress tracker
│       └── nodes/
│           ├── index.ts              # Node type exports
│           ├── base-node.tsx         # Base node wrapper with styling
│           ├── token-input-node.tsx  # Starting token selection
│           ├── bridge-node.tsx       # Cross-chain bridge step
│           ├── swap-node.tsx         # Token swap step
│           ├── deposit-node.tsx      # Protocol deposit step
│           └── output-node.tsx       # Final output display
│
├── lib/
│   └── lifi/
│       ├── types.ts                  # LI.FI type definitions
│       ├── api.ts                    # LI.FI API calls (mock initially)
│       └── intent-parser.ts          # Natural language → flow steps
│
└── hooks/
    ├── use-flow-state.ts             # Flow nodes/edges state
    └── use-execution.ts              # Execution state management
```

---

## Implementation Steps

### Phase 1: Core Layout & Basic Components

#### Step 1.1: Install dependencies
```bash
npm install @xyflow/react
```

#### Step 1.2: Create the trade page layout
- Three-panel responsive layout
- Collapsible panels for mobile
- Dark theme matching existing design

#### Step 1.3: Build Chat Panel
- Message list with user/assistant distinction
- Input with send button
- Typing indicator
- Suggested prompts (quick actions)

#### Step 1.4: Build Flow Canvas (empty state)
- ReactFlow setup with dark theme
- Controls, MiniMap, Background
- Empty state with "Start by chatting" message

---

### Phase 2: Custom DeFi Nodes

#### Step 2.1: Base Node Component
- Consistent styling with brand colors
- Status indicators (pending/active/complete/error)
- Handles for input/output connections
- Animated glow effects on active state

#### Step 2.2: Token Input Node
- Chain selector dropdown
- Token selector with search
- Amount input with USD conversion
- Balance display (mock)

#### Step 2.3: Bridge Node
- Source chain → Destination chain
- Bridge provider logo (from LI.FI)
- Estimated time
- Fee display

#### Step 2.4: Swap Node
- Token pair display (FROM → TO)
- DEX/aggregator name
- Price impact indicator
- Slippage settings

#### Step 2.5: Deposit Node
- Protocol logo and name
- APY display
- Vault/pool details
- Expected output tokens

#### Step 2.6: Output Node
- Final token display
- Total value
- Summary of fees paid
- Transaction links (when executed)

---

### Phase 3: Intent Parser & Flow Generation

#### Step 3.1: Intent Parser (Mock)
Parse natural language into structured flow:
```typescript
interface ParsedIntent {
  steps: FlowStep[];
  confidence: number;
  summary: string;
}

interface FlowStep {
  type: 'bridge' | 'swap' | 'deposit' | 'withdraw';
  params: Record<string, any>;
}
```

#### Step 3.2: Flow Generator
Convert parsed intent into ReactFlow nodes/edges:
- Calculate node positions (vertical layout)
- Create edges between sequential steps
- Add input/output nodes automatically

#### Step 3.3: Chat → Flow Integration
- User sends message
- Parse intent (mock AI response)
- Generate and display flow
- Show assistant confirmation message

---

### Phase 4: Execution Visualization

#### Step 4.1: Execution State Machine
States per node:
- `idle` - Not started
- `pending` - Waiting for previous step
- `signing` - Awaiting wallet signature
- `executing` - Transaction submitted
- `confirming` - Waiting for confirmation
- `complete` - Success
- `error` - Failed

#### Step 4.2: Real-time Node Updates
- Animated status transitions
- Progress indicators
- Time elapsed display
- Transaction hash links

#### Step 4.3: Execution Log Panel
- Step-by-step log entries
- Timestamps
- Expandable details
- Copy transaction hashes

---

### Phase 5: Details Panel & Configuration

#### Step 5.1: Node Configuration
When a node is selected:
- Show editable parameters
- Slippage settings
- Gas price options
- Advanced options toggle

#### Step 5.2: Route Summary
- Total estimated time
- Total gas fees
- Price impact summary
- Alternative routes (future)

#### Step 5.3: Execute Button
- Prominent CTA at bottom
- Disabled until flow is valid
- Shows total cost estimate
- Connects to wallet

---

## Node Designs (Visual Reference)

### Token Input Node
```
┌─────────────────────────────────┐
│  INPUT                          │
├─────────────────────────────────┤
│  [ETH Logo] ETH                 │
│  on Ethereum                    │
│                                 │
│  Amount: 1.5 ETH                │
│  ≈ $4,521.00                    │
│                                 │
│  Balance: 2.3 ETH               │
└────────────────○────────────────┘
                 │ (output handle)
```

### Bridge Node
```
                 │ (input handle)
┌────────────────○────────────────┐
│  BRIDGE via Stargate            │
├─────────────────────────────────┤
│  [ETH] ──────────────> [Base]   │
│  Ethereum        Base           │
│                                 │
│  Est. time: ~2 min              │
│  Fee: $1.20                     │
│                                 │
│  ● Ready                        │
└────────────────○────────────────┘
                 │ (output handle)
```

### Swap Node
```
                 │ (input handle)
┌────────────────○────────────────┐
│  SWAP via Uniswap               │
├─────────────────────────────────┤
│  1.5 ETH → 4,500 USDC           │
│                                 │
│  Rate: 1 ETH = 3,000 USDC       │
│  Impact: 0.12%                  │
│  Slippage: 0.5%                 │
│                                 │
│  ● Ready                        │
└────────────────○────────────────┘
                 │ (output handle)
```

### Deposit Node
```
                 │ (input handle)
┌────────────────○────────────────┐
│  DEPOSIT to Moonwell            │
├─────────────────────────────────┤
│  [USDC] 4,500 USDC              │
│                                 │
│  APY: 9.1%                      │
│  Receive: mUSDC                 │
│                                 │
│  ● Ready                        │
└────────────────○────────────────┘
                 │ (output handle)
```

---

## Mock Data & API Structure

### Chat Messages
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  flowGenerated?: boolean; // If this message generated a flow
}
```

### Flow State
```typescript
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  executionStatus: 'idle' | 'executing' | 'complete' | 'error';
  currentStepId: string | null;
}
```

### LI.FI Route (simplified)
```typescript
interface Route {
  id: string;
  steps: Step[];
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  gasCostUSD: string;
  executionDuration: number;
}
```

---

## Suggested Chat Prompts

Display as clickable chips:
- "Bridge 1 ETH from Ethereum to Base"
- "Swap ETH to USDC on Arbitrum"
- "Find best yield for 1000 USDC"
- "Bridge and deposit to Moonwell"

---

## Responsive Behavior

### Desktop (≥1024px)
- Three-panel layout
- All panels visible
- Flow canvas is primary focus

### Tablet (768px - 1023px)
- Chat + Flow visible
- Details panel in sheet/drawer
- Collapsible chat

### Mobile (<768px)
- Tab-based navigation
- Chat OR Flow visible at once
- Bottom sheet for details

---

## Dependencies to Install

```json
{
  "@xyflow/react": "^12.0.0"
}
```

---

## Execution Order

1. **Step 1**: Create `/trade` page with three-panel layout
2. **Step 2**: Build chat panel with mock messages
3. **Step 3**: Set up ReactFlow with dark theme
4. **Step 4**: Create custom node components
5. **Step 5**: Implement intent parser (mock)
6. **Step 6**: Connect chat to flow generation
7. **Step 7**: Add execution visualization
8. **Step 8**: Build details/config panel
9. **Step 9**: Polish animations and transitions

---

## Success Criteria

- [ ] User can type natural language intent
- [ ] Flow is visualized as connected nodes
- [ ] Nodes show relevant DeFi operation details
- [ ] Execution progress is animated step-by-step
- [ ] Dark theme matches existing design system
- [ ] Responsive on all screen sizes
