import { NextResponse } from "next/server";

import { upsertProfile } from "@/lib/server/db";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

export async function POST(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );

  if (!currentUser) {
    return NextResponse.json({ error: "Connexion utilisateur requise." }, { status: 401 });
  }

  const profile = await upsertProfile({
    id: currentUser.id,
    displayName: currentUser.displayName ?? currentUser.email ?? null
  });

  return NextResponse.json({ profile });
}
