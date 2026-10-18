import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const ADMIN_COOKIE_NAME = "kk_admin_session";
const ADMIN_SESSION_VALUE = "authenticated_adminuser1_session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all /admin/* (except /admin/login) and /dashboard/* routes
  const isAdminRoute =
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    pathname.startsWith("/dashboard");

  if (isAdminRoute) {
    const adminSession = request.cookies.get(ADMIN_COOKIE_NAME);
    const isAuthenticated = adminSession?.value === ADMIN_SESSION_VALUE;

    if (!isAuthenticated) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect /admin/login to /admin-login
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
