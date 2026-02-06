"use client"

import { useState } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana"
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

interface WalletEntry {
  address: string
  label: string
  chain: "EVM" | "Solana"
  isEmbedded: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any
}

export function WalletDropdown() {
  const { logout } = usePrivy()
  const { wallets: evmWallets } = useWallets()
  const { wallets: solanaWallets } = useSolanaWallets()
  const { setActiveWallet } = useSetActiveWallet()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)

  // Build unified wallet list
  const allWallets: WalletEntry[] = [
    ...evmWallets.map((w) => ({
      address: w.address,
      label: w.walletClientType === "privy" ? "EVM" : w.walletClientType,
      chain: "EVM" as const,
      isEmbedded: w.walletClientType === "privy",
      raw: w,
    })),
    ...solanaWallets.map((w) => {
      const name = w.standardWallet?.name ?? ""
      const isEmbedded = name.toLowerCase().includes("privy")
      return {
        address: w.address,
        label: isEmbedded ? "Solana" : name || "Solana",
        chain: "Solana" as const,
        isEmbedded,
        raw: w,
      }
    }),
  ]

  const embeddedWallets = allWallets.filter((w) => w.isEmbedded)
  const externalWallets = allWallets.filter((w) => !w.isEmbedded)

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const displayAddress = embeddedWallets[0]
    ? truncateAddress(embeddedWallets[0].address)
    : allWallets[0]
      ? truncateAddress(allWallets[0].address)
      : "Wallet"

  const itemClass = "flex items-center justify-between focus:bg-transparent focus:text-inherit"

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
          {/* Moltrades Wallets (all embedded) */}
          {embeddedWallets.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Moltrades Wallets
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {embeddedWallets.map((wallet) => (
                  <DropdownMenuItem
                    key={wallet.address}
                    className={itemClass}
                    onClick={() => wallet.chain === "EVM" && setActiveWallet(wallet.raw)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {truncateAddress(wallet.address)}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {wallet.chain}
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
                <DropdownMenuItem
                  className="focus:bg-transparent focus:text-inherit"
                  onClick={() => setFundDialogOpen(true)}
                >
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
                    className={itemClass}
                    onClick={() => wallet.chain === "EVM" && setActiveWallet(wallet.raw)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {truncateAddress(wallet.address)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {wallet.label}
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
            className="focus:bg-transparent"
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
