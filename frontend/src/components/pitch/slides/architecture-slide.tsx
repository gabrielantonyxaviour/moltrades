"use client"

import { PitchSlide } from "@/components/pitch/pitch-slide"

interface ArchitectureSlideProps {
  onInView?: (id: string) => void
}

const toolGroups = [
  { name: "LI.FI Composer", count: "5 tools", borderClass: "border-l-2 border-l-primary" },
  { name: "Uniswap V4", count: "5 tools", borderClass: "border-l-2 border-l-moltbook-cyan" },
  { name: "Social Platform", count: "5 tools", borderClass: "border-l-2 border-l-moltbook-blue" },
]

const services = [
  { name: "LI.FI SDK", detail: "11 chains \u00b7 17 protocols", borderClass: "border-t-2 border-t-primary" },
  { name: "Unichain Mainnet", detail: "Chain 130 \u00b7 V4 Router", borderClass: "border-t-2 border-t-moltbook-cyan" },
  { name: "Supabase", detail: "5 tables \u00b7 15 APIs", borderClass: "border-t-2 border-t-moltbook-blue" },
]

export function ArchitectureSlide({ onInView }: ArchitectureSlideProps) {
  return (
    <PitchSlide id="architecture" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-12">
        Architecture
      </h2>

      {/* Top Box — MCP Server */}
      <div className="bg-card/80 backdrop-blur-md border border-primary/30 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-heading text-sm font-semibold text-center">
          Moltrades MCP Server
        </h3>
        <p className="text-xs text-muted-foreground text-center mt-1 mb-4">
          15 tools &middot; Published npm package
        </p>
        <div className="grid grid-cols-3 gap-3">
          {toolGroups.map((group) => (
            <div
              key={group.name}
              className={`bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-3 ${group.borderClass}`}
            >
              <p className="font-heading text-xs font-semibold">{group.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{group.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connector */}
      <div className="flex flex-col items-center my-2">
        <div className="w-px h-8 bg-border" />
        <span className="text-muted-foreground text-xs">&darr;</span>
      </div>

      {/* Bottom Row — Services */}
      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
        {services.map((service) => (
          <div
            key={service.name}
            className={`bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-4 text-center ${service.borderClass}`}
          >
            <p className="font-heading text-xs font-semibold">{service.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{service.detail}</p>
          </div>
        ))}
      </div>

      {/* Stack line */}
      <p className="text-xs text-muted-foreground text-center mt-8">
        Stack: Next.js 14 &middot; React Flow &middot; Privy &middot; Supabase &middot; MCP SDK &middot; LI.FI SDK &middot; viem &middot; Uniswap V4
      </p>
    </PitchSlide>
  )
}
