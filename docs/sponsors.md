# Moltrades — Sponsor Integrations

## LI.FI

### Why we're applicable

Moltrades uses LI.FI Composer as the core execution engine for multi-step cross-chain DeFi operations. The MCP server exposes 5 LI.FI tools to AI agents, enabling them to discover protocols, get multi-step quotes via getContractCallsQuote, execute cross-chain trades, and poll bridge status — all programmatically from natural language prompts. The integration supports 11 EVM chains plus SUI-to-EVM bridging, encodes calldata for 13 DeFi protocol deployments (Aave V3, Compound V3, Morpho, Moonwell, Ethena, Lido, EtherFi, and more), and uses a custom execution flow that bypasses executeRoute() for production-grade UX control.

### Code references

- LI.FI SDK initialization (scripts): [scripts/src/lib/config.ts#L8](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/config.ts#L8) and [scripts/src/lib/config.ts#L47-L61](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/config.ts#L47-L61)
- LI.FI SDK initialization (frontend): [frontend/src/lib/lifi/sdk.ts#L7](https://github.com/gabrielantonyxaviour/moltrades/blob/main/frontend/src/lib/lifi/sdk.ts#L7) and [frontend/src/lib/lifi/sdk.ts#L51-L64](https://github.com/gabrielantonyxaviour/moltrades/blob/main/frontend/src/lib/lifi/sdk.ts#L51-L64)
- Composer quote API (getContractCallsQuote): [scripts/src/lib/quote.ts#L8](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/quote.ts#L8) and [scripts/src/lib/quote.ts#L139](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/quote.ts#L139)
- Custom execution bypass (raw transactionRequest): [scripts/src/lib/execute.ts#L108-L116](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/execute.ts#L108-L116)
- Bridge status polling: [scripts/src/lib/execute.ts#L9](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/execute.ts#L9) and [scripts/src/lib/execute.ts#L192](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/execute.ts#L192)
- Protocol action encoding for 13 DeFi protocols: [scripts/src/lib/protocols.ts#L413](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/protocols.ts#L413)
- Contract call conversion: [scripts/src/lib/actions.ts#L215](https://github.com/gabrielantonyxaviour/moltrades/blob/main/scripts/src/lib/actions.ts#L215)
- SUI-to-EVM bridge integration: [mcp-server/src/lib/bridge.ts#L14-L25](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/bridge.ts#L14-L25) and [mcp-server/src/lib/bridge.ts#L162-L221](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/bridge.ts#L162-L221)
- Chain constants (11 EVM + Solana + SUI): [frontend/src/lib/lifi/sdk.ts#L14-L26](https://github.com/gabrielantonyxaviour/moltrades/blob/main/frontend/src/lib/lifi/sdk.ts#L14-L26)

### Additional feedback

The LI.FI Composer integration is deep — we don't just call getQuote, we use getContractCallsQuote to compose multi-step operations (bridge + swap + protocol deposit) with custom-encoded calldata for 13 DeFi deployments across Base, Arbitrum, and Unichain. The execution bypass pattern (extracting raw transactionRequest instead of using executeRoute) gives us production-grade UX with real-time status streaming and custom gas handling.

---

## Uniswap V4

### Why we're applicable

Moltrades integrates Uniswap V4 on Unichain mainnet (chain 130) as a first-class execution engine alongside LI.FI. AI agents can programmatically discover V4 pools, get quotes with automatic fee tier fallback (100/500/3000/10000 bps), and execute swaps through the Universal Router — all via MCP tools exposed to any LLM client. The integration is agentic by design: agents autonomously decide when to use V4 vs LI.FI based on the trade context.

### Code references

- Unichain mainnet contract addresses (PoolManager, Quoter, UniversalRouter, Permit2): [mcp-server/src/lib/protocols.ts#L22-L38](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/protocols.ts#L22-L38)
- Quoter ABI + quoteExactInputSingle: [mcp-server/src/lib/uniswap-v4.ts#L12-L46](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/uniswap-v4.ts#L12-L46)
- Quote logic with fee tier fallback: [mcp-server/src/lib/uniswap-v4.ts#L136-L262](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/uniswap-v4.ts#L136-L262)
- Universal Router swap execution (V4_SWAP command): [mcp-server/src/lib/uniswap-v4.ts#L318-L344](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/uniswap-v4.ts#L318-L344)
- Token approval flow: [mcp-server/src/lib/uniswap-v4.ts#L288-L316](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/uniswap-v4.ts#L288-L316)
- MCP tool: uniswap_v4_quote: [mcp-server/src/index.ts#L429-L496](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/index.ts#L429-L496)
- MCP tool: uniswap_v4_swap: [mcp-server/src/index.ts#L503-L590](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/index.ts#L503-L590)

### Additional feedback

The V4 integration is direct contract-level — no SDK wrapper. We manually encode Quoter calls, handle the V4 revert-with-result pattern, and build Universal Router commands. The automatic fee tier fallback (tries 500 -> 3000 -> 10000 -> 100 bps) ensures quotes succeed even when the exact pool doesn't exist.

---

## Sui

### Why we're applicable

Moltrades supports Sui as a deposit and bridging source chain, allowing users with SUI tokens to bridge into the EVM DeFi ecosystem. The MCP server includes a bridge_to_evm tool that uses LI.FI to quote SUI-to-EVM routes and executes Sui transactions using the @mysten/sui SDK with Ed25519 keypair signing.

### Code references

- Sui SDK imports (Ed25519Keypair, SuiClient, Transaction): [mcp-server/src/lib/bridge.ts#L9-L11](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/bridge.ts#L9-L11)
- SUI chain constants and token addresses: [mcp-server/src/lib/bridge.ts#L14-L25](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/bridge.ts#L14-L25)
- Sui keypair management: [mcp-server/src/lib/bridge.ts#L125-L142](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/bridge.ts#L125-L142)
- executeSuiBridge function (deserialize, sign, submit): [mcp-server/src/lib/bridge.ts#L162-L221](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/src/lib/bridge.ts#L162-L221)
- @mysten/sui dependency: [mcp-server/package.json#L13](https://github.com/gabrielantonyxaviour/moltrades/blob/main/mcp-server/package.json#L13)

### Additional feedback

Sui integration enables the platform to accept deposits from non-EVM ecosystems, bridging into the EVM DeFi world via LI.FI routes.
