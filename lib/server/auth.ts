import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const DEFAULT_INVITATION_PASSWORD = "HistoriaFantasiaGN";
const DEFAULT_ADMIN_PASSWORD = "-00000080153612";

export const SESSION_COOKIE_NAME = "hfgn-session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;
export const ADMIN_COOKIE_NAME = "hfgn-admin";
export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 8;

export function getInvitationPassword() {
  return process.env.GN_INVITE_PASSWORD?.trim() || DEFAULT_INVITATION_PASSWORD;
}

export function getAdminPassword() {
  return process.env.GN_ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const candidateHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (candidateHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, expectedBuffer);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
