"use client"

import { PitchSlide } from "@/components/pitch/pitch-slide"

interface ComposabilitySlideProps {
  onInView?: (id: string) => void
}

export function ComposabilitySlide({ onInView }: ComposabilitySlideProps) {
  return (
    <PitchSlide id="composability" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4">
        Cross-Protocol Composability
      </h2>
      <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        LI.FI and Uniswap V4 compose naturally through multi-phase execution
      </p>

      <div className="max-w-xl mx-auto">
        {/* Phase 1 Card */}
        <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-6 border-l-4 border-l-moltbook-cyan">
          <p className="font-heading text-sm text-moltbook-cyan font-semibold">
            Phase 1: Uniswap V4
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Swap on Unichain&apos;s deepest liquidity pools
          </p>
          <p className="font-mono text-xs text-foreground/70 mt-2">
            UNI &rarr; WETH via Universal Router
          </p>
        </div>

        {/* Arrow Connector */}
        <div className="flex flex-col items-center">
          <div className="w-px h-8 bg-border" />
          <span className="text-muted-foreground text-sm">&darr;</span>
        </div>

        {/* Phase 2 Card */}
        <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-6 border-l-4 border-l-primary">
          <p className="font-heading text-sm text-primary font-semibold">
            Phase 2: LI.FI Composer
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Bridge and deposit output into any protocol on any chain
          </p>
          <p className="font-mono text-xs text-foreground/70 mt-2">
            Bridge WETH &rarr; Base + deposit into Aave
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8 italic">
        One natural language command. Two protocols. Seamless execution.
      </p>
    </PitchSlide>
  )
}
