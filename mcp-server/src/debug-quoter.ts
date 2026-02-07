#!/usr/bin/env npx tsx
/**
 * Debug Uniswap V4 Quoter call - try all fee tiers
 */

import { createPublicClient, http, encodeFunctionData, decodeFunctionResult, formatUnits } from 'viem';

const client = createPublicClient({
  chain: {
    id: 130,
    name: 'Unichain',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.unichain.org'] } },
  },
  transport: http('https://mainnet.unichain.org'),
});

const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'poolKey',
            type: 'tuple',
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

const FEE_TO_TICK_SPACING: Record<number, number> = {
  100: 1,     // 0.01%
  500: 10,    // 0.05%
  3000: 60,   // 0.3%
  10000: 200, // 1%
};

async function tryQuote(
  currency0: string,
  currency1: string,
  fee: number,
  zeroForOne: boolean,
  exactAmount: bigint
) {
  const tickSpacing = FEE_TO_TICK_SPACING[fee] || 60;

  const params = {
    poolKey: {
      currency0: currency0 as `0x${string}`,
      currency1: currency1 as `0x${string}`,
      fee,
      tickSpacing,
      hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    },
    zeroForOne,
    exactAmount,
    hookData: '0x' as `0x${string}`,
  };

  try {
    const calldata = encodeFunctionData({
      abi: QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [params],
    });

    const result = await client.call({
      to: '0x333e3c607b141b18ff6de9f258db6e77fe7491e0' as `0x${string}`,
      data: calldata,
    });

    if (result.data) {
      const decoded = decodeFunctionResult({
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        data: result.data,
      }) as [bigint, bigint];
      return { amountOut: decoded[0], gasEstimate: decoded[1] };
    }
  } catch (error) {
    return null;
  }
  return null;
}

async function main() {
  const WETH = '0x4200000000000000000000000000000000000006';
  const USDC = '0x078d782b760474a361dda0af3839290b0ef57ad6';
  const USDT = '0x9151434b16b9763660705744891fa906f660ecc5';
  const UNI = '0x8f187aA05619a017077f5308904739877ce9eA21';

  console.log('=== Testing WETH -> USDC (0.01 WETH) ===\n');

  // USDC < WETH, so currency0 = USDC, currency1 = WETH
  // For WETH -> USDC: we're swapping currency1 -> currency0, so zeroForOne = false

  for (const fee of [100, 500, 3000, 10000]) {
    const result = await tryQuote(USDC, WETH, fee, false, 10000000000000000n);
    if (result && result.amountOut > 0n) {
      const usdcOut = formatUnits(result.amountOut, 6);
      console.log(`Fee ${fee/100}%: ${usdcOut} USDC (gas: ${result.gasEstimate})`);
    } else {
      console.log(`Fee ${fee/100}%: No pool or no liquidity`);
    }
  }

  console.log('\n=== Testing USDC -> WETH (10 USDC) ===\n');

  // For USDC -> WETH: we're swapping currency0 -> currency1, so zeroForOne = true
  for (const fee of [100, 500, 3000, 10000]) {
    const result = await tryQuote(USDC, WETH, fee, true, 10000000n); // 10 USDC
    if (result && result.amountOut > 0n) {
      const wethOut = formatUnits(result.amountOut, 18);
      console.log(`Fee ${fee/100}%: ${wethOut} WETH (gas: ${result.gasEstimate})`);
    } else {
      console.log(`Fee ${fee/100}%: No pool or no liquidity`);
    }
  }

  console.log('\n=== Testing WETH -> UNI (0.01 WETH) ===\n');

  // UNI (0x8f...) > WETH (0x42...), so currency0 = WETH, currency1 = UNI
  // For WETH -> UNI: we're swapping currency0 -> currency1, so zeroForOne = true
  for (const fee of [100, 500, 3000, 10000]) {
    const result = await tryQuote(WETH, UNI, fee, true, 10000000000000000n);
    if (result && result.amountOut > 0n) {
      const uniOut = formatUnits(result.amountOut, 18);
      console.log(`Fee ${fee/100}%: ${uniOut} UNI (gas: ${result.gasEstimate})`);
    } else {
      console.log(`Fee ${fee/100}%: No pool or no liquidity`);
    }
  }

  console.log('\n=== Testing USDC -> USDT (100 USDC) ===\n');

  // USDC (0x078...) < USDT (0x915...), so currency0 = USDC, currency1 = USDT
  // For USDC -> USDT: zeroForOne = true
  for (const fee of [100, 500, 3000, 10000]) {
    const result = await tryQuote(USDC, USDT, fee, true, 100000000n); // 100 USDC
    if (result && result.amountOut > 0n) {
      const usdtOut = formatUnits(result.amountOut, 6);
      console.log(`Fee ${fee/100}%: ${usdtOut} USDT (gas: ${result.gasEstimate})`);
    } else {
      console.log(`Fee ${fee/100}%: No pool or no liquidity`);
    }
  }
}

main();
