"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana"
import { useCreateWallet } from "@privy-io/react-auth/extended-chains"
import { useSetActiveWallet } from "@privy-io/wagmi"
import { Copy, Check, LogOut, Wallet, ChevronDown, Bot } from "lucide-react"
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

const CHAIN_LABELS: Record<string, string> = {
  ethereum: "EVM",
  solana: "Solana",
  sui: "SUI",
  "bitcoin-segwit": "BTC",
}

interface WalletEntry {
  address: string
  chain: string
  isEmbedded: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any
}

export function WalletDropdown() {
  const { logout, user } = usePrivy()
  const { wallets: evmWallets } = useWallets()
  const { wallets: solanaWallets } = useSolanaWallets()
  const { createWallet } = useCreateWallet()
  const { setActiveWallet } = useSetActiveWallet()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const creatingRef = useRef(false)

  // Auto-create SUI and Bitcoin wallets on first login
  useEffect(() => {
    if (!user || creatingRef.current) return

    const linkedWallets = (user.linkedAccounts ?? []).filter(
      (a) => a.type === "wallet"
    )
    const chainTypes = new Set(
      linkedWallets.map((w) => ("chainType" in w ? w.chainType : undefined))
    )

    const missing: Array<"sui" | "bitcoin-segwit"> = []
    if (!chainTypes.has("sui")) missing.push("sui")
    if (!chainTypes.has("bitcoin-segwit")) missing.push("bitcoin-segwit")

    if (missing.length === 0) return

    creatingRef.current = true
    Promise.allSettled(
      missing.map((chainType) => createWallet({ chainType }))
    ).finally(() => {
      creatingRef.current = false
    })
  }, [user, createWallet])

  // Build unified wallet list from all sources
  const embeddedWallets: WalletEntry[] = []
  const externalWallets: WalletEntry[] = []

  // EVM wallets from useWallets
  for (const w of evmWallets) {
    const entry: WalletEntry = {
      address: w.address,
      chain: "EVM",
      isEmbedded: w.walletClientType === "privy",
      raw: w,
    }
    if (entry.isEmbedded) embeddedWallets.push(entry)
    else externalWallets.push(entry)
  }

  // Solana wallets from useSolanaWallets
  for (const w of solanaWallets) {
    const name = w.standardWallet?.name ?? ""
    const isEmbedded = name.toLowerCase().includes("privy")
    const entry: WalletEntry = {
      address: w.address,
      chain: "Solana",
      isEmbedded,
      raw: w,
    }
    if (isEmbedded) embeddedWallets.push(entry)
    else externalWallets.push(entry)
  }

  // Extended-chain wallets (SUI, BTC) from user.linkedAccounts
  const extendedChainTypes = new Set(["sui", "bitcoin-segwit"])
  const linkedWallets = (user?.linkedAccounts ?? []).filter(
    (a) => a.type === "wallet" && "chainType" in a && extendedChainTypes.has(a.chainType)
  )
  for (const w of linkedWallets) {
    if (!("chainType" in w)) continue
    embeddedWallets.push({
      address: w.address,
      chain: CHAIN_LABELS[w.chainType] ?? w.chainType,
      isEmbedded: true,
    })
  }

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const displayAddress = embeddedWallets[0]
    ? truncateAddress(embeddedWallets[0].address)
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
                    onClick={() =>
                      wallet.chain === "EVM" && wallet.raw && setActiveWallet(wallet.raw)
                    }
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
                <DropdownMenuItem asChild className="focus:bg-transparent focus:text-inherit">
                  <Link href="/my-agents">
                    <Bot className="h-4 w-4 mr-2" />
                    My Agents
                  </Link>
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
                    onClick={() =>
                      wallet.chain === "EVM" && wallet.raw && setActiveWallet(wallet.raw)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {truncateAddress(wallet.address)}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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
