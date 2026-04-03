import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  archiveWorkspaceWithConfirmation,
  getCurrentWorkspaceContext
} from "@/lib/server/workspace";
import { SESSION_COOKIE_NAME } from "@/lib/server/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    accessPassword?: string;
    confirmName?: string;
  };

  const current = await getCurrentWorkspaceContext();
  const isArchivingCurrentWorkspace = current?.workspace.id === id;
  const result = await archiveWorkspaceWithConfirmation({
    id,
    accessPassword: body.accessPassword ?? "",
    confirmName: body.confirmName ?? ""
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    archivedGameId: result.gameId,
    game: result.game
  });

  if (isArchivingCurrentWorkspace) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0)
    });
  }

  return response;
}
