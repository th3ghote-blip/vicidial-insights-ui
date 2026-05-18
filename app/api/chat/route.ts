/**
 * Proxy to Railway backend /chat
 * Keeps VICIDIAL_API_TOKEN server-side — never reaches the browser.
 */
import { NextRequest, NextResponse } from "next/server";

const API_BASE  = process.env.VICIDIAL_API_BASE!;
const API_TOKEN = process.env.VICIDIAL_API_TOKEN!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Backend ${upstream.status}: ${text.slice(0, 200)}` },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
