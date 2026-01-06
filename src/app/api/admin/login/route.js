import { NextResponse } from "next/server";
import { createToken, setAuthCookieOnResponse } from "@/lib/auth";

export async function POST(req) {
  try {
    const { password } = await req.json();

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "ADMIN_PASSWORD is not set in environment variables" },
        { status: 500 }
      );
    }

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });
    }

    const token = createToken({
      type: "admin",
      email: "admin@findtrustedcleaners.com",
    });

    const res = NextResponse.json({ success: true }, { status: 200 });
    setAuthCookieOnResponse(res, token);
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
