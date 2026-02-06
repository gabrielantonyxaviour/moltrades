"use client"

import { useState } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useSetActiveWallet } from "@privy-io/wagmi"
import { Copy, Check, LogOut, Wallet, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FundWalletDialog } from "@/components/wallet/fund-wallet-dialog"

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletDropdown() {
  const { logout } = usePrivy()
  const { wallets } = useWallets()
  const { setActiveWallet } = useSetActiveWallet()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy")
  const externalWallets = wallets.filter((w) => w.walletClientType !== "privy")

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const displayAddress = embeddedWallet
    ? truncateAddress(embeddedWallet.address)
    : wallets[0]
      ? truncateAddress(wallets[0].address)
      : "Wallet"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 font-heading text-sm tracking-wide"
          >
            <Wallet className="h-4 w-4" />
            {displayAddress}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          {/* Moltrades Wallet (Embedded) */}
          {embeddedWallet && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Moltrades Wallet
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="flex items-center justify-between"
                  onClick={() => setActiveWallet(embeddedWallet)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {truncateAddress(embeddedWallet.address)}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Embedded
                    </Badge>
                  </div>
                  <button
                    className="ml-2 rounded p-1 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyAddress(embeddedWallet.address)
                    }}
                  >
                    {copiedAddress === embeddedWallet.address ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFundDialogOpen(true)}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Fund Wallet
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {/* External Wallets */}
          {externalWallets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                External Wallets
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {externalWallets.map((wallet) => (
                  <DropdownMenuItem
                    key={wallet.address}
                    className="flex items-center justify-between"
                    onClick={() => setActiveWallet(wallet)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {truncateAddress(wallet.address)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {wallet.walletClientType}
                      </Badge>
                    </div>
                    <button
                      className="ml-2 rounded p-1 hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyAddress(wallet.address)
                      }}
                    >
                      {copiedAddress === wallet.address ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          {/* Disconnect */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FundWalletDialog
        open={fundDialogOpen}
        onOpenChange={setFundDialogOpen}
      />
    </>
  )
}
