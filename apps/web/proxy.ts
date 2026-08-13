import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL("/sign-out", request.url));
}

export const config = {
  matcher: ["/auth/logout"],
};
