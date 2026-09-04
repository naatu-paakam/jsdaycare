/**
 * Netlify serverless function: register-user
 *
 * Handles user registration using the Supabase service role key — server-side only.
 * The SUPABASE_SECRET_KEY env var is set in Netlify's server environment and is
 * NEVER exposed to the browser.
 *
 * POST /api/register-user
 * Body: { loginId, firstName, lastName, email, phone, password, invitationToken, schoolId, role, permanent }
 * Returns: { success: true } | { error: string }
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!; // server-only, NOT VITE_ prefixed

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Validate origin (basic CSRF protection)
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = [
    "http://localhost:5174",
    "http://localhost:5173",
    process.env.URL ?? "",          // Netlify site URL
    process.env.DEPLOY_PRIME_URL ?? "", // Netlify deploy preview URL
  ].filter(Boolean);

  if (!allowedOrigins.some(o => origin.startsWith(o))) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  if (!SUPABASE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Registration service unavailable" }), { status: 503 });
  }

  const { loginId, firstName, lastName, email, phone, password, invitationToken, schoolId, role, permanent } = await req.json();

  if (!loginId || !firstName || !lastName || !password || !schoolId || !role) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const supabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

  // Determine auth email
  const authEmail = email?.trim() || `${loginId.trim().toLowerCase()}@daycareportal.internal`;
  const fullName  = `${firstName.trim()} ${lastName.trim()}`;

  // 1. Create auth user (no email verification)
  const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: phone?.trim() ?? null },
  });

  if (createErr) {
    const msg = createErr.message.includes("already been registered")
      ? "This User ID or email is already taken. Please choose another."
      : createErr.message;
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }

  const userId = newUser.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Account creation failed" }), { status: 500 });
  }

  // 2. Create profile
  await supabaseAdmin.from("profiles").upsert({
    id: userId, school_id: schoolId, role, full_name: fullName,
    phone: phone?.trim() || null, login_id: loginId.trim().toLowerCase(),
  }, { onConflict: "id" });

  // 3. Add to school_memberships
  await supabaseAdmin.from("school_memberships").upsert({
    profile_id: userId, school_id: schoolId, role,
  }, { onConflict: "profile_id,school_id" });

  // 4. Mark invitation as used (non-permanent only)
  if (!permanent && invitationToken) {
    await supabase.rpc("use_invitation", { p_token: invitationToken });
  }

  return new Response(JSON.stringify({ success: true, userId, authEmail }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/register-user" };
