"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useFundWallet, useWallets } from "@privy-io/react-auth"
import { Copy, Check, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseEther } from "viem"

interface FundWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FundWalletDialog({ open, onOpenChange }: FundWalletDialogProps) {
  const { wallets } = useWallets()
  const { fundWallet } = useFundWallet()
  const [copied, setCopied] = useState(false)
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isSending, setIsSending] = useState(false)

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy")
  const address = embeddedWallet?.address || ""

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFundWithPrivy = async () => {
    if (!embeddedWallet) return
    await fundWallet({ address: embeddedWallet.address })
  }

  const handleWithdraw = async () => {
    if (!embeddedWallet || !withdrawAddress || !withdrawAmount) return

    setIsSending(true)
    try {
      const provider = await embeddedWallet.getEthereumProvider()
      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: embeddedWallet.address,
            to: withdrawAddress,
            value: `0x${parseEther(withdrawAmount).toString(16)}`,
          },
        ],
      })
      setWithdrawAddress("")
      setWithdrawAmount("")
      onOpenChange(false)
    } catch {
      // Transaction rejected or failed — user can retry
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider">
            Fund Wallet
          </DialogTitle>
          <DialogDescription>
            Deposit or withdraw funds from your Moltrades wallet.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1">
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 pt-4">
            {address && (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-white p-3">
                  <QRCodeSVG value={address} size={180} />
                </div>

                <div className="flex w-full items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
                    {address}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleFundWithPrivy}
                >
                  <ExternalLink className="h-4 w-4" />
                  Fund with External Wallet or Card
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-address">Destination Address</Label>
              <Input
                id="withdraw-address"
                placeholder="0x..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (ETH)</Label>
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

            <Button
              className="w-full"
              disabled={!withdrawAddress || !withdrawAmount || isSending}
              onClick={handleWithdraw}
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
