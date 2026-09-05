import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Connect, Plugin } from "vite";

// Local dev handler for /api/register-user (mirrors the Netlify function)
// Uses Node.js where sb_secret_* key is allowed (not blocked by browser security)
function localRegisterPlugin(env: Record<string, string>): Plugin {
  return {
    name: "local-register-user",
    configureServer(server) {
      server.middlewares.use(
        "/api/register-user",
        async (req: Connect.IncomingMessage, res: any, next: () => void) => {
          if (req.method !== "POST") { next(); return; }

          const chunks: Buffer[] = [];
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const { createClient } = await import("@supabase/supabase-js");
              const SUPABASE_URL      = env.VITE_SUPABASE_URL;
              const SUPABASE_SEC_KEY  = env.VITE_SUPABASE_SECRET_KEY;

              if (!SUPABASE_SEC_KEY) {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "VITE_SUPABASE_SECRET_KEY not set in .env" }));
                return;
              }

              const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SEC_KEY, {
                auth: { autoRefreshToken: false, persistSession: false },
              });
              const sbAnon = createClient(SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

              const { loginId, firstName, lastName, email, phone, password,
                      invitationToken, schoolId, role, permanent } = body;

              const authEmail = email?.trim() || `${loginId.trim().toLowerCase()}@daycareportal.internal`;
              const fullName  = `${firstName.trim()} ${lastName.trim()}`;

              const { data: newUser, error: createErr } = await sbAdmin.auth.admin.createUser({
                email: authEmail, password, email_confirm: true,
                user_metadata: { full_name: fullName, phone: phone?.trim() ?? null },
              });

              if (createErr) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: createErr.message.includes("already been registered")
                  ? "This User ID or email is already taken." : createErr.message }));
                return;
              }

              const userId = newUser.user?.id;
              await sbAdmin.from("profiles").upsert({
                id: userId, school_id: schoolId, role, full_name: fullName,
                phone: phone?.trim() || null, login_id: loginId.trim().toLowerCase(),
              }, { onConflict: "id" });
              await sbAdmin.from("school_memberships").upsert({
                profile_id: userId, school_id: schoolId, role,
              }, { onConflict: "profile_id,school_id" });
              if (!permanent && invitationToken) {
                await sbAnon.rpc("use_invitation", { p_token: invitationToken });
              }

              // If invite had a contact_id in metadata, update that contact's email
              // so ParentPortal can find their children via student_contacts.email lookup
              const { body: invBody } = await new Promise<{body: any}>((resolve) => {
                let rawBody = "";
                resolve({ body: JSON.parse(JSON.stringify({ loginId, firstName, lastName, email, phone, password, invitationToken, schoolId, role, permanent })) });
              });
              // Re-fetch the invitation to get metadata.contact_id
              const { data: invRecord } = await sbAdmin.from("invitations")
                .select("metadata").eq("token", invitationToken ?? "").maybeSingle();
              const contactId = (invRecord?.metadata as any)?.contact_id;
              if (contactId && userId) {
                // Link the contact to the new profile via profile_id (most reliable key)
                await sbAdmin.from("student_contacts")
                  .update({ profile_id: userId, portal_status: "signed_up" })
                  .eq("id", contactId);
              }

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, userId, authEmail }));
            } catch (e: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        }
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
  server: {
    host: "::",
    port: 5174,
  },
  build: {
    outDir: "dist",
  },
  plugins: [react(), localRegisterPlugin(env)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
