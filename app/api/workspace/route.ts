import { NextResponse } from "next/server";

import { AppData } from "@/lib/types";
import {
  getCurrentWorkspaceData,
  saveCurrentWorkspace
} from "@/lib/server/workspace";

export async function GET() {
  const current = await getCurrentWorkspaceData();

  if (!current) {
    return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  }

  return NextResponse.json(current);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { data?: AppData };

  if (!body.data) {
    return NextResponse.json({ error: "Donnees manquantes." }, { status: 400 });
  }

  const result = await saveCurrentWorkspace(body.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    game: result.game,
    data: result.data
  });
}
