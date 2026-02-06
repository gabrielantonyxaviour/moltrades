# LI.FI Composer Protocol x Chain Capability Matrix

## Overview

This document tracks the verified capabilities of LI.FI Composer for executing DeFi protocol actions across supported EVM chains.

**Last Updated:** 2024-02-06

## Quick Reference Matrix

| Protocol | ETH | ARB | BASE | OP | POLY | BSC | AVAX | SCROLL | LINEA | GNO |
|----------|-----|-----|------|-----|------|-----|------|--------|-------|-----|
| **Aave V3 WETH** | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ✅ | ✅ | ❌ | ✅ |
| **Aave V3 USDC** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Compound V3 USDC** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Compound V3 WETH** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Morpho USDC** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Morpho WETH** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Lido wstETH** | ✅ | ? | ? | ? | ? | ❌ | ❌ | ? | ? | ? |
| **EtherFi weETH** | ✅ | ? | ? | ? | ❌ | ❌ | ❌ | ? | ? | ❌ |
| **Ethena sUSDe** | ✅ | ✅ | ✅ | ? | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Seamless** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Moonwell** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WETH Wrap** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### Legend
- ✅ = Verified working (executed on mainnet)
- ? = Available but not yet tested
- ⚠️ = Quote works, execution has known issues
- ❌ = Not available on this chain

---

## Detailed Protocol Information

### Aave V3

**Type:** Lending Protocol
**Function:** `supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)`
**Deposit Only:** No (withdraw supported)

| Chain | Pool Address | Assets | Status |
|-------|-------------|--------|--------|
| Ethereum | `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2` | WETH, USDC, USDT, DAI | ✅ Verified |
| Arbitrum | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | WETH, USDC, USDT, DAI | ✅ Verified |
| Base | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` | WETH, USDC, USDbC | ✅ Verified |
| Optimism | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | WETH, USDC, USDT, DAI | ✅ Verified |
| Polygon | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | WETH, USDC, USDT, DAI | ✅ Verified |
| BSC | `0x6807dc923806fE8Fd134338EABCA509979a7e0cB` | BNB, USDC, USDT | ? Available |
| Avalanche | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | AVAX, WETH.e, USDC | ✅ Verified |
| Scroll | `0x11fCfe756c05AD438e312a7fd934381537D3cFfe` | WETH, USDC, wstETH | ✅ Verified |
| Gnosis | `0xb50201558B00496A145fE76f7424749556E326D8` | WXDAI, WETH, USDC | ✅ Verified |

---

### Compound V3

**Type:** Lending Protocol
**Function:** `supply(address asset, uint256 amount)`
**Deposit Only:** No (withdraw supported)

| Chain | Market | Address | Status |
|-------|--------|---------|--------|
| Ethereum | cUSDCv3 | `0xc3d688B66703497DAA19211EEdff47f25384cdc3` | ✅ Verified |
| Ethereum | cWETHv3 | `0xA17581A9E3356d9A858b789D68B4d866e593aE94` | ✅ Verified |
| Arbitrum | cUSDCv3 | `0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf` | ✅ Verified |
| Arbitrum | cWETHv3 | `0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486` | ✅ Verified |
| Base | cUSDCv3 | `0xb125E6687d4313864e53df431d5425969c15Eb2F` | ✅ Verified |
| Base | cWETHv3 | `0x46e6b214b524310239732D51387075E0e70970bf` | ✅ Verified |
| Optimism | cUSDCv3 | `0x2e44e174f7D53F0212823acC11C01A11d58c5bCB` | ✅ Verified |
| Optimism | cWETHv3 | `0xE36A30D249f7761327fd973001A32010b521b6Fd` | ✅ Verified |
| Polygon | cUSDCv3 | `0xF25212E676D1F7F89Cd72fFEe66158f541246445` | ✅ Verified |
| Scroll | cUSDCv3 | `0xB2f97c1Bd3bf02f5e74d13f9c178bc6e8eE17Dd6` | ✅ Verified |

---

### Morpho V2 (MetaMorpho Vaults)

**Type:** Yield Vault (ERC4626)
**Function:** `deposit(uint256 assets, address receiver)`
**Deposit Only:** No (withdraw supported)

| Chain | Vault | Address | Asset | Status |
|-------|-------|---------|-------|--------|
| Ethereum | Steakhouse USDC | `0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB` | USDC | ✅ Verified |
| Ethereum | RE7 WETH | `0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0` | WETH | ✅ Verified |
| Base | Moonwell Flagship USDC | `0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A` | USDC | ✅ Verified |
| Base | Moonwell Flagship ETH | `0x9ea49B9a8F82D8E38C4E5eD7339C0c79b4639A92` | WETH | ✅ Verified |

---

### Lido wstETH

**Type:** Liquid Staking
**Function:** `wrap(uint256 _stETHAmount)` (Ethereum only)
**Note:** On L2s, wstETH is bridged - use LI.FI swap routing instead

| Chain | wstETH Address | Status |
|-------|---------------|--------|
| Ethereum | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` | ✅ Verified |
| Arbitrum | `0x5979D7b546E38E9Ab8b54bdeFC1E7d8E7cEe4fd5` | ? Bridged |
| Base | `0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452` | ? Bridged |
| Optimism | `0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb` | ? Bridged |
| Polygon | `0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD` | ? Bridged |

