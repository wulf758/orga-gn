import { NextResponse } from "next/server";

import { deleteAccountForSuperAdmin } from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id } = await context.params;
  const result = await deleteAccountForSuperAdmin({
    user: currentUser,
    targetUserId: id
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    deletedUserId: result.deletedUserId
  });
}
