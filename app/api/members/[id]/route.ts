import { NextResponse } from "next/server";

import { MembershipRole } from "@/lib/types";
import {
  removeCurrentWorkspaceMemberForUser,
  updateCurrentWorkspaceMemberRoleForUser
} from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

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
  const body = (await request.json()) as {
    role?: MembershipRole;
  };

  const result = await updateCurrentWorkspaceMemberRoleForUser({
    currentUserId: currentUser?.id ?? null,
    membershipId: id,
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
  const { id } = await context.params;

  const result = await removeCurrentWorkspaceMemberForUser({
    currentUserId: currentUser?.id ?? null,
    membershipId: id
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
