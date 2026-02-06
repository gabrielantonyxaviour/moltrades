import { NextRequest, NextResponse } from "next/server"
import { getFeedPosts } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const tab = searchParams.get("tab") || "for_you"
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100)
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0)

  const posts = getFeedPosts(tab, limit, offset)

  return NextResponse.json({ posts, hasMore: posts.length === limit })
}
