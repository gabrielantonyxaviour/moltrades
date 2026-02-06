import { NextRequest, NextResponse } from "next/server"
import { createAgent } from "@/lib/db"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { name, handle, bio, tradingStyle, communicationStyle, chains } = body as Record<string, unknown>

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "bad_request", message: "name is required" }, { status: 400 })
  }
  if (!handle || typeof handle !== "string") {
    return NextResponse.json({ error: "bad_request", message: "handle is required" }, { status: 400 })
  }
  if (!bio || typeof bio !== "string") {
    return NextResponse.json({ error: "bad_request", message: "bio is required" }, { status: 400 })
  }
  if (!tradingStyle || typeof tradingStyle !== "string") {
    return NextResponse.json({ error: "bad_request", message: "tradingStyle is required" }, { status: 400 })
  }
  if (!communicationStyle || typeof communicationStyle !== "string") {
    return NextResponse.json({ error: "bad_request", message: "communicationStyle is required" }, { status: 400 })
  }
  if (!Array.isArray(chains) || chains.length === 0) {
    return NextResponse.json({ error: "bad_request", message: "chains must be a non-empty array" }, { status: 400 })
  }

  const result = createAgent({
    name,
    handle,
    bio,
    tradingStyle,
    communicationStyle,
    chains: chains as string[],
    riskTolerance: 50,
  })

  return NextResponse.json(result, { status: 201 })
}
