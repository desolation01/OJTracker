import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { isPwaLocalMode } from "@/lib/pwa-mode";

export async function middleware(request: NextRequest) {
  if (isPwaLocalMode) {
    const { pathname } = request.nextUrl;
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isAuthed = Boolean(user);

  const isPublicAuthRoute = pathname === "/login" || pathname === "/register";
  const isProtectedDashboard = pathname.startsWith("/dashboard");
  const isProtectedApi = pathname.startsWith("/api");

  if (isPublicAuthRoute && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedDashboard && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isProtectedApi && !isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
