/**
 * Lightweight Supabase admin helper for Playwright tests.
 * Uses raw fetch to avoid @supabase/supabase-js WebAuthn browser-API crash in Node.js.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const SB_URL = process.env.VITE_SUPABASE_URL ?? "";
const SB_KEY = process.env.VITE_SUPABASE_SECRET_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  Prefer: "return=representation",
};

/** Insert a row and return it */
export async function insert(table: string, data: Record<string, unknown>) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(data),
  });
  const rows = await res.json();
  if (!res.ok) throw new Error(`insert ${table}: ${JSON.stringify(rows)}`);
  return Array.isArray(rows) ? rows[0] : rows;
}

/** Select rows with a filter */
export async function select(table: string, filter: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, { headers });
  const rows = await res.json();
  if (!res.ok) throw new Error(`select ${table}: ${JSON.stringify(rows)}`);
  return rows as Record<string, unknown>[];
}

/** Delete rows matching a filter */
export async function remove(table: string, filter: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, { method: "DELETE", headers });
  if (!res.ok) { const b = await res.text(); throw new Error(`delete ${table}: ${b}`); }
}

/** Call a security-definer RPC */
export async function rpc(fn: string, params: Record<string, unknown>) {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers, body: JSON.stringify(params),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`rpc ${fn}: ${JSON.stringify(body)}`);
  return body;
}

/** Delete an auth user via admin API */
export async function deleteAuthUser(userId: string) {
  const res = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) { const b = await res.text(); console.warn(`deleteAuthUser ${userId}:`, b); }
}

/** List auth users */
export async function listAuthUsers(): Promise<{ id: string; email: string }[]> {
  const res = await fetch(`${SB_URL}/auth/v1/admin/users`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  const body = await res.json();
  return body.users ?? [];
}
