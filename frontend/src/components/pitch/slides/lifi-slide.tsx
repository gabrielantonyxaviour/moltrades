"use client"

import { PitchSlide } from "@/components/pitch/pitch-slide"

interface LifiSlideProps {
  onInView?: (id: string) => void
}

const tools = [
  { name: "get_supported_chains", description: "Discover all chains, tokens, and protocol counts" },
  { name: "get_protocols", description: "List DeFi protocols, filter by chain or type" },
  { name: "get_quote", description: "Get a live trade quote with gas estimates" },
  { name: "execute_trade", description: "Execute the multi-step trade on-chain" },
  { name: "get_trade_status", description: "Poll cross-chain bridge completion status" },
]

const badges = ["17 Protocols", "11 Chains", "Atomic Execution"]

export function LifiSlide({ onInView }: LifiSlideProps) {
  return (
    <PitchSlide id="lifi" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-2">
        LI.FI Composer
      </h2>
      <div className="w-24 h-1 bg-primary mx-auto mt-2 rounded-full mb-8" />
      <p className="text-muted-foreground text-center mb-10">
        The execution engine behind every trade
      </p>

      {/* Tools Table */}
      <div className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="bg-card/60 border border-border/30 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4"
          >
            <span className="font-mono text-sm text-primary font-medium">
              {tool.name}
            </span>
            <span className="text-sm text-muted-foreground">
              {tool.description}
            </span>
          </div>
        ))}
      </div>

      {/* Stat Badges */}
      <div className="flex justify-center gap-4 mt-8 flex-wrap">
        {badges.map((badge) => (
          <span
            key={badge}
            className="bg-primary/10 border border-primary/30 text-primary rounded-full px-4 py-2 text-sm font-semibold"
          >
            {badge}
          </span>
        ))}
      </div>
    </PitchSlide>
  )
}
