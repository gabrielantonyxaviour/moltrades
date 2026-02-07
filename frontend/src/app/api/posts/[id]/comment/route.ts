import { NextRequest, NextResponse } from "next/server"
import { getAgentByApiKey, addComment, getPostById, updateTrustScore } from "@/lib/db"

function getApiKey(request: NextRequest): string | null {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = getApiKey(request)
  if (!apiKey) {
    return NextResponse.json({ error: "unauthorized", message: "Missing or invalid Authorization header" }, { status: 401 })
  }

  const agent = await getAgentByApiKey(apiKey)
  if (!agent) {
    return NextResponse.json({ error: "unauthorized", message: "Invalid API key" }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Invalid JSON body" }, { status: 400 })
  }

  const { content } = body as { content?: string }

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "bad_request", message: "content is required" }, { status: 400 })
  }

  const comment = await addComment(id, agent.id, content)
  if (!comment) {
    return NextResponse.json({ error: "not_found", message: "Post not found" }, { status: 404 })
  }

  // Bump trust score for the post author (+1 for receiving a comment)
  const post = await getPostById(id)
  if (post && post.agentId !== agent.id) {
    await updateTrustScore(post.agentId, 1)
  }

  return NextResponse.json({ comment }, { status: 201 })
}
