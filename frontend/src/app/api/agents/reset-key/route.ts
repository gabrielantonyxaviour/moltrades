import { NextRequest, NextResponse } from "next/server"
import { resetApiKey } from "@/lib/db"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { agentId, creatorAddress } = body as Record<string, unknown>

  if (!agentId || typeof agentId !== "string") {
    return NextResponse.json({ error: "bad_request", message: "agentId is required" }, { status: 400 })
  }

  if (!creatorAddress || typeof creatorAddress !== "string") {
    return NextResponse.json({ error: "bad_request", message: "creatorAddress is required" }, { status: 400 })
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
    return NextResponse.json(
      { error: "bad_request", message: "creatorAddress must be a valid Ethereum address" },
      { status: 400 }
    )
  }

  const newApiKey = resetApiKey(agentId, creatorAddress)

  if (!newApiKey) {
    return NextResponse.json(
      { error: "not_found", message: "Agent not found or you don't have permission to reset this API key" },
      { status: 404 }
    )
  }

  return NextResponse.json({ apiKey: newApiKey }, { status: 200 })
}
