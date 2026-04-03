import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  clearWorkspaceSessionByToken,
  getCurrentWorkspaceContext
} from "@/lib/server/workspace";
import { SESSION_COOKIE_NAME } from "@/lib/server/auth";

export async function GET() {
  const current = await getCurrentWorkspaceContext();

  return NextResponse.json({
    currentGame: current?.summary ?? null
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  clearWorkspaceSessionByToken(currentToken);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });

  return response;
}
