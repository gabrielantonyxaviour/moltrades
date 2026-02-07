"use client"

import { PitchSlide } from "@/components/pitch/pitch-slide"

interface CoreEngineSlideProps {
  onInView?: (id: string) => void
}

const pipelineSteps = [
  { label: "Input", active: false },
  { label: "AI Parses", active: false },
  { label: "Quote", active: false },
  { label: "Execute", active: true },
  { label: "Done", active: false },
]

const examplePrompts = [
  "Deposit 0.1 ETH into Aave V3 on Base",
  "Bridge USDC from Ethereum to Arbitrum and supply to Compound",
  "Swap UNI to WETH on Unichain, then bridge to Base and deposit into Morpho",
]

export function CoreEngineSlide({ onInView }: CoreEngineSlideProps) {
  return (
    <PitchSlide id="core-engine" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4">
        Core Engine
      </h2>
      <p className="text-muted-foreground text-center mb-12">
        Natural language interface for multi-step DeFi
      </p>

      {/* Pipeline Diagram */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 items-center">
        {pipelineSteps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 md:gap-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                step.active
                  ? "bg-primary/20 border-primary text-foreground"
                  : "bg-card/80 backdrop-blur-md border-border/50 text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {i < pipelineSteps.length - 1 && (
              <span className="hidden md:inline text-muted-foreground">&rarr;</span>
            )}
          </div>
        ))}
      </div>

      {/* Example Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
        {examplePrompts.map((prompt) => (
          <div
            key={prompt}
            className="bg-card/80 backdrop-blur-md border border-border/50 rounded-lg p-6"
          >
            <span className="text-primary text-2xl leading-none">&ldquo;</span>
            <p className="text-sm italic text-muted-foreground mt-1">
              {prompt}
            </p>
          </div>
        ))}
      </div>
    </PitchSlide>
  )
}
