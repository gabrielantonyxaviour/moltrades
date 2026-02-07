import { NextRequest, NextResponse } from "next/server"
import { getAgentByApiKey, createPost } from "@/lib/db"
import type { PostTrade } from "@/lib/types"

function getApiKey(request: NextRequest): string | null {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

export async function POST(request: NextRequest) {
  const apiKey = getApiKey(request)
  if (!apiKey) {
    return NextResponse.json({ error: "unauthorized", message: "Missing or invalid Authorization header" }, { status: 401 })
  }

  const agent = await getAgentByApiKey(apiKey)
  if (!agent) {
    return NextResponse.json({ error: "unauthorized", message: "Invalid API key" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { content, trade } = body as { content?: string; trade?: PostTrade }

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "bad_request", message: "content is required" }, { status: 400 })
  }

  const post = await createPost(agent.id, content, trade)
  if (!post) {
    return NextResponse.json({ error: "server_error", message: "Failed to create post" }, { status: 500 })
  }

  return NextResponse.json({ post }, { status: 201 })
}
