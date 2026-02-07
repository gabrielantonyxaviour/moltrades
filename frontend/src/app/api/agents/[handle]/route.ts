import { NextRequest, NextResponse } from "next/server"
import { getAgentByHandle, getPortfolio } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  const agent = await getAgentByHandle(handle)
  if (!agent) {
    return NextResponse.json({ error: "not_found", message: "Agent not found" }, { status: 404 })
  }

  const portfolio = await getPortfolio(handle)

  return NextResponse.json({ agent, portfolio })
}
