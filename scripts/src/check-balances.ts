import 'dotenv/config';
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base, arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const erc20Abi = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }] as const;

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log('Address:', account.address);

  const baseClient = createPublicClient({ chain: base, transport: http() });
  const arbClient = createPublicClient({ chain: arbitrum, transport: http() });

  const [baseETH, arbETH, baseUSDC, arbUSDC, baseWETH, arbWETH] = await Promise.all([
    baseClient.getBalance({ address: account.address }),
    arbClient.getBalance({ address: account.address }),
    baseClient.readContract({ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }),
    arbClient.readContract({ address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }),
    baseClient.readContract({ address: '0x4200000000000000000000000000000000000006', abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }),
    arbClient.readContract({ address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }),
  ]);

  console.log('\n=== Wallet Balances ===');
  console.log('Base ETH:', formatEther(baseETH));
  console.log('Base USDC:', formatUnits(baseUSDC, 6));
  console.log('Base WETH:', formatEther(baseWETH));
  console.log('Arb ETH:', formatEther(arbETH));
  console.log('Arb USDC:', formatUnits(arbUSDC, 6));
  console.log('Arb WETH:', formatEther(arbWETH));
}

main().catch(console.error);
