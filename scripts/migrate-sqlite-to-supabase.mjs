import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

function loadEnvFile(filename) {
  const filepath = resolve(process.cwd(), filename);

  if (!existsSync(filepath)) {
    return;
  }

  const content = readFileSync(filepath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl =
  process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Variables Supabase manquantes. Renseigne NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY."
  );
}

const sqlitePath = resolve(process.cwd(), ".data", "hfgn.sqlite");

if (!existsSync(sqlitePath)) {
  throw new Error(`Base SQLite introuvable: ${sqlitePath}`);
}

const database = new DatabaseSync(sqlitePath);

function toJson(value) {
  return JSON.parse(value);
}

function fetchSupabase(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("apikey", supabaseKey);
  headers.set("Authorization", `Bearer ${supabaseKey}`);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers
  });
}

async function ensureOk(response, label) {
  if (response.ok) {
    return;
  }

  const detail = await response.text();

  if (response.status === 404 && detail.includes("PGRST205")) {
    throw new Error(
      `${label} a echoue: les tables Supabase ne sont pas encore creees. Execute d'abord supabase/schema.sql dans le SQL Editor.`
    );
  }

  throw new Error(`${label} a echoue (${response.status}): ${detail}`);
}

async function clearRemoteTables() {
  await ensureOk(
    await fetchSupabase("sessions?token_hash=not.is.null", { method: "DELETE" }),
    "Suppression des sessions"
  );
  await ensureOk(
    await fetchSupabase("admin_sessions?token_hash=not.is.null", { method: "DELETE" }),
    "Suppression des sessions admin"
  );
  await ensureOk(
    await fetchSupabase("workspaces?id=not.is.null", { method: "DELETE" }),
    "Suppression des workspaces"
  );
}

async function upsertRows(table, rows, conflictColumn) {
  if (!rows.length) {
    console.log(`${table}: rien a migrer`);
    return;
  }

  const response = await fetchSupabase(`${table}?on_conflict=${conflictColumn}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });

  await ensureOk(response, `Migration ${table}`);
  console.log(`${table}: ${rows.length} ligne(s) migree(s)`);
}

const workspaceRows = database
  .prepare(
    `SELECT id, name, password_hash, workspace_json, document_count, character_count,
            plot_count, kraft_count, created_at, updated_at, archived_at
     FROM workspaces`
  )
  .all()
  .map((row) => ({
    ...row,
    workspace_json: toJson(row.workspace_json)
  }));

const sessionRows = database
  .prepare("SELECT token_hash, workspace_id, expires_at, created_at FROM sessions")
  .all();

const adminSessionRows = database
  .prepare("SELECT token_hash, expires_at, created_at FROM admin_sessions")
  .all();

console.log("Preparation de la migration SQLite -> Supabase");
console.log(`workspaces: ${workspaceRows.length}`);
console.log(`sessions: ${sessionRows.length}`);
console.log(`admin_sessions: ${adminSessionRows.length}`);

await clearRemoteTables();
await upsertRows("workspaces", workspaceRows, "id");
await upsertRows("sessions", sessionRows, "token_hash");
await upsertRows("admin_sessions", adminSessionRows, "token_hash");

console.log("Migration terminee.");
