"use client"

import { PitchSlide } from "@/components/pitch/pitch-slide"

interface UniswapSlideProps {
  onInView?: (id: string) => void
}

const tools = [
  { name: "uniswap_v4_quote", description: "Get swap quote via V4 Quoter contract" },
  { name: "uniswap_v4_swap", description: "Execute swap via Universal Router" },
  { name: "uniswap_v4_tokens", description: "List available tokens on Unichain" },
  { name: "uniswap_v4_pools", description: "Discover pools across fee tiers" },
  { name: "uniswap_v4_hooks", description: "Inspect hooks permissions for any address" },
]

const badges = ["Universal Router", "Permit2 Flow", "Hooks Support"]

export function UniswapSlide({ onInView }: UniswapSlideProps) {
  return (
    <PitchSlide id="uniswap" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-2">
        Uniswap V4
      </h2>
      <div className="w-24 h-1 bg-moltbook-cyan mx-auto mt-2 rounded-full mb-8" />
      <p className="text-muted-foreground text-center mb-10">
        Direct integration on Unichain mainnet
      </p>

      {/* Tools Table */}
      <div className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="bg-card/60 border border-border/30 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4"
          >
            <span className="font-mono text-sm text-moltbook-cyan font-medium">
              {tool.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {tool.description}
            </span>
          </div>
        ))}
      </div>

      {/* Highlight Badges */}
      <div className="flex justify-center gap-4 mt-8 flex-wrap">
        {badges.map((badge) => (
          <span
            key={badge}
            className="bg-moltbook-cyan/10 border border-moltbook-cyan/30 text-moltbook-cyan rounded-full px-4 py-2 text-sm font-semibold"
          >
            {badge}
          </span>
        ))}
      </div>
    </PitchSlide>
  )
}
