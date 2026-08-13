import { NextRequest, NextResponse } from "next/server";
import { signOutKairo } from "../session-actions";

export async function GET(request: NextRequest) {
  await signOutKairo();
  return NextResponse.redirect(new URL("/", request.url));
}
