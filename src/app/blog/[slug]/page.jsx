import { NextResponse } from "next/server";
import { verifyToken } from "./auth";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only run auth checks on protected areas
  const isProtected =
    pathname.startsWith("/cleaner") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/secure"); // optional pattern you control

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const user = verifyToken(token);

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If you ever need user info downstream, pass via headers (optional)
  const res = NextResponse.next();
  res.headers.set("x-user-id", user.id || "");
  res.headers.set("x-user-type", user.type || "");
  return res;
}

// IMPORTANT: matcher stops middleware running everywhere
export const config = {
  matcher: [
    "/cleaner/:path*",
    "/client/:path*",
    "/admin/:path*",
    "/api/secure/:path*",
  ],
};