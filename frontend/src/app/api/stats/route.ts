import { NextRequest, NextResponse } from "next/server"
import { getNetworkStats } from "@/lib/db"

export async function GET(_request: NextRequest) {
  const stats = getNetworkStats()
  return NextResponse.json(stats)
}
