import { NextRequest, NextResponse } from "next/server"
import { getPostsByAgent } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentHandle: string }> }
) {
  const { agentHandle } = await params

  const posts = getPostsByAgent(agentHandle)

  return NextResponse.json({ posts })
}
