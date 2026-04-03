import { NextResponse } from "next/server";

import { openWorkspaceWithPassword } from "@/lib/server/workspace";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    accessPassword?: string;
  };

  const result = await openWorkspaceWithPassword({
    id: body.id ?? "",
    accessPassword: body.accessPassword ?? ""
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({
    game: result.game,
    data: result.data
  });

  response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  });

  return response;
}
