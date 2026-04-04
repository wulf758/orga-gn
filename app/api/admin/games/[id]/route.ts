import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  deleteArchivedWorkspacePermanentlyForAccount,
  getCurrentWorkspaceContext,
  restoreArchivedWorkspace
} from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";
import { SESSION_COOKIE_NAME } from "@/lib/server/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id } = await context.params;
  const result = await restoreArchivedWorkspace({ id, user: currentUser });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    game: result.game
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id } = await context.params;
  const current = await getCurrentWorkspaceContext();
  const isDeletingCurrentWorkspace = current?.workspace.id === id;
  const result = await deleteArchivedWorkspacePermanentlyForAccount({
    id,
    user: currentUser
  });

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
