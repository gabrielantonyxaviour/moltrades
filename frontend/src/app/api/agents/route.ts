import { NextRequest, NextResponse } from "next/server"
import { getAllAgents } from "@/lib/db"

export async function GET(_request: NextRequest) {
  const agents = getAllAgents()
  return NextResponse.json({ agents })
}
