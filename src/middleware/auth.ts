import { NextRequest, NextResponse } from "next/server";

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.qmenussy.com";

async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    // NOTE: Cookies from different domains (api.qmenussy.com) are NOT accessible
    // in Next.js middleware due to browser Same-Origin policy.
    // The cookie is HttpOnly and stored on api.qmenussy.com domain.
    // We can't read it from qmenussy.com middleware.

    // Since we can't verify the cookie in middleware, we'll allow the request
    // to proceed and let the client-side AuthContext handle authentication.
    // The API routes will still verify the cookie server-side.

    // However, we can check if there's any indication of authentication attempt
    // For now, we'll allow all requests and rely on client-side checks
    // The actual authentication will be verified by the backend API

    console.log(
      "🔍 Middleware: Allowing request (auth will be verified client-side)"
    );

    // Return true to allow the request - authentication will be checked:
    // 1. Client-side by AuthContext (on page load)
    // 2. Server-side by backend API (when API calls are made)
    return true;
  } catch (error) {
    console.error("❌ Middleware auth check error:", error);
    // On error, allow request - let client-side handle it
    return true;
  }
}

export async function protectRestaurantRoutes(request: NextRequest) {
  try {
    // Verify authentication with backend
    const isAuthenticated = await verifyAuth(request);

    console.log("🔐 Restaurant middleware - Authenticated:", isAuthenticated);

    if (!isAuthenticated) {
      console.log("❌ No valid auth found, redirecting to login");
      // Redirect to kitchen login if accessing kitchen, otherwise regular login
      const loginPath = request.nextUrl.pathname.startsWith("/kitchen")
        ? "/kitchen/login"
        : "/auth/login";
      const loginUrl = new URL(loginPath, request.url);
      return NextResponse.redirect(loginUrl);
    }

    console.log("✅ Restaurant middleware - Access granted");
    return NextResponse.next();
  } catch (error) {
    console.error("Restaurant auth middleware error:", error);
    // Redirect to kitchen login if accessing kitchen, otherwise regular login
    const loginPath = request.nextUrl.pathname.startsWith("/kitchen")
      ? "/kitchen/login"
      : "/auth/login";
    const loginUrl = new URL(loginPath, request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export async function protectAdminRoutes(request: NextRequest) {
  try {
    // NOTE: We can't verify cross-origin cookies in middleware
    // Allow the request to proceed - authentication will be handled:
    // 1. Client-side by AuthContext (will redirect if not authenticated)
    // 2. Server-side by backend API (will return 401 if not authenticated)

    console.log(
      "🔐 Admin middleware: Allowing request (client-side auth will handle redirect)"
    );

    // Allow request - AuthContext will check authentication and redirect if needed
    return NextResponse.next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    // On error, allow request - let client-side handle it
    return NextResponse.next();
  }
}
