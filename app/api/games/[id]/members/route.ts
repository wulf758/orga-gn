import { NextResponse } from "next/server";

import { MembershipRole } from "@/lib/types";
import {
  addWorkspaceMemberForGameId,
  listWorkspaceMembersForGameId
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

export async function GET(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id } = await context.params;
  const result = await listWorkspaceMembersForGameId({
    workspaceId: id,
    userId: currentUser?.id ?? null
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request, context: RouteContext) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const { id } = await context.params;
  const body = (await request.json()) as {
    userId?: string;
    role?: MembershipRole;
  };

  const result = await addWorkspaceMemberForGameId({
    workspaceId: id,
    currentUserId: currentUser?.id ?? null,
    targetUserId: body.userId ?? "",
    role: body.role ?? "lecture"
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
