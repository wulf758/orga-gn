import { NextResponse } from "next/server";
import {
  getAuthenticatedUserFromAccessToken,
  getBearerTokenFromRequest,
  isSuperAdminUser
} from "@/lib/server/supabase-auth";

export async function GET(request: Request) {
  const currentUser = await getAuthenticatedUserFromAccessToken(
    getBearerTokenFromRequest(request)
  );

  return NextResponse.json({
    isSuperAdmin: isSuperAdminUser(currentUser)
  });
}
