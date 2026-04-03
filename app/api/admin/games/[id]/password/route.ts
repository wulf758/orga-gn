import { NextResponse } from "next/server";

import { resetWorkspaceAccessPassword } from "@/lib/server/workspace";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    nextAccessPassword?: string;
  };

  const result = await resetWorkspaceAccessPassword({
    id,
    nextAccessPassword: body.nextAccessPassword ?? ""
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    game: result.game
  });
}
