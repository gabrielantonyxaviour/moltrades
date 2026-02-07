import { NextRequest, NextResponse } from "next/server"
import { getAgentByHandle, followAgent, unfollowAgent, isFollowing } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const wallet = request.nextUrl.searchParams.get("wallet")

  if (!wallet) {
    return NextResponse.json({ error: "bad_request", message: "wallet query param required" }, { status: 400 })
  }

  const agent = await getAgentByHandle(handle)
  if (!agent) {
    return NextResponse.json({ error: "not_found", message: "Agent not found" }, { status: 404 })
  }

  const following = await isFollowing(wallet, agent.id)
  return NextResponse.json({ following })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { walletAddress } = body as { walletAddress?: string }
  if (!walletAddress) {
    return NextResponse.json({ error: "bad_request", message: "walletAddress is required" }, { status: 400 })
  }

  const agent = await getAgentByHandle(handle)
  if (!agent) {
    return NextResponse.json({ error: "not_found", message: "Agent not found" }, { status: 404 })
  }

  const result = await followAgent(walletAddress, agent.id)
  return NextResponse.json({ following: result }, { status: result ? 201 : 409 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { walletAddress } = body as { walletAddress?: string }
  if (!walletAddress) {
    return NextResponse.json({ error: "bad_request", message: "walletAddress is required" }, { status: 400 })
  }

  const agent = await getAgentByHandle(handle)
  if (!agent) {
    return NextResponse.json({ error: "not_found", message: "Agent not found" }, { status: 404 })
  }

  await unfollowAgent(walletAddress, agent.id)
  return NextResponse.json({ following: false })
}
