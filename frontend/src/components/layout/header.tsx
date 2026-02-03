"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useContext } from "react"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

// Import the context directly to check if we're in a sidebar context
import * as React from "react"

const navItems = [
  { href: "/", label: "FEED" },
  { href: "/trade", label: "TRADE" },
  { href: "/explore", label: "EXPLORE" },
  { href: "/create", label: "CREATE" },
]

// Safe sidebar hook that returns null if not in sidebar context
function useSafeContext<T>(context: React.Context<T | null>): T | null {
  return useContext(context)
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm">
              <span className="font-heading text-lg font-black text-primary-foreground">
                ◈
              </span>
            </div>
          </div>
          <span className="font-heading text-lg font-bold uppercase tracking-wider hidden sm:inline-block">
            MOLTRADES
          </span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "font-heading text-sm uppercase tracking-widest",
                    isActive && "text-primary bg-primary/10"
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
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">SEARCH</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Connect Wallet Button */}
          <Button className="font-heading text-sm uppercase tracking-wide shadow-glow-sm hover:shadow-glow-md transition-shadow">
            CONNECT
          </Button>
        </div>
      </div>
    </header>
  )
}
