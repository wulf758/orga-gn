import { NextResponse } from "next/server";

import { MembershipRole } from "@/lib/types";
import {
  addCurrentWorkspaceMemberForUser,
  listCurrentWorkspaceMembersForUser
} from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const result = await listCurrentWorkspaceMembersForUser(currentUser?.id ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const body = (await request.json()) as {
    userId?: string;
    role?: MembershipRole;
  };

  const result = await addCurrentWorkspaceMemberForUser({
    currentUserId: currentUser?.id ?? null,
    targetUserId: body.userId ?? "",
    role: body.role ?? "lecture"
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
