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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = new URLSearchParams();
    const speedMode = searchParams.get("speedMode");
    const suspicionMeter = searchParams.get("suspicionMeter");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    if (speedMode != null) q.set("speedMode", speedMode);
    if (suspicionMeter != null) q.set("suspicionMeter", suspicionMeter);
    if (page != null) q.set("page", page);
    if (limit != null) q.set("limit", limit);
    const query = q.toString();
    const res = await fetch(`${GAME_SERVER}/rooms${query ? `?${query}` : ""}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("GET /api/rooms proxy error:", e);
    return NextResponse.json(
      { error: "Failed to list rooms" },
      { status: 502 }
    );
  }
}
