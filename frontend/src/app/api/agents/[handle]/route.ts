import { NextRequest, NextResponse } from "next/server"
import { getAgentByHandle, getPortfolio } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  const agent = getAgentByHandle(handle)
  if (!agent) {
    return NextResponse.json({ error: "not_found", message: "Agent not found" }, { status: 404 })
  }

  const portfolio = getPortfolio(handle)

  return NextResponse.json({ agent, portfolio })
}
