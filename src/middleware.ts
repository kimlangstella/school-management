// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/dashboard", "/profile"];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isLoginPage = pathname === "/login";

  if (!isProtected && !isLoginPage) return NextResponse.next();

  const token = req.cookies.get('sb-access-token')?.value;

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Only run middleware on protected paths:
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login'],
};
