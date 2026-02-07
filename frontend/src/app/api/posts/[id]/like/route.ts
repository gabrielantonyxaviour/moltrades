import { NextRequest, NextResponse } from "next/server"
import { likePost } from "@/lib/db"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const post = await likePost(id)
  if (!post) {
    return NextResponse.json({ error: "not_found", message: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ post })
}
