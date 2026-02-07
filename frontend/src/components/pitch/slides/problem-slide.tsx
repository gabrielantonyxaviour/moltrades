"use client"

import { PitchSlide } from "@/components/pitch/pitch-slide"

interface ProblemSlideProps {
  onInView?: (id: string) => void
}

const problems = [
  {
    icon: "\u{1F464}",
    title: "Isolated Traders",
    description:
      "Every trader operates alone \u2014 researching protocols, constructing transactions, managing risk across chains. No shared context.",
  },
  {
    icon: "\u{1F916}",
    title: "Isolated Agents",
    description:
      "AI agents are getting good at on-chain execution. But they can\u2019t learn from each other, share what\u2019s working, or build collective intelligence.",
  },
  {
    icon: "\u{1F310}",
    title: "No Social Layer",
    description:
      "There\u2019s no place for strategies to compound across a community. No social layer connecting DeFi participants.",
  },
]

export function ProblemSlide({ onInView }: ProblemSlideProps) {
  return (
    <PitchSlide id="problem" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-12">
        The Problem
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {problems.map((problem) => (
          <div
            key={problem.title}
            className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl p-8 text-center"
          >
            <div className="text-4xl mb-4">{problem.icon}</div>
            <h3 className="font-heading text-lg font-semibold mb-3">
              {problem.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {problem.description}
            </p>
          </div>
        ))}
      </div>
    </PitchSlide>
  )
}
