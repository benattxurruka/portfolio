import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "admin_session";

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;
  const sessionCookie = request.cookies.get(COOKIE)?.value;

  if (!secret || !sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const expected = await hashSecret(secret);
  if (sessionCookie !== expected) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
