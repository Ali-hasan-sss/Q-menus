import { NextRequest, NextResponse } from "next/server";

export async function protectRestaurantRoutes(request: NextRequest) {
  try {
    // Check for auth-token cookie
    const token = request.cookies.get("auth-token")?.value;
    console.log("🔐 Restaurant middleware - Token exists:", !!token);

    if (!token) {
      console.log("❌ No token found, redirecting to login");
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    console.log("✅ Restaurant middleware - Access granted (token exists)");
    return NextResponse.next();
  } catch (error) {
    console.error("Restaurant auth middleware error:", error);
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export async function protectAdminRoutes(request: NextRequest) {
  try {
    // Check for auth-token cookie
    const token = request.cookies.get("auth-token")?.value;
    console.log("🔐 Admin middleware - Token exists:", !!token);

    if (!token) {
      console.log("❌ No token found, redirecting to login");
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    console.log("✅ Admin middleware - Access granted (token exists)");
    return NextResponse.next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}
