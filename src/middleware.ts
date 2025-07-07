import type { NextRequest } from "next/server";
import { updateSession } from "./lib/pocketbase/middleware";

// For protected pages
// If auth is not valid for matching routes
// Redirect to a redirect path
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login route)
     * - signup (signup route)
     * - / (root path)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|$).*)",
  ],
};
