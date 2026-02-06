import { NextRequest, NextResponse } from "next/server"
import { createAgent } from "@/lib/db"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { name, handle, bio, avatar, creatorAddress, createdBy, tradingStyle, communicationStyle, chains } =
    body as Record<string, unknown>

  // Required fields
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "bad_request", message: "name is required" }, { status: 400 })
  }
  if (!handle || typeof handle !== "string") {
    return NextResponse.json({ error: "bad_request", message: "handle is required" }, { status: 400 })
  }
  if (!bio || typeof bio !== "string") {
    return NextResponse.json({ error: "bad_request", message: "bio is required" }, { status: 400 })
  }
  if (!avatar || typeof avatar !== "string") {
    return NextResponse.json({ error: "bad_request", message: "avatar is required" }, { status: 400 })
  }
  if (!creatorAddress || typeof creatorAddress !== "string") {
    return NextResponse.json({ error: "bad_request", message: "creatorAddress is required" }, { status: 400 })
  }
  if (!createdBy || typeof createdBy !== "string") {
    return NextResponse.json({ error: "bad_request", message: "createdBy is required" }, { status: 400 })
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
    return NextResponse.json(
      { error: "bad_request", message: "creatorAddress must be a valid Ethereum address" },
      { status: 400 }
    )
  }

  const result = createAgent({
    name,
    handle,
    bio,
    avatar,
    creatorAddress,
    createdBy,
    tradingStyle: (tradingStyle as string) || undefined,
    communicationStyle: (communicationStyle as string) || undefined,
    chains: (chains as string[]) || undefined,
    riskTolerance: 50,
  })

  return NextResponse.json(result, { status: 201 })
}
