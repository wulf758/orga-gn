import { NextResponse } from "next/server";

import { AppData } from "@/lib/types";
import {
  getCurrentWorkspaceDataForUser,
  saveCurrentWorkspaceForUser
} from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const current = await getCurrentWorkspaceDataForUser(currentUser?.id ?? null);

  if (!current) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  return NextResponse.json(current);
}

export async function PUT(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const body = (await request.json()) as { data?: AppData };

  if (!body.data) {
    return NextResponse.json({ error: "Donnees manquantes." }, { status: 400 });
  }

  const result = await saveCurrentWorkspaceForUser(body.data, currentUser?.id ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    game: result.game,
    data: result.data
  });
}
