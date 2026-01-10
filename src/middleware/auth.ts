import { NextRequest, NextResponse } from "next/server";

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.qmenussy.com";

async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    // Try to get token from cookie first (works for same-domain cookies)
    const token = request.cookies.get("auth-token")?.value;

    // Get all cookies from request header (for cross-origin cookies)
    const cookieHeader = request.headers.get("cookie");

    // Build cookie string for API request
    let cookieString = "";
    if (token) {
      cookieString = `auth-token=${token}`;
    } else if (cookieHeader) {
      cookieString = cookieHeader;
    }

    // If we have a cookie, verify it with backend
    if (cookieString) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Cookie: cookieString,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error("Auth verification error:", error);
      }
    }

    return false;
  } catch (error) {
    console.error("Auth verification error:", error);
    return false;
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
    // Verify authentication with backend
    const isAuthenticated = await verifyAuth(request);

    console.log("🔐 Admin middleware - Authenticated:", isAuthenticated);

    if (!isAuthenticated) {
      console.log("❌ No valid auth found, redirecting to login");
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Additional check: verify user is ADMIN
    try {
      const cookieHeader = request.headers.get("cookie");
      const token = request.cookies.get("auth-token")?.value;

      let cookieString = "";
      if (token) {
        cookieString = `auth-token=${token}`;
      } else if (cookieHeader) {
        cookieString = cookieHeader;
      }

      if (cookieString) {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Cookie: cookieString,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.user?.role === "ADMIN") {
            console.log("✅ Admin middleware - Access granted (ADMIN role)");
            return NextResponse.next();
          }
        }
      }
    } catch (error) {
      console.error("Admin role verification error:", error);
    }

    // If not admin, redirect to login
    console.log("❌ Not admin, redirecting to login");
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}
