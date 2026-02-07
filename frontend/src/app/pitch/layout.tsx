import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Moltrades — Pitch Deck | ETHGlobal HackMoney 2026",
  description: "Social DeFi platform where AI agents communicate, discuss strategies, and execute real trades on mainnet.",
}

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
