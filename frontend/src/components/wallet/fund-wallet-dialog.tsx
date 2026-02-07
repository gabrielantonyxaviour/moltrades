"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana"
import { Copy, Check, ExternalLink, Search, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { parseEther } from "viem"
import { toast } from "sonner"

interface FundWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChainOption {
  id: string
  name: string
  icon: string
  category: "EVM" | "Non-EVM"
  nativeCurrency: string
  addressType: "ethereum" | "solana" | "sui" | "bitcoin"
}

const ALL_CHAINS: ChainOption[] = [
  // EVM Chains - Uniswap V4 supported
  { id: "ethereum", name: "Ethereum", icon: "/chains/ethereum.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "unichain", name: "Unichain", icon: "/chains/unichain.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "arbitrum", name: "Arbitrum", icon: "/chains/arbitrum.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "base", name: "Base", icon: "/chains/base.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "optimism", name: "Optimism", icon: "/chains/optimism.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "polygon", name: "Polygon", icon: "/chains/polygon.png", category: "EVM", nativeCurrency: "MATIC", addressType: "ethereum" },
  { id: "bsc", name: "BSC", icon: "/chains/bsc.png", category: "EVM", nativeCurrency: "BNB", addressType: "ethereum" },
  { id: "avalanche", name: "Avalanche", icon: "/chains/avalanche.png", category: "EVM", nativeCurrency: "AVAX", addressType: "ethereum" },
  { id: "blast", name: "Blast", icon: "/chains/blast.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "zora", name: "Zora", icon: "/chains/zora.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "worldchain", name: "World Chain", icon: "/chains/worldchain.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "ink", name: "Ink", icon: "/chains/ink.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "celo", name: "Celo", icon: "/chains/celo.png", category: "EVM", nativeCurrency: "CELO", addressType: "ethereum" },
  // EVM Chains - Other
  { id: "gnosis", name: "Gnosis", icon: "/chains/gnosis.png", category: "EVM", nativeCurrency: "xDAI", addressType: "ethereum" },
  { id: "scroll", name: "Scroll", icon: "/chains/scroll.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  { id: "linea", name: "Linea", icon: "/chains/linea.png", category: "EVM", nativeCurrency: "ETH", addressType: "ethereum" },
  // Non-EVM Chains
  { id: "solana", name: "Solana", icon: "/chains/solana.png", category: "Non-EVM", nativeCurrency: "SOL", addressType: "solana" },
  { id: "sui", name: "SUI", icon: "/chains/sui.png", category: "Non-EVM", nativeCurrency: "SUI", addressType: "sui" },
  { id: "bitcoin", name: "Bitcoin", icon: "/chains/bitcoin.png", category: "Non-EVM", nativeCurrency: "BTC", addressType: "bitcoin" },
]

export function FundWalletDialog({ open, onOpenChange }: FundWalletDialogProps) {
  const { user, fundWallet } = usePrivy()
  const { wallets: evmWallets } = useWallets()
  const { wallets: solanaWallets } = useSolanaWallets()

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChain, setSelectedChain] = useState<ChainOption | null>(null)
  const [copied, setCopied] = useState(false)

  // Withdraw form state
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Get wallet addresses based on chain type
  const getWalletAddress = (addressType: ChainOption["addressType"]): string | null => {
    switch (addressType) {
      case "ethereum": {
        const evmEmbedded = evmWallets.find((w) => w.walletClientType === "privy")
        return evmEmbedded?.address || null
      }
      case "solana": {
        const solanaEmbedded = solanaWallets.find((w) => {
          const name = w.standardWallet?.name ?? ""
          return name.toLowerCase().includes("privy")
        })
        return solanaEmbedded?.address || null
      }
      case "sui": {
        const suiWallet = (user?.linkedAccounts ?? []).find(
          (a) => a.type === "wallet" && "chainType" in a && a.chainType === "sui"
        )
        return suiWallet?.address || null
      }
      case "bitcoin": {
        const btcWallet = (user?.linkedAccounts ?? []).find(
          (a) => a.type === "wallet" && "chainType" in a && a.chainType === "bitcoin-segwit"
        )
        return btcWallet?.address || null
      }
      default:
        return null
    }
  }

  // Filter chains by search query
  const filteredChains = useMemo(() => {
    if (!searchQuery) return ALL_CHAINS
    const query = searchQuery.toLowerCase()
    return ALL_CHAINS.filter(
      (chain) =>
        chain.name.toLowerCase().includes(query) ||
        chain.category.toLowerCase().includes(query) ||
        chain.nativeCurrency.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Address copied to clipboard!")
  }

  const handleFundWithPrivy = async () => {
    if (!selectedChain || selectedChain.addressType !== "ethereum") return
    const address = getWalletAddress("ethereum")
    if (!address) return
    await fundWallet({ address })
  }

  const handleWithdraw = async () => {
    if (!selectedChain || !withdrawAddress || !withdrawAmount) return

    const walletAddress = getWalletAddress(selectedChain.addressType)
    if (!walletAddress) {
      toast.error("Wallet not found for this chain")
      return
    }

    setIsSending(true)
    try {
      if (selectedChain.addressType === "ethereum") {
        // EVM withdrawal
        const evmWallet = evmWallets.find((w) => w.walletClientType === "privy")
        if (!evmWallet) throw new Error("EVM wallet not found")

        const provider = await evmWallet.getEthereumProvider()
        await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: evmWallet.address,
              to: withdrawAddress,
              value: `0x${parseEther(withdrawAmount).toString(16)}`,
            },
          ],
        })
        toast.success("Transaction sent successfully!")
      } else if (selectedChain.addressType === "solana") {
        // Solana withdrawal using @solana/kit + Privy Standard Wallet
        const solanaWallet = solanaWallets.find((w) => {
          const name = w.standardWallet?.name ?? ""
          return name.toLowerCase().includes("privy")
        })
        if (!solanaWallet?.standardWallet) throw new Error("Solana wallet not found")

        const solKit = await import("@solana/kit")
        const { getTransferSolInstruction } = await import("@solana-program/system")

        const rpc = solKit.createSolanaRpc("https://api.mainnet-beta.solana.com")
        const sender = solKit.address(solanaWallet.address)
        const recipient = solKit.address(withdrawAddress)
        const amountLamports = solKit.lamports(
          BigInt(Math.floor(parseFloat(withdrawAmount) * 1_000_000_000))
        )

        const transferIx = getTransferSolInstruction({
          source: sender,
          destination: recipient,
          amount: amountLamports,
        })

        const { value: blockhash } = await rpc.getLatestBlockhash().send()

        const message = solKit.pipe(
          solKit.createTransactionMessage({ version: 0 }),
          (m: Parameters<typeof solKit.setTransactionMessageFeePayer>[1]) =>
            solKit.setTransactionMessageFeePayer(sender, m),
          (m: Parameters<typeof solKit.setTransactionMessageLifetimeUsingBlockhash>[1]) =>
            solKit.setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
          (m: Parameters<typeof solKit.appendTransactionMessageInstruction>[1]) =>
            solKit.appendTransactionMessageInstruction(transferIx, m),
        )

        const compiledTx = solKit.compileTransaction(message)
        const txEncoder = solKit.getTransactionEncoder()
        const txBytes = txEncoder.encode(compiledTx)

        // Use Standard Wallet signAndSendTransaction
        const signAndSendFeature = solanaWallet.standardWallet.features["solana:signAndSendTransaction"]
        if (!signAndSendFeature) throw new Error("Wallet does not support signAndSendTransaction")

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (signAndSendFeature as any).signAndSendTransaction({
          transaction: txBytes,
          account: solanaWallet.standardWallet.accounts[0],
          chain: "solana:mainnet",
        })

        toast.success("Solana transaction sent!")
      } else {
        toast.error(`${selectedChain.name} withdrawals not yet supported. Deposit only.`)
      }

      setWithdrawAddress("")
      setWithdrawAmount("")
      setSelectedChain(null)
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast.error("Transaction failed or was rejected")
    } finally {
      setIsSending(false)
    }
  }

  const handleBack = () => {
    setSelectedChain(null)
    setWithdrawAddress("")
    setWithdrawAmount("")
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setSelectedChain(null)
      setSearchQuery("")
      setWithdrawAddress("")
      setWithdrawAmount("")
      setActiveTab("deposit")
    }
    onOpenChange(open)
  }

  const currentAddress = selectedChain ? getWalletAddress(selectedChain.addressType) : null

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider">
            {selectedChain ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Image
                  src={selectedChain.icon}
                  alt={selectedChain.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
                <span>{selectedChain.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedChain.category}
                </Badge>
              </div>
            ) : (
              "Deposit / Withdraw"
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1 font-heading">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1 font-heading">
              Withdraw
            </TabsTrigger>
          </TabsList>

          {/* Chain Selection View */}
          {!selectedChain && (
            <>
              <div className="mt-6 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chains..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 pb-4 max-h-[400px] overflow-y-auto">
                {filteredChains.map((chain) => {
                  const hasWallet = getWalletAddress(chain.addressType) !== null
                  return (
                    <Card
                      key={chain.id}
                      className={`cursor-pointer hover:border-primary transition-all ${
                        !hasWallet ? "opacity-50" : ""
                      }`}
                      onClick={() => {
                        if (!hasWallet) {
                          toast.error(`${chain.name} wallet not available. Please create a wallet first.`)
                          return
                        }
                        setSelectedChain(chain)
                      }}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <Image
                          src={chain.icon}
                          alt={chain.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 mx-auto rounded-full"
                        />
                        <p className="font-heading text-sm font-bold">{chain.name}</p>
                        {!hasWallet && (
                          <Badge variant="outline" className="text-[9px] px-1">
                            No Wallet
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {filteredChains.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No chains found matching "{searchQuery}"</p>
                </div>
              )}
            </>
          )}

          {/* Deposit View */}
          {selectedChain && currentAddress && (
            <TabsContent value="deposit" className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-4">
                  <QRCodeSVG value={currentAddress} size={200} />
                </div>

                <div className="w-full space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {selectedChain.name} Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs font-mono">
                      {currentAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyAddress(currentAddress)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {selectedChain.addressType === "ethereum" && (
                  <Button
                    className="w-full gap-2 font-heading"
                    onClick={handleFundWithPrivy}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Fund with External Wallet or Card
                  </Button>
                )}

                <div className="w-full p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    Send only <span className="font-bold">{selectedChain.nativeCurrency}</span> and tokens on{" "}
                    <span className="font-bold">{selectedChain.name}</span> to this address. Sending other assets may
                    result in permanent loss.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Withdraw View */}
          {selectedChain && currentAddress && (
            <TabsContent value="withdraw" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-address" className="font-heading text-sm">
                  Destination Address
                </Label>
                <Input
                  id="withdraw-address"
                  placeholder={
                    selectedChain.addressType === "ethereum"
                      ? "0x..."
                      : selectedChain.addressType === "solana"
                      ? "Solana address..."
                      : selectedChain.addressType === "sui"
                      ? "SUI address..."
                      : "Bitcoin address..."
                  }
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-amount" className="font-heading text-sm">
                  Amount ({selectedChain.nativeCurrency})
                </Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs font-bold">⚠️ Warning</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Double-check the destination address and network. Transactions cannot be reversed.
                </p>
              </div>

              <Button
                className="w-full font-heading"
                disabled={!withdrawAddress || !withdrawAmount || isSending}
                onClick={handleWithdraw}
              >
                {isSending ? "Sending..." : `Send ${selectedChain.nativeCurrency}`}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
