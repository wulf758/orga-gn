import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { getEmptyAppData } from "@/lib/data";
import { AppData, WorkspaceSummary } from "@/lib/types";

type WorkspaceRow = {
  id: string;
  name: string;
  password_hash: string;
  workspace_json: string | AppData;
  document_count: number;
  character_count: number;
  plot_count: number;
  kraft_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type SessionRow = {
  token_hash: string;
  workspace_id: string;
  expires_at: string;
  created_at: string;
};

type AdminSessionRow = {
  token_hash: string;
  expires_at: string;
  created_at: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __hfgnDatabase: DatabaseSync | undefined;
}

const WORKSPACE_SELECT =
  "id,name,password_hash,workspace_json,document_count,character_count,plot_count,kraft_count,created_at,updated_at,archived_at";
const SESSION_SELECT = "token_hash,workspace_id,expires_at,created_at";
const ADMIN_SESSION_SELECT = "token_hash,expires_at,created_at";

function getDatabasePath() {
  const directory = join(process.cwd(), ".data");
  mkdirSync(directory, { recursive: true });
  return join(directory, "hfgn.sqlite");
}

function createSqliteDatabase() {
  const database = new DatabaseSync(getDatabasePath());
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      workspace_json TEXT NOT NULL,
      document_count INTEGER NOT NULL DEFAULT 0,
      character_count INTEGER NOT NULL DEFAULT 0,
      plot_count INTEGER NOT NULL DEFAULT 0,
      kraft_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id ON sessions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
  `);

  const columns = database
    .prepare("PRAGMA table_info(workspaces)")
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "archived_at")) {
    database.exec("ALTER TABLE workspaces ADD COLUMN archived_at TEXT");
  }

  return database;
}

function getSqliteDatabase() {
  if (!globalThis.__hfgnDatabase) {
    globalThis.__hfgnDatabase = createSqliteDatabase();
  }

  return globalThis.__hfgnDatabase;
}

function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    "";

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

function isSupabaseEnabled() {
  return Boolean(getSupabaseConfig());
}

function toSummary(row: WorkspaceRow): WorkspaceSummary {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documentCount: row.document_count,
    characterCount: row.character_count,
    plotCount: row.plot_count,
    kraftCount: row.kraft_count,
    archived: Boolean(row.archived_at),
    archivedAt: row.archived_at
  };
}

function makeWorkspacePayload(data: AppData) {
  return {
    json: JSON.stringify(data),
    documentCount: data.documents.length,
    characterCount: data.characters.length,
    plotCount: data.plots.length,
    kraftCount: data.kraftItems.length
  };
}

function toSupabaseWorkspaceData(data: AppData) {
  return {
    ...data,
    gameName: data.gameName
  };
}

function fromSupabaseWorkspace(row: Record<string, unknown>): WorkspaceRow {
  return {
    id: String(row.id),
    name: String(row.name),
    password_hash: String(row.password_hash),
    workspace_json: row.workspace_json as AppData,
    document_count: Number(row.document_count ?? 0),
    character_count: Number(row.character_count ?? 0),
    plot_count: Number(row.plot_count ?? 0),
    kraft_count: Number(row.kraft_count ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    archived_at: row.archived_at ? String(row.archived_at) : null
  };
}

function fromSupabaseSession(row: Record<string, unknown>): SessionRow {
  return {
    token_hash: String(row.token_hash),
    workspace_id: String(row.workspace_id),
    expires_at: String(row.expires_at),
    created_at: String(row.created_at)
  };
}

function fromSupabaseAdminSession(row: Record<string, unknown>): AdminSessionRow {
  return {
    token_hash: String(row.token_hash),
    expires_at: String(row.expires_at),
    created_at: String(row.created_at)
  };
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, value);
    }
  }
  return search.toString();
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase n'est pas configure.");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  headers.set("Authorization", `Bearer ${config.key}`);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }

  return response;
}

function sqliteListWorkspaces() {
  const database = getSqliteDatabase();
  const statement = database.prepare(`
    SELECT ${WORKSPACE_SELECT}
    FROM workspaces
    ORDER BY updated_at DESC, created_at DESC
  `);

  return statement.all() as WorkspaceRow[];
}

function sqliteGetWorkspaceById(id: string) {
  const database = getSqliteDatabase();
  const statement = database.prepare(`
    SELECT ${WORKSPACE_SELECT}
    FROM workspaces
    WHERE id = ?
    LIMIT 1
  `);

  return (statement.get(id) as WorkspaceRow | undefined) ?? null;
}

function sqliteCreateWorkspace(input: {
  id: string;
  name: string;
  passwordHash: string;
  data?: AppData;
}) {
  const database = getSqliteDatabase();
  const timestamp = new Date().toISOString();
  const data = input.data ?? getEmptyAppData(input.name);
  const payload = makeWorkspacePayload({
    ...data,
    gameName: input.name
  });

  const statement = database.prepare(`
    INSERT INTO workspaces (
      id,
      name,
      password_hash,
      workspace_json,
      document_count,
      character_count,
      plot_count,
      kraft_count,
      created_at,
      updated_at,
      archived_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  statement.run(
    input.id,
    input.name,
    input.passwordHash,
    payload.json,
    payload.documentCount,
    payload.characterCount,
    payload.plotCount,
    payload.kraftCount,
    timestamp,
    timestamp,
    null
  );

  return sqliteGetWorkspaceById(input.id);
}

function sqliteUpdateWorkspaceData(workspaceId: string, data: AppData) {
  const database = getSqliteDatabase();
  const existing = sqliteGetWorkspaceById(workspaceId);

  if (!existing) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const nextData = {
    ...data,
    gameName: existing.name
  };
  const payload = makeWorkspacePayload(nextData);
  const statement = database.prepare(`
    UPDATE workspaces
    SET
      workspace_json = ?,
      document_count = ?,
      character_count = ?,
      plot_count = ?,
      kraft_count = ?,
      updated_at = ?
    WHERE id = ?
  `);

  statement.run(
    payload.json,
    payload.documentCount,
    payload.characterCount,
    payload.plotCount,
    payload.kraftCount,
    timestamp,
    workspaceId
  );

  return sqliteGetWorkspaceById(workspaceId);
}

function sqliteRenameWorkspace(workspaceId: string, nextName: string) {
  const database = getSqliteDatabase();
  const existing = sqliteGetWorkspaceById(workspaceId);

  if (!existing) {
    return null;
  }

  const currentData = parseWorkspace(existing);
  const timestamp = new Date().toISOString();
  const nextData = {
    ...currentData,
    gameName: nextName
  };
  const payload = makeWorkspacePayload(nextData);
  const statement = database.prepare(`
    UPDATE workspaces
    SET
      name = ?,
      workspace_json = ?,
      document_count = ?,
      character_count = ?,
      plot_count = ?,
      kraft_count = ?,
      updated_at = ?
    WHERE id = ?
  `);

  statement.run(
    nextName,
    payload.json,
    payload.documentCount,
    payload.characterCount,
    payload.plotCount,
    payload.kraftCount,
    timestamp,
    workspaceId
  );

  return sqliteGetWorkspaceById(workspaceId);
}

function sqliteDeleteWorkspace(workspaceId: string) {
  const database = getSqliteDatabase();
  const statement = database.prepare("DELETE FROM workspaces WHERE id = ?");
  const result = statement.run(workspaceId);
  return result.changes > 0;
}

function sqliteArchiveWorkspace(workspaceId: string) {
  const database = getSqliteDatabase();
  const timestamp = new Date().toISOString();
  const statement = database.prepare(`
    UPDATE workspaces
    SET
      archived_at = ?,
      updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(timestamp, timestamp, workspaceId);
  return result.changes > 0 ? sqliteGetWorkspaceById(workspaceId) : null;
}

function sqliteRestoreWorkspace(workspaceId: string) {
  const database = getSqliteDatabase();
  const timestamp = new Date().toISOString();
  const statement = database.prepare(`
    UPDATE workspaces
    SET
      archived_at = NULL,
      updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(timestamp, workspaceId);
  return result.changes > 0 ? sqliteGetWorkspaceById(workspaceId) : null;
}

function sqliteUpdateWorkspacePasswordHash(workspaceId: string, passwordHash: string) {
  const database = getSqliteDatabase();
  const timestamp = new Date().toISOString();
  const statement = database.prepare(`
    UPDATE workspaces
    SET
      password_hash = ?,
      updated_at = ?
    WHERE id = ?
  `);

  const result = statement.run(passwordHash, timestamp, workspaceId);
  return result.changes > 0 ? sqliteGetWorkspaceById(workspaceId) : null;
}

function sqliteCreateSession(workspaceId: string, tokenHash: string, expiresAt: string) {
  const database = getSqliteDatabase();
  const timestamp = new Date().toISOString();
  const statement = database.prepare(`
    INSERT INTO sessions (token_hash, workspace_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);

  statement.run(tokenHash, workspaceId, expiresAt, timestamp);
}

function sqliteCreateAdminSession(tokenHash: string, expiresAt: string) {
  const database = getSqliteDatabase();
  const timestamp = new Date().toISOString();
  const statement = database.prepare(`
    INSERT INTO admin_sessions (token_hash, expires_at, created_at)
    VALUES (?, ?, ?)
  `);

  statement.run(tokenHash, expiresAt, timestamp);
}

function sqliteDeleteSession(tokenHash: string) {
  const database = getSqliteDatabase();
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

function sqliteDeleteAdminSession(tokenHash: string) {
  const database = getSqliteDatabase();
  database.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(tokenHash);
}

function sqliteDeleteExpiredSessions() {
  const database = getSqliteDatabase();
  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

function sqliteDeleteExpiredAdminSessions() {
  const database = getSqliteDatabase();
  database
    .prepare("DELETE FROM admin_sessions WHERE expires_at <= ?")
    .run(new Date().toISOString());
}

function sqliteGetSession(tokenHash: string) {
  sqliteDeleteExpiredSessions();

  const database = getSqliteDatabase();
  const statement = database.prepare(`
    SELECT ${SESSION_SELECT}
    FROM sessions
    WHERE token_hash = ?
    LIMIT 1
  `);

  return (statement.get(tokenHash) as SessionRow | undefined) ?? null;
}

function sqliteGetAdminSession(tokenHash: string) {
  sqliteDeleteExpiredAdminSessions();

  const database = getSqliteDatabase();
  const statement = database.prepare(`
    SELECT ${ADMIN_SESSION_SELECT}
    FROM admin_sessions
    WHERE token_hash = ?
    LIMIT 1
  `);

  return (statement.get(tokenHash) as AdminSessionRow | undefined) ?? null;
}

function sqliteWorkspaceNameExists(name: string, ignoreId?: string) {
  const database = getSqliteDatabase();
  const statement = database.prepare(`
    SELECT id
    FROM workspaces
    WHERE lower(name) = lower(?)
    LIMIT 1
  `);

  const existing = statement.get(name) as { id: string } | undefined;

  if (!existing) {
    return false;
  }

  return ignoreId ? existing.id !== ignoreId : true;
}

export async function listWorkspaces() {
  if (!isSupabaseEnabled()) {
    return sqliteListWorkspaces();
  }

  const query = buildQuery({
    select: WORKSPACE_SELECT,
    order: "updated_at.desc,created_at.desc"
  });
  const response = await supabaseFetch(`workspaces?${query}`);
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows.map(fromSupabaseWorkspace);
}

export async function getWorkspaceById(id: string) {
  if (!isSupabaseEnabled()) {
    return sqliteGetWorkspaceById(id);
  }

  const query = buildQuery({
    select: WORKSPACE_SELECT,
    id: `eq.${id}`,
    limit: "1"
  });
  const response = await supabaseFetch(`workspaces?${query}`);
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function getWorkspaceSummary(id: string) {
  const workspace = await getWorkspaceById(id);
  return workspace ? toSummary(workspace) : null;
}

export async function createWorkspace(input: {
  id: string;
  name: string;
  passwordHash: string;
  data?: AppData;
}) {
  if (!isSupabaseEnabled()) {
    return sqliteCreateWorkspace(input);
  }

  const timestamp = new Date().toISOString();
  const data = input.data ?? getEmptyAppData(input.name);
  const payload = makeWorkspacePayload({
    ...data,
    gameName: input.name
  });
  const query = buildQuery({ select: WORKSPACE_SELECT });
  const response = await supabaseFetch(`workspaces?${query}`, {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      id: input.id,
      name: input.name,
      password_hash: input.passwordHash,
      workspace_json: toSupabaseWorkspaceData({
        ...data,
        gameName: input.name
      }),
      document_count: payload.documentCount,
      character_count: payload.characterCount,
      plot_count: payload.plotCount,
      kraft_count: payload.kraftCount,
      created_at: timestamp,
      updated_at: timestamp,
      archived_at: null
    })
  });
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function updateWorkspaceData(workspaceId: string, data: AppData) {
  if (!isSupabaseEnabled()) {
    return sqliteUpdateWorkspaceData(workspaceId, data);
  }

  const existing = await getWorkspaceById(workspaceId);

  if (!existing) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const nextData = {
    ...data,
    gameName: existing.name
  };
  const payload = makeWorkspacePayload(nextData);
  const query = buildQuery({
    select: WORKSPACE_SELECT,
    id: `eq.${workspaceId}`
  });
  const response = await supabaseFetch(`workspaces?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      workspace_json: toSupabaseWorkspaceData(nextData),
      document_count: payload.documentCount,
      character_count: payload.characterCount,
      plot_count: payload.plotCount,
      kraft_count: payload.kraftCount,
      updated_at: timestamp
    })
  });
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function renameWorkspace(workspaceId: string, nextName: string) {
  if (!isSupabaseEnabled()) {
    return sqliteRenameWorkspace(workspaceId, nextName);
  }

  const existing = await getWorkspaceById(workspaceId);

  if (!existing) {
    return null;
  }

  const currentData = parseWorkspace(existing);
  const nextData = {
    ...currentData,
    gameName: nextName
  };
  const payload = makeWorkspacePayload(nextData);
  const timestamp = new Date().toISOString();
  const query = buildQuery({
    select: WORKSPACE_SELECT,
    id: `eq.${workspaceId}`
  });
  const response = await supabaseFetch(`workspaces?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      name: nextName,
      workspace_json: toSupabaseWorkspaceData(nextData),
      document_count: payload.documentCount,
      character_count: payload.characterCount,
      plot_count: payload.plotCount,
      kraft_count: payload.kraftCount,
      updated_at: timestamp
    })
  });
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function deleteWorkspace(workspaceId: string) {
  if (!isSupabaseEnabled()) {
    return sqliteDeleteWorkspace(workspaceId);
  }

  const query = buildQuery({ id: `eq.${workspaceId}` });
  await supabaseFetch(`workspaces?${query}`, { method: "DELETE" });
  return true;
}

export async function archiveWorkspace(workspaceId: string) {
  if (!isSupabaseEnabled()) {
    return sqliteArchiveWorkspace(workspaceId);
  }

  const timestamp = new Date().toISOString();
  const query = buildQuery({
    select: WORKSPACE_SELECT,
    id: `eq.${workspaceId}`
  });
  const response = await supabaseFetch(`workspaces?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      archived_at: timestamp,
      updated_at: timestamp
    })
  });
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function restoreWorkspace(workspaceId: string) {
  if (!isSupabaseEnabled()) {
    return sqliteRestoreWorkspace(workspaceId);
  }

  const timestamp = new Date().toISOString();
  const query = buildQuery({
    select: WORKSPACE_SELECT,
    id: `eq.${workspaceId}`
  });
  const response = await supabaseFetch(`workspaces?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      archived_at: null,
      updated_at: timestamp
    })
  });
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function updateWorkspacePasswordHash(workspaceId: string, passwordHash: string) {
  if (!isSupabaseEnabled()) {
    return sqliteUpdateWorkspacePasswordHash(workspaceId, passwordHash);
  }

  const timestamp = new Date().toISOString();
  const query = buildQuery({
    select: WORKSPACE_SELECT,
    id: `eq.${workspaceId}`
  });
  const response = await supabaseFetch(`workspaces?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      password_hash: passwordHash,
      updated_at: timestamp
    })
  });
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseWorkspace(rows[0]) : null;
}

