"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletDropdown } from "@/components/wallet/wallet-dropdown"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Feed" },
  { href: "/core-engine", label: "Core Engine" },
  { href: "/explore", label: "Explore" },
  { href: "/create", label: "New Agent" },
]

export function Header() {
  const pathname = usePathname()
  const { login, authenticated } = usePrivy()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image
            src="/moltrades-logo.png"
            alt="Moltrades"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="font-heading text-lg font-bold tracking-wider hidden sm:inline-block">
            Moltrades
          </span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "font-heading text-sm tracking-widest hover:!bg-transparent hover:text-primary",
                    isActive && "text-primary"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Wallet */}
          {authenticated ? (
            <WalletDropdown />
          ) : (
            <Button
              className="font-heading text-sm tracking-wide shadow-glow-sm hover:shadow-glow-md transition-shadow"
              onClick={login}
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
