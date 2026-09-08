/**
 * Netlify serverless function: create-school-invite
 *
 * Creates a new school + permanent admin invitation.
 * Uses SUPABASE_SECRET_KEY (server-only, never VITE_ prefixed).
 *
 * POST /api/create-school-invite
 * Body: { schoolName, adminEmail, adminPhone }
 * Returns: { success: true, token: string } | { error: string }
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL        = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
const TURNSTILE_SECRET    = process.env.TURNSTILE_SECRET_KEY;

const ALLOWED_ORIGINS = [
  "https://usdaycare.netlify.app",
  "http://localhost:5174",
  "http://localhost:5173",
];

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = { "Content-Type": "application/json", ...corsHeaders(origin) };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  if (!SUPABASE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "School creation service unavailable" }),
      { status: 503, headers }
    );
  }

  let body: { schoolName?: string; adminEmail?: string; adminPhone?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers });
  }

  // Verify Turnstile token (skip if secret not configured, e.g. local dev)
  if (TURNSTILE_SECRET) {
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${TURNSTILE_SECRET}&response=${body.turnstileToken ?? ""}`,
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success || (verifyData.action && verifyData.action !== "signup")) {
      return new Response(
        JSON.stringify({ error: "Bot check failed. Please try again." }),
        { status: 400, headers }
      );
    }
  }

  const { schoolName, adminEmail, adminPhone } = body;

  if (!schoolName?.trim() || !adminEmail?.trim() || !adminPhone?.trim()) {
    return new Response(
      JSON.stringify({ error: "School name, admin email, and admin phone are all required." }),
      { status: 400, headers }
    );
  }

  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Create the school
  const { data: school, error: schoolErr } = await sbAdmin
    .from("schools")
    .insert({ name: schoolName.trim(), timezone: "America/Los_Angeles" })
    .select("id")
    .single();

  if (schoolErr || !school) {
    console.error("School insert error:", schoolErr);
    return new Response(
      JSON.stringify({ error: schoolErr?.message ?? "Failed to create school." }),
      { status: 500, headers }
    );
  }

  // 2. Create permanent admin invitation
  // invited_by is nullable; expires_at is set to null for permanent invites
  const { data: invitation, error: invErr } = await sbAdmin
    .from("invitations")
    .insert({
      school_id: school.id,
      role: "admin",
      email: adminEmail.trim(),
      permanent: true,
      expires_at: null,
      invited_by: null,
      metadata: { phone: adminPhone.trim() },
    })
    .select("token")
    .single();

  if (invErr || !invitation) {
    console.error("Invitation insert error:", invErr);
    // Clean up the school we just created
    await sbAdmin.from("schools").delete().eq("id", school.id);
    return new Response(
      JSON.stringify({ error: invErr?.message ?? "Failed to create invitation." }),
      { status: 500, headers }
    );
  }

  return new Response(
    JSON.stringify({ success: true, token: invitation.token }),
    { status: 200, headers }
  );
};

export const config = { path: "/api/create-school-invite" };
