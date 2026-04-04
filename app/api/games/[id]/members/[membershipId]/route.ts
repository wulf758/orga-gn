import { NextResponse } from "next/server";

import { MembershipRole } from "@/lib/types";
import {
  removeWorkspaceMemberForGameId,
  updateWorkspaceMemberRoleForGameId
} from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

type RouteContext = {
  params: Promise<{
    id: string;
    membershipId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id, membershipId } = await context.params;
  const body = (await request.json()) as {
    role?: MembershipRole;
  };

  const result = await updateWorkspaceMemberRoleForGameId({
    workspaceId: id,
    currentUserId: currentUser?.id ?? null,
    membershipId,
    role: body.role ?? "lecture"
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id, membershipId } = await context.params;

  const result = await removeWorkspaceMemberForGameId({
    workspaceId: id,
    currentUserId: currentUser?.id ?? null,
    membershipId
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
