import { NextRequest, NextResponse } from "next/server";

const GAME_SERVER =
  process.env.GAME_SERVER_HTTP ?? "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${GAME_SERVER}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("POST /api/rooms proxy error:", e);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 502 }
    );
  }
}
