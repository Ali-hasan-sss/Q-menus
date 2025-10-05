import { NextRequest, NextResponse } from "next/server";

export async function protectRestaurantRoutes(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    console.log("🔐 Restaurant middleware - Token exists:", !!token);

    if (!token) {
      console.log("❌ No token found, redirecting to login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    console.log("✅ Restaurant middleware - Access granted (token exists)");
    return NextResponse.next();
  } catch (error) {
    console.error("Restaurant auth middleware error:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export async function protectAdminRoutes(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    console.log("🔐 Admin middleware - Token exists:", !!token);

    if (!token) {
      console.log("❌ No token found, redirecting to login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    console.log("✅ Admin middleware - Access granted (token exists)");
    return NextResponse.next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
