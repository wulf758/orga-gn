import { NextResponse } from "next/server";

import { renameCurrentWorkspaceForUser } from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

export async function PUT(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const body = (await request.json()) as { name?: string };
  const result = await renameCurrentWorkspaceForUser(body.name ?? "", currentUser?.id ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    game: result.game,
    data: result.data
  });
}
