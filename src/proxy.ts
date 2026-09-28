import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", `${pathname}${search}`);
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  if (!pathname.startsWith("/admin")) return next();
  if (pathname === "/admin/login") return next();
  if (!req.auth) {
    const login = new URL("/admin/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
