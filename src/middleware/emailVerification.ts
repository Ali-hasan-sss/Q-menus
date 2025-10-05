import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function checkEmailVerification(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Check if email is verified
    if (!payload.emailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Email verification middleware error:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