export async function createSession(workspaceId: string, tokenHash: string, expiresAt: string) {
  if (!isSupabaseEnabled()) {
    sqliteCreateSession(workspaceId, tokenHash, expiresAt);
    return;
  }

  await supabaseFetch("sessions", {
    method: "POST",
    body: JSON.stringify({
      token_hash: tokenHash,
      workspace_id: workspaceId,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    })
  });
}

export async function createAdminSession(tokenHash: string, expiresAt: string) {
  if (!isSupabaseEnabled()) {
    sqliteCreateAdminSession(tokenHash, expiresAt);
    return;
  }

  await supabaseFetch("admin_sessions", {
    method: "POST",
    body: JSON.stringify({
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    })
  });
}

export async function deleteSession(tokenHash: string) {
  if (!isSupabaseEnabled()) {
    sqliteDeleteSession(tokenHash);
    return;
  }

  const query = buildQuery({ token_hash: `eq.${tokenHash}` });
  await supabaseFetch(`sessions?${query}`, { method: "DELETE" });
}

export async function deleteAdminSession(tokenHash: string) {
  if (!isSupabaseEnabled()) {
    sqliteDeleteAdminSession(tokenHash);
    return;
  }

  const query = buildQuery({ token_hash: `eq.${tokenHash}` });
  await supabaseFetch(`admin_sessions?${query}`, { method: "DELETE" });
}

