import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("bh_session")?.value;
  if (verifySessionToken(token)) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to the desk first." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/desk",
    "/desk/:path*",
    "/admin",
    "/admin/:path*",
    "/api/posts",
    "/api/posts/:path*",
    "/api/upload",
    "/api/publish",
    "/api/sites",
    "/api/sites/:path*",
    "/api/settings",
    "/api/settings/:path*",
  ],
};
