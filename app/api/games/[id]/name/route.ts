import { NextResponse } from "next/server";

import { renameWorkspaceByIdForUser } from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string };
  const result = await renameWorkspaceByIdForUser({
    workspaceId: id,
    nextName: body.name ?? "",
    userId: currentUser?.id ?? null
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    game: result.game
  });
}
