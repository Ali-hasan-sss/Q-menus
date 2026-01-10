import { NextRequest, NextResponse } from "next/server";
import { protectRestaurantRoutes, protectAdminRoutes } from "./middleware/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fix common typo: /kichen -> /kitchen
  if (pathname.startsWith("/kichen")) {
    const correctedPath = pathname.replace("/kichen", "/kitchen");
    const url = request.nextUrl.clone();
    url.pathname = correctedPath;
    return NextResponse.redirect(url);
  }

  // Protect restaurant dashboard routes (OWNER only)
  if (pathname.startsWith("/dashboard")) {
    return protectRestaurantRoutes(request);
  }

  // Protect admin routes (ADMIN only)
  if (pathname.startsWith("/admin")) {
    return protectAdminRoutes(request);
  }

  // Protect kitchen display routes (restaurant users only, but login page is allowed)
  if (
    pathname.startsWith("/kitchen") &&
    !pathname.startsWith("/kitchen/login")
  ) {
    return protectRestaurantRoutes(request);
  }

  // Note: Order tracking routes (/order/[orderId]) are public and don't require authentication

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/kitchen/:path*"],
};
