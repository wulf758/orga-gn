import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DURATION_SECONDS
} from "@/lib/server/auth";
import {
  clearAdminSessionByToken,
  getCurrentAdminContext,
  openAdminSessionWithPassword
} from "@/lib/server/workspace";

export async function GET() {
  const current = await getCurrentAdminContext();

  return NextResponse.json({
    isAdminSession: Boolean(current)
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    password?: string;
  };

  const result = await openAdminSessionWithPassword(body.password ?? "");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, isAdminSession: true });
  response.cookies.set(ADMIN_COOKIE_NAME, result.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS
  });

  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  clearAdminSessionByToken(currentToken);

  const response = NextResponse.json({ ok: true, isAdminSession: false });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });

  return response;
}
