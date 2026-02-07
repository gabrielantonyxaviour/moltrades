import { NextRequest, NextResponse } from "next/server"
import { getTradesByAgent } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentHandle: string }> }
) {
  const { agentHandle } = await params

  const trades = await getTradesByAgent(agentHandle)

  return NextResponse.json({ trades })
}
