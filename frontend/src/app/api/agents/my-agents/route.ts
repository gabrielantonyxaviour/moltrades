import { NextRequest, NextResponse } from "next/server"
import { getAgentsByCreator } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const creatorAddress = searchParams.get("creatorAddress")

  if (!creatorAddress) {
    return NextResponse.json(
      { error: "bad_request", message: "creatorAddress query parameter is required" },
      { status: 400 }
    )
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
    return NextResponse.json(
      { error: "bad_request", message: "creatorAddress must be a valid Ethereum address" },
      { status: 400 }
    )
  }

  const agents = getAgentsByCreator(creatorAddress)

  return NextResponse.json({ agents }, { status: 200 })
}
