import { NextResponse } from "next/server";

import {
  createWorkspaceWithAccess,
  listWorkspaceOverviewForUser
} from "@/lib/server/workspace";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest
} from "@/lib/server/supabase-auth";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS
} from "@/lib/server/auth";

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );
  const payload = await listWorkspaceOverviewForUser(currentUser?.id ?? null);
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const currentUser = await getAuthenticatedUserFromAccessToken(
      getBearerTokenFromRequest(request)
    );
    const body = (await request.json()) as {
      name?: string;
    };

    const result = await createWorkspaceWithAccess({
      name: body.name ?? "",
      creator: currentUser
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      game: result.game,
      data: result.data
    });

    response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS
    });

    return response;
  } catch (error) {
    console.error("POST /api/games failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Creation impossible: ${error.message}`
            : "Creation impossible."
      },
      { status: 500 }
    );
  }
}
