"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { SlideNav } from "@/components/pitch/slide-nav"
import { HeroSlide } from "@/components/pitch/slides/hero-slide"
import { ProblemSlide } from "@/components/pitch/slides/problem-slide"
import { SolutionSlide } from "@/components/pitch/slides/solution-slide"
import { AgentsSlide } from "@/components/pitch/slides/agents-slide"
import { CoreEngineSlide } from "@/components/pitch/slides/core-engine-slide"
import { ArchitectureSlide } from "@/components/pitch/slides/architecture-slide"
import { LifiSlide } from "@/components/pitch/slides/lifi-slide"
import { UniswapSlide } from "@/components/pitch/slides/uniswap-slide"
import { ComposabilitySlide } from "@/components/pitch/slides/composability-slide"
import { DifferentiatorsSlide } from "@/components/pitch/slides/differentiators-slide"
import { BuiltSlide } from "@/components/pitch/slides/built-slide"
import { LinksSlide } from "@/components/pitch/slides/links-slide"

const SLIDES = [
  { id: "hero", label: "Hero" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "agents", label: "Agents" },
  { id: "core-engine", label: "Core Engine" },
  { id: "architecture", label: "Architecture" },
  { id: "lifi", label: "LI.FI" },
  { id: "uniswap", label: "Uniswap V4" },
  { id: "composability", label: "Composability" },
  { id: "differentiators", label: "Differentiators" },
  { id: "built", label: "What We Built" },
  { id: "links", label: "Links" },
]

export default function PitchPage() {
  const [activeSlide, setActiveSlide] = useState("hero")

  const handleInView = useCallback((id: string) => {
    setActiveSlide(id)
  }, [])

  return (
    <div className="relative pitch-grid-bg">
      {/* Floating logo */}
      <Link
        href="/"
        className="fixed top-5 left-5 z-50 font-heading text-lg font-bold text-primary hover:text-primary/80 transition-colors"
      >
        moltrades
      </Link>

      {/* Dot navigation */}
      <SlideNav slides={SLIDES} activeSlide={activeSlide} />

      {/* Scroll container */}
      <main className="h-screen overflow-y-auto snap-y snap-mandatory">
        <HeroSlide onInView={handleInView} />
        <ProblemSlide onInView={handleInView} />
        <SolutionSlide onInView={handleInView} />
        <AgentsSlide onInView={handleInView} />
        <CoreEngineSlide onInView={handleInView} />
        <ArchitectureSlide onInView={handleInView} />
        <LifiSlide onInView={handleInView} />
        <UniswapSlide onInView={handleInView} />
        <ComposabilitySlide onInView={handleInView} />
        <DifferentiatorsSlide onInView={handleInView} />
        <BuiltSlide onInView={handleInView} />
        <LinksSlide onInView={handleInView} />
      </main>
    </div>
  )
}
