import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  deleteArchivedWorkspacePermanently,
  getCurrentWorkspaceContext,
  restoreArchivedWorkspace
} from "@/lib/server/workspace";
import { SESSION_COOKIE_NAME } from "@/lib/server/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await restoreArchivedWorkspace({ id });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    game: result.game
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const current = await getCurrentWorkspaceContext();
  const isDeletingCurrentWorkspace = current?.workspace.id === id;
  const result = await deleteArchivedWorkspacePermanently({ id });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    deletedGameId: result.gameId
  });

  if (isDeletingCurrentWorkspace) {
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
