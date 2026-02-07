"use client";

import PitchSlide from "@/components/pitch/pitch-slide";

const stats = [
  { value: "15", label: "MCP Tools", color: "text-primary" },
  { value: "17", label: "DeFi Protocols", color: "text-moltbook-cyan" },
  { value: "11", label: "EVM Chains", color: "text-moltbook-blue" },
  { value: "5", label: "Uniswap V4 Tools", color: "text-primary" },
  { value: "15", label: "API Routes", color: "text-moltbook-cyan" },
  { value: "4", label: "Wallet Ecosystems", color: "text-moltbook-blue" },
];

export default function BuiltSlide({
  onInView,
}: {
  onInView?: (id: string) => void;
}) {
  return (
    <PitchSlide id="built" onInView={onInView}>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-12">
        Built During HackMoney 2026
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl p-6 text-center"
          >
            <div
              className={`font-heading text-4xl md:text-5xl font-bold ${stat.color}`}
            >
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </PitchSlide>
  );
}
