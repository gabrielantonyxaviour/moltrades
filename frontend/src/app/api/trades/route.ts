import { NextRequest, NextResponse } from "next/server"
import { getAgentByApiKey, recordTrade, updateTrustScore, updatePortfolio } from "@/lib/db"

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

  const { type, pair, amount, price, pnl, pnlPercent, chain, txHash, protocol } = body as Record<string, unknown>

  if (!type || !["BUY", "SELL", "DEPOSIT", "BRIDGE"].includes(type as string)) {
    return NextResponse.json({ error: "bad_request", message: "type must be BUY, SELL, DEPOSIT, or BRIDGE" }, { status: 400 })
  }
  if (!pair || typeof pair !== "string") {
    return NextResponse.json({ error: "bad_request", message: "pair is required" }, { status: 400 })
  }
  if (!amount || typeof amount !== "string") {
    return NextResponse.json({ error: "bad_request", message: "amount is required" }, { status: 400 })
  }
  if (!price || typeof price !== "string") {
    return NextResponse.json({ error: "bad_request", message: "price is required" }, { status: 400 })
  }
  if (!pnl || typeof pnl !== "string") {
    return NextResponse.json({ error: "bad_request", message: "pnl is required" }, { status: 400 })
  }
  if (!pnlPercent || typeof pnlPercent !== "string") {
    return NextResponse.json({ error: "bad_request", message: "pnlPercent is required" }, { status: 400 })
  }
  if (!chain || typeof chain !== "string") {
    return NextResponse.json({ error: "bad_request", message: "chain is required" }, { status: 400 })
  }

  const trade = await recordTrade(agent.id, {
    type: type as "BUY" | "SELL" | "DEPOSIT" | "BRIDGE",
    pair: pair as string,
    amount: amount as string,
    price: price as string,
    pnl: pnl as string,
    pnlPercent: pnlPercent as string,
    chain: chain as string,
    txHash: typeof txHash === "string" ? txHash : undefined,
    protocol: typeof protocol === "string" ? protocol : undefined,
  })

  // Trust score: +2 for any trade, +1 for positive PnL, -1 for negative PnL
  let trustDelta = 2
  const pnlStr = pnl as string
  if (pnlStr.startsWith("+") && pnlStr !== "+$0" && pnlStr !== "+0") {
    trustDelta += 1
  } else if (pnlStr.startsWith("-")) {
    trustDelta -= 1
  }
  await updateTrustScore(agent.id, trustDelta)

  // Update portfolio from trade data
  await updatePortfolio(agent.id, {
    type: type as string,
    pair: pair as string,
    amount: amount as string,
    price: price as string,
    chain: chain as string,
  })

  return NextResponse.json({ trade }, { status: 201 })
}
