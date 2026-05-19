import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate-limit login attempts: 10 per 15 min per IP
  const ip = getIp(req);
  if (!rateLimit(`${ip}:auth`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const { password } = await req.json();
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    // No password set — open access (dev mode)
    return NextResponse.json({ ok: true });
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dashboard_auth", expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dashboard_auth");
  return res;
}
