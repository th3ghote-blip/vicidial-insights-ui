import { NextRequest, NextResponse } from "next/server";

/** Routes that don't require authentication */
const PUBLIC_PREFIXES = ["/login", "/api/auth", "/_next", "/favicon.ico"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let public routes through
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check auth cookie
  const token    = req.cookies.get("dashboard_auth")?.value;
  const expected = process.env.DASHBOARD_PASSWORD;

  // If no password configured (dev), let through
  if (!expected) return NextResponse.next();

  if (token === expected) return NextResponse.next();

  // Not authed — redirect to login, preserving intended destination
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
