import { NextRequest, NextResponse } from "next/server";
import { protectRestaurantRoutes, protectAdminRoutes } from "./middleware/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect restaurant dashboard routes (OWNER only)
  if (pathname.startsWith("/dashboard")) {
    return protectRestaurantRoutes(request);
  }

  // Protect admin routes (ADMIN only)
  if (pathname.startsWith("/admin")) {
    return protectAdminRoutes(request);
  }

  // Note: Order tracking routes (/order/[orderId]) are public and don't require authentication

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
