import { MembershipRole } from "@/lib/types";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

const DEFAULT_SUPER_ADMIN_DISPLAY_NAMES = ["cyril"];

function getSupabaseAuthConfig() {
  const url =
    process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

function normalizeDisplayName(payload: Record<string, unknown>) {
  const userMetadata =
    payload.user_metadata && typeof payload.user_metadata === "object"
      ? (payload.user_metadata as Record<string, unknown>)
      : null;

  const candidate =
    (typeof userMetadata?.display_name === "string" && userMetadata.display_name) ||
    (typeof userMetadata?.full_name === "string" && userMetadata.full_name) ||
    (typeof payload.email === "string" && payload.email.split("@")[0]) ||
    null;

  return candidate?.trim() || null;
}

function parseIdentityList(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLocaleLowerCase())
    .filter(Boolean);
}

export function isSuperAdminUser(user?: AuthenticatedUser | null) {
  if (!user) {
    return false;
  }

  const configuredIds = parseIdentityList(process.env.SUPER_ADMIN_USER_IDS);
  const configuredEmails = parseIdentityList(process.env.SUPER_ADMIN_EMAILS);
  const configuredNames = parseIdentityList(process.env.SUPER_ADMIN_DISPLAY_NAMES);
  const effectiveNames =
    configuredNames.length > 0 ? configuredNames : DEFAULT_SUPER_ADMIN_DISPLAY_NAMES;

  const userId = user.id.trim().toLocaleLowerCase();
  const email = user.email?.trim().toLocaleLowerCase() ?? "";
  const displayName = user.displayName?.trim().toLocaleLowerCase() ?? "";

  return (
    configuredIds.includes(userId) ||
    (email ? configuredEmails.includes(email) : false) ||
    (displayName ? effectiveNames.includes(displayName) : false)
  );
}

export async function getAuthenticatedUserFromAccessToken(accessToken?: string | null) {
  const token = accessToken?.trim();

  if (!token) {
    return null;
  }

  const config = getSupabaseAuthConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Record<string, unknown>;

  return {
    id: String(payload.id),
    email: typeof payload.email === "string" ? payload.email : null,
    displayName: normalizeDisplayName(payload)
  } satisfies AuthenticatedUser;
}

export function getBearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export function canWriteWorkspace(role: MembershipRole) {
  return role === "admin" || role === "orga";
}