export async function deleteExpiredSessions() {
  if (!isSupabaseEnabled()) {
    sqliteDeleteExpiredSessions();
    return;
  }

  const query = buildQuery({ expires_at: `lte.${new Date().toISOString()}` });
  await supabaseFetch(`sessions?${query}`, { method: "DELETE" });
}

export async function deleteExpiredAdminSessions() {
  if (!isSupabaseEnabled()) {
    sqliteDeleteExpiredAdminSessions();
    return;
  }

  const query = buildQuery({ expires_at: `lte.${new Date().toISOString()}` });
  await supabaseFetch(`admin_sessions?${query}`, { method: "DELETE" });
}

export async function getSession(tokenHash: string) {
  if (!isSupabaseEnabled()) {
    return sqliteGetSession(tokenHash);
  }

  await deleteExpiredSessions();
  const query = buildQuery({
    select: SESSION_SELECT,
    token_hash: `eq.${tokenHash}`,
    limit: "1"
  });
  const response = await supabaseFetch(`sessions?${query}`);
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseSession(rows[0]) : null;
}

export async function getAdminSession(tokenHash: string) {
  if (!isSupabaseEnabled()) {
    return sqliteGetAdminSession(tokenHash);
  }

  await deleteExpiredAdminSessions();
  const query = buildQuery({
    select: ADMIN_SESSION_SELECT,
    token_hash: `eq.${tokenHash}`,
    limit: "1"
  });
  const response = await supabaseFetch(`admin_sessions?${query}`);
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? fromSupabaseAdminSession(rows[0]) : null;
}

export function parseWorkspace(row: WorkspaceRow) {
  if (typeof row.workspace_json === "string") {
    return JSON.parse(row.workspace_json) as AppData;
  }

  return row.workspace_json;
}

export async function workspaceNameExists(name: string, ignoreId?: string) {
  if (!isSupabaseEnabled()) {
    return sqliteWorkspaceNameExists(name, ignoreId);
  }

  const loweredName = name.trim().toLowerCase();
  const workspaces = await listWorkspaces();
  return workspaces.some(
    (workspace) =>
      workspace.name.trim().toLowerCase() === loweredName &&
      (!ignoreId || workspace.id !== ignoreId)
  );
}

export function toWorkspaceSummary(row: WorkspaceRow) {
  return toSummary(row);
}
