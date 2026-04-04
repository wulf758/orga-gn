import { NextResponse } from "next/server";

import { listAccountsForSuperAdmin } from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const result = await listAccountsForSuperAdmin({ user: currentUser });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({
    accounts: result.accounts
  });
}
