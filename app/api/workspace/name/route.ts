import { NextResponse } from "next/server";

import { renameCurrentWorkspace } from "@/lib/server/workspace";

export async function PUT(request: Request) {
  const body = (await request.json()) as { name?: string };
  const result = await renameCurrentWorkspace(body.name ?? "");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    game: result.game,
    data: result.data
  });
}
