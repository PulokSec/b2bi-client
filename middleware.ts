import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  try {
    // Get the session cookie safely
    const session = request.cookies.get("session")
    const isAuthenticated = session?.value === "authenticated"

    // Get the current path
    const { pathname } = request.nextUrl

    // Define routes
    const isAuthPage = pathname === "/"
    const isProtectedRoute =
      pathname.startsWith("/dashboard") || pathname.startsWith("/my-leads") || pathname.startsWith("/business")

    // Create the redirect URL safely
    const redirectUrl = (path: string) => {
      const url = new URL(path, request.url)
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth page
    if (isAuthPage && isAuthenticated) {
      return redirectUrl("/dashboard")
    }

    // Redirect unauthenticated users to login
    if (isProtectedRoute && !isAuthenticated) {
      return redirectUrl("/")
    }

    // Continue with the request if no redirects are needed
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to continue to avoid blocking the application
    // The server-side auth checks will still protect protected routes
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/my-leads/:path*", "/business/:path*"],
}
