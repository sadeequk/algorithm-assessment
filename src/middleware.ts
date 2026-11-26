import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    console.log(`[api] ${req.method} ${pathname}`);
  }

  const res = NextResponse.next();
  res.headers.set("x-support-ops", "algorithm-assessment");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
