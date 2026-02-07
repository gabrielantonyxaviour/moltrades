"use client"

import { useState, useMemo } from "react"
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
  address: string
  type: "EVM" | "Solana" | "SUI" | "Bitcoin"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet?: any
}

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

  // Build chain options from all wallets
  const chainOptions = useMemo<ChainOption[]>(() => {
    const options: ChainOption[] = []

    // EVM wallet (Ethereum/Base/etc)
    const evmEmbedded = evmWallets.find((w) => w.walletClientType === "privy")
    if (evmEmbedded) {
      options.push({
        id: "evm",
        name: "Ethereum",
        icon: "⟠",
        address: evmEmbedded.address,
        type: "EVM",
        wallet: evmEmbedded,
      })
    }

    // Solana wallet
    const solanaEmbedded = solanaWallets.find((w) => {
      const name = w.standardWallet?.name ?? ""
      return name.toLowerCase().includes("privy")
    })
    if (solanaEmbedded) {
      options.push({
        id: "solana",
        name: "Solana",
        icon: "◎",
        address: solanaEmbedded.address,
        type: "Solana",
        wallet: solanaEmbedded,
      })
    }

    // SUI wallet
    const suiWallet = (user?.linkedAccounts ?? []).find(
      (a) => a.type === "wallet" && "chainType" in a && a.chainType === "sui"
    )
    if (suiWallet) {
      options.push({
        id: "sui",
        name: "SUI",
        icon: "🔷",
        address: suiWallet.address,
        type: "SUI",
      })
    }

    // Bitcoin wallet
    const btcWallet = (user?.linkedAccounts ?? []).find(
      (a) => a.type === "wallet" && "chainType" in a && a.chainType === "bitcoin-segwit"
    )
    if (btcWallet) {
      options.push({
        id: "bitcoin",
        name: "Bitcoin",
        icon: "₿",
        address: btcWallet.address,
        type: "Bitcoin",
      })
    }

    return options
  }, [evmWallets, solanaWallets, user])

  // Filter chains by search query
  const filteredChains = useMemo(() => {
    if (!searchQuery) return chainOptions
    const query = searchQuery.toLowerCase()
    return chainOptions.filter(
      (chain) =>
        chain.name.toLowerCase().includes(query) ||
        chain.type.toLowerCase().includes(query)
    )
  }, [chainOptions, searchQuery])

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Address copied to clipboard!")
  }

  const handleFundWithPrivy = async () => {
    if (!selectedChain?.wallet) return
    await fundWallet({ address: selectedChain.wallet.address })
  }

  const handleWithdraw = async () => {
    if (!selectedChain || !withdrawAddress || !withdrawAmount) return

    setIsSending(true)
    try {
      if (selectedChain.type === "EVM" && selectedChain.wallet) {
        // EVM withdrawal
        const provider = await selectedChain.wallet.getEthereumProvider()
        await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: selectedChain.wallet.address,
              to: withdrawAddress,
              value: `0x${parseEther(withdrawAmount).toString(16)}`,
            },
          ],
        })
        toast.success("Transaction sent successfully!")
      } else if (selectedChain.type === "Solana" && selectedChain.wallet) {
        // Solana withdrawal - simplified
        toast.error("Solana withdrawals coming soon!")
      } else {
        toast.error(`${selectedChain.type} withdrawals not yet supported`)
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

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider">
            {selectedChain ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-2xl">{selectedChain.icon}</span>
                <span>{selectedChain.name}</span>
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

              <div className="grid grid-cols-4 gap-3 pb-4">
                {filteredChains.map((chain) => (
                  <Card
                    key={chain.id}
                    className="cursor-pointer hover:border-primary transition-all"
                    onClick={() => setSelectedChain(chain)}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="text-3xl">{chain.icon}</div>
                      <p className="font-heading text-sm font-bold">{chain.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {chain.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredChains.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No chains found matching "{searchQuery}"</p>
                </div>
              )}
            </>
          )}

          {/* Deposit View */}
          {selectedChain && (
            <TabsContent value="deposit" className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-4">
                  <QRCodeSVG value={selectedChain.address} size={200} />
                </div>

                <div className="w-full space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {selectedChain.name} Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs font-mono">
                      {selectedChain.address}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyAddress(selectedChain.address)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {selectedChain.type === "EVM" && (
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
                    Send only {selectedChain.name} to this address. Sending other assets may result in permanent loss.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Withdraw View */}
          {selectedChain && (
            <TabsContent value="withdraw" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-address" className="font-heading text-sm">
                  Destination Address
                </Label>
                <Input
                  id="withdraw-address"
                  placeholder={
                    selectedChain.type === "EVM"
                      ? "0x..."
                      : selectedChain.type === "Solana"
                      ? "Solana address..."
                      : selectedChain.type === "SUI"
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
                  Amount ({selectedChain.type === "EVM" ? "ETH" : selectedChain.name})
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
                  Double-check the destination address. Transactions cannot be reversed.
                </p>
              </div>

              <Button
                className="w-full font-heading"
                disabled={!withdrawAddress || !withdrawAmount || isSending}
                onClick={handleWithdraw}
              >
                {isSending ? "Sending..." : `Send ${selectedChain.name}`}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