---

### EtherFi weETH

**Type:** Liquid Staking (ERC4626)
**Function:** `deposit(uint256 assets, address receiver)`

| Chain | weETH Address | Status |
|-------|--------------|--------|
| Ethereum | `0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee` | ✅ Verified |
| Arbitrum | `0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe` | ? Available |
| Base | `0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A` | ? Available |
| Optimism | `0x5A7fACB970D094B6C7FF1df0eA68D99E6e73CBFF` | ? Available |

---

### Ethena sUSDe

**Type:** Staking Vault (ERC4626)
**Function:** `deposit(uint256 assets, address receiver)`
**Deposit Only:** Yes (cooldown period for withdrawal)

| Chain | sUSDe Address | Status |
|-------|--------------|--------|
| Ethereum | `0x9D39A5DE30e57443BfF2A8307A4256c8797A3497` | ✅ Verified |
| Arbitrum | `0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2` | ✅ Verified |
| Base | `0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2` | ✅ Verified |

---

### Seamless (Base Only)

**Type:** Lending (Aave V3 Fork)
**Function:** `supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)`

| Asset | Pool Address | Status |
|-------|-------------|--------|
| WETH | `0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7` | ✅ Verified |
| USDC | `0x8F44Fd754285aa6A2b8B9B97739B79746e0475a7` | ✅ Verified |

---

### Moonwell

**Type:** Lending (Compound-style)
**Function:** `mint(uint256 mintAmount)`

| Chain | Asset | mToken Address | Status |
|-------|-------|---------------|--------|
| Base | WETH | `0x628ff693426583D9a7FB391E54366292F509D457` | ✅ Verified |
| Base | USDC | `0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22` | ✅ Verified |
| Optimism | WETH | `0xb4104C02BBf4E9be85AAa41F4A2D7E16B9F7cD60` | ✅ Verified |
| Optimism | USDC | `0x8E08617b0d66359D73Aa55E9D5B5d0d3C4700E5E` | ✅ Verified |

---

## Known Issues

### Base USDC Routing

**Status:** Under investigation with LI.FI team

When using LI.FI Composer to route native ETH → USDC for deposit into lending protocols on Base, some routes may encounter issues. Workaround: Use direct USDC deposits if user already has USDC.

---

## Testing Commands

```bash
# Test all quotes (no gas cost)
npm run test:all-quotes

# Test quotes for specific chain
npm run test:all-quotes -- --chain=base

# Test quotes for specific protocol
npm run test:all-quotes -- --protocol=aave-v3

# Execute matrix test (dry run)
npm run test:matrix -- --dry-run

# Execute matrix test (real transactions)
npm run test:matrix -- --execute --chain=base
```

---

## Contributing

To add a new protocol or chain:

1. Add contract addresses to `scripts/src/data/protocol-addresses.ts`
2. Add deployment config to `scripts/src/lib/protocols.ts`
3. Run quote tests: `npm run test:all-quotes -- --protocol=<new-protocol>`
4. Update this matrix with results

---

## Resources

- [LI.FI Composer Documentation](https://docs.li.fi/li.fi-api/li.fi-api/contract-calls-api)
- [Aave V3 Docs](https://docs.aave.com/developers/getting-started/readme)
- [Compound V3 Docs](https://docs.compound.finance/)
- [Morpho Docs](https://docs.morpho.org/)
- [Lido Docs](https://docs.lido.fi/)
