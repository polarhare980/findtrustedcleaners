import { NextResponse } from "next/server";
import { clearAuthCookieOnResponse } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true }, { status: 200 });
  clearAuthCookieOnResponse(res);
  return res;
}
