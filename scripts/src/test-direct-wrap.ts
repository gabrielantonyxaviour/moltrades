/**
 * Direct WETH wrap (no Composer) to fund wallet for protocol tests.
 * Also wraps on Arb if --arb flag passed.
 */

import 'dotenv/config';
import { encodeFunctionData, parseAbi, formatEther } from 'viem';
import { initializeLifiSDK, getWalletClient, getPublicClient, CHAIN_IDS } from './lib/config';

const WETH_ABI = parseAbi(['function deposit() payable']);
const WETH = {
  [CHAIN_IDS.BASE]: '0x4200000000000000000000000000000000000006' as const,
  [CHAIN_IDS.ARBITRUM]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
};

async function wrapETH(chainId: number, amount: bigint) {
  const chainName = chainId === CHAIN_IDS.BASE ? 'Base' : 'Arbitrum';
  console.log(`\nWrapping ${formatEther(amount)} ETH on ${chainName}...`);

  const walletClient = getWalletClient(chainId);
  const publicClient = getPublicClient(chainId);

  const callData = encodeFunctionData({ abi: WETH_ABI, functionName: 'deposit' });

  const txHash = await walletClient.sendTransaction({
    account: walletClient.account!,
    chain: walletClient.chain!,
    to: WETH[chainId as keyof typeof WETH],
    data: callData,
    value: amount,
  });

  console.log(`TX: ${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Status: ${receipt.status}, Gas: ${receipt.gasUsed}`);
  return txHash;
}

async function main() {
  const { address } = initializeLifiSDK();
  const doArb = process.argv.includes('--arb');
  const amount = BigInt('200000000000000'); // 0.0002 ETH

  // Wrap on Base
  const baseTx = await wrapETH(CHAIN_IDS.BASE, amount);
  console.log(`Base wrap: https://basescan.org/tx/${baseTx}`);

  if (doArb) {
    const arbTx = await wrapETH(CHAIN_IDS.ARBITRUM, amount);
    console.log(`Arb wrap: https://arbiscan.io/tx/${arbTx}`);
  }
}

main().catch(console.error);
