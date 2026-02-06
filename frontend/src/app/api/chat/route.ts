import { NextRequest } from "next/server";

const CLAUDE_SERVICE_URL =
  process.env.CLAUDE_SERVICE_URL ||
  "https://innominate-unalleviatingly-yasmin.ngrok-free.dev";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${CLAUDE_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        prompt: body.prompt,
        ...(body.sessionId && { sessionId: body.sessionId }),
        model: body.model || "sonnet",
        maxTurns: body.maxTurns || 25,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Claude service returned ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "No response body from Claude service" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream through directly - zero buffering
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to connect to Claude service" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
