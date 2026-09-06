# Lessons Learned — JsDayCare / DayCarePortal

Lessons from building a production-grade daycare management SaaS with React + Vite + TypeScript + Supabase + Netlify.

---

## 1. Supabase API Key Types — Don't Confuse Them

### The mistake
Used the **Management API secret key** (`sb_secret_*` retrieved via the Supabase Management API) as the project data key. This key is for managing Supabase projects (creating/deleting projects) — not for reading/writing project data.

### What happened
- The key worked in Node.js (no browser restrictions) but returned 401 in the browser
- Supabase browsers block `sb_secret_*` keys with a "Forbidden use of secret API key in browser" error
- Even with explicit `Authorization: Bearer` headers and isolated auth sessions, the browser rejected it

### Key types — know the difference

| Key | Format | Use for | Browser? |
|---|---|---|---|
| Publishable key (project) | `sb_publishable_*` | All browser reads (RLS-enforced) | ✅ |
| Secret key (project) | `sb_secret_*` from **Project Settings → API** | Server-side only, bypasses RLS | ❌ |
| Management API key | `sb_secret_*` from **Management API** | Managing Supabase org/projects | ❌ |
| Legacy anon JWT | `eyJ...role:anon` | Browser reads (RLS-enforced) | ✅ |
| Legacy service_role JWT | `eyJ...role:service_role` | Server-side only | ❌ |

### The fix
Use **security-definer RPCs** in the database instead of a service key in the browser:
```sql
create or replace function my_cross_schema_read()
returns table (...) language plpgsql security definer set search_path = public
as $$ ... $$;
grant execute on function my_cross_schema_read() to authenticated;
```
The browser calls `supabase.rpc("my_cross_schema_read")` — no service key needed. RLS bypass happens server-side inside the function.

### Rule
**Never put a secret/service key in `VITE_*` env vars.** Vite bundles them into the client JS — anyone with browser DevTools can read them.

---

## 2. Service Key in Git History — Rotate Immediately

### The mistake
The Supabase service role JWT was hardcoded in `scripts/seed.js` and `e2e/checkin.spec.ts` and committed across 114 commits.

### What happened
Making the repo public would expose the key — anyone could use it to bypass all RLS and read/write/delete the entire database.

### The fix
1. **Rotate the JWT Secret** in Supabase → Settings → API → JWT Settings → Rotate. This immediately invalidates the old key.
2. Move all credentials to `.env` (gitignored): `SUPABASE_SECRET_KEY` (no VITE_ prefix — never expose secrets to the browser build)
3. Move test passwords to `.env`: `VITE_TEST_PASSWORD`, `VITE_TEST_PORTAL_PASSWORD`
4. Add a **CLAUDE.md** security gate that blocks credentials from being written to any tracked file

### Rule
Run `git log --all -p | grep "eyJ"` before making any repo public. If found — rotate the key first.

---

## 3. Netlify Serverless Functions Don't Run on Localhost

### The mistake
Moved user registration to a Netlify serverless function (`/api/register-user`) for security, but the local dev server (`npm run dev`) doesn't run Netlify Functions.

### What happened
Registration form froze at "Creating account..." — the fetch to `/api/register-user` returned 404 on localhost.

### The fix
Add a **Vite dev middleware** in `vite.config.ts` that mirrors the Netlify function for local development:
```ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), localRegisterPlugin(env)],
    // ...
  };
});

function localRegisterPlugin(env: Record<string, string>): Plugin {
  return {
    name: "local-register-user",
    configureServer(server) {
      server.middlewares.use("/api/register-user", async (req, res) => {
        // Node.js context — secret key allowed here
        const sbAdmin = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SECRET_KEY);
        // ... handle registration
      });
    },
  };
}
```
**Key insight:** `loadEnv(mode, cwd, "")` loads ALL `.env` vars (not just `VITE_*`) — use this in Vite plugins to access secret keys in server context without exposing them to the browser.

### Rule
For any Netlify Function, always add a local dev equivalent in `vite.config.ts`. Use `loadEnv` to access `.env` in the server context.

---

## 4. Foreign Key Constraints Will Block Deletions

### The mistake
Used simple `supabase.from("table").delete().eq("id", id)` for deletions. Multiple tables had `NO ACTION` foreign keys referencing the deleted record — causing FK violation errors.

### Tables that blocked deletions

| Deleted | FK violations in |
|---|---|
| User (profile) | `activities.created_by`, `attendance.created_by`, `nap_sleep_checks.checked_by`, `invitations.invited_by`, `forms.created_by`, `shared_files.created_by`, `audit_log.performed_by`, `form_submissions.submitted_by/reviewed_by` |
| School | `profiles.school_id`, `audit_log.school_id` (students need explicit delete) |
| Room | `students.homeroom_id`, `activities.room_id`, `attendance.room_id`, `staff_schedules.room_id`, `shared_files.room_id` |
| Student | `form_submissions.student_id`, `shared_files.student_id`, `sign_up_responses.student_id` |
| Contact | `attendance.checkin_contact_id`, `attendance.checkout_contact_id`, `sign_up_responses.contact_id` |

### The fix
Create **security-definer RPC functions** that nullify loose FK references before deleting:
```sql
create or replace function delete_room_safe(p_room_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update students        set homeroom_id = null where homeroom_id = p_room_id;
  update activities      set room_id     = null where room_id     = p_room_id;
  update attendance      set room_id     = null where room_id     = p_room_id;
  delete from rooms where id = p_room_id;
end;
$$;
```
Then call it from the app: `await supabase.rpc("delete_room_safe", { p_room_id: id })`

### Rule
Before any DELETE, run:
```sql
SELECT tc.table_name, kcu.column_name, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'your_table'
  AND rc.delete_rule = 'NO ACTION';
```
For every `NO ACTION` FK pointing at the table you're deleting, either add `ON DELETE SET NULL` to the migration, or nullify it in a security-definer RPC.

---

## 5. Defining React Components Inside Other Components

### The mistake
Defined a `Field` helper component inside the `AddStudent` component function:
```tsx
export default function AddStudent() {
  // ❌ WRONG — Field is re-created on every render
  const Field = ({ label, name }) => (
    <input value={form[name]} onChange={...} />
  );

  return <Field label="First Name" name="first_name" />;
}
```

### What happened
Every keystroke calls `setForm()` → AddStudent re-renders → `Field` is a new function reference → React unmounts old `<Field>`, mounts new one → **input loses focus after every character typed**.

### The fix
Move the helper component **outside** the parent component:
```tsx
// ✅ CORRECT — defined at module level, stable reference
function Field({ label, value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

export default function AddStudent() {
  return <Field label="First Name" value={form.first_name} onChange={v => set("first_name", v)} />;
}
```

### Rule
**Never define React components inside other React components.** Any capitalized function that returns JSX must be defined at module level (or imported), never inside another component function.

---

## 6. Supabase `.single()` Returns 406 When No Row Exists

### The mistake
Used `.single()` to fetch the current week's menu:
```ts
const { data } = await supabase
  .from("weekly_menus")
  .eq("school_id", id).eq("week_start", weekStart)
  .single(); // ❌ Returns 406 when no menu set for this week
```

### What happened
New schools with no menus triggered a 406 "Not Acceptable" error in the browser console on every page load.

### The fix
Use `.maybeSingle()` which returns `null` when no row exists (instead of 406):
```ts
const { data } = await supabase
  .from("weekly_menus")
  .eq("school_id", id).eq("week_start", weekStart)
  .maybeSingle(); // ✅ Returns null when no row — no error
```

### Rule
Use `.single()` only when you're certain a row exists (e.g. fetching by primary key after insert). Use `.maybeSingle()` for optional/conditional queries.

---

## 7. @supabase/supabase-js Crashes in Playwright Node.js Context

### The mistake
Imported `createClient` from `@supabase/supabase-js` directly in Playwright spec files to make DB verification calls.

### What happened
The `@supabase/auth-js` package uses WebAuthn browser APIs (`navigator.credentials`, `crypto.subtle`) that don't exist in Node.js — causing `Unexpected module status 3` crash in the test runner.

### The fix
Create a **lightweight raw fetch helper** for e2e tests that calls Supabase REST directly:
```ts
// e2e/helpers/supabase-admin.ts
const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

export async function select(table: string, filter: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, { headers });
  return await res.json();
}
export async function rpc(fn: string, params: Record<string, unknown>) {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers, body: JSON.stringify(params),
  });
  return await res.json();
}
```

### Rule
Never import `@supabase/supabase-js` in Playwright spec files or any Node.js-only context. Use raw `fetch` to Supabase's REST API instead.

---

## 8. RLS Blocks Portal Admin Cross-School Reads

### The context
Portal admin has `school_id = null` in their profile. All RLS policies use `get_my_school_id()` which returns `null` for portal admin — blocking all data reads across schools.

### The fix
Use **security-definer RPCs** for all cross-school reads. The portal admin can call these via the anon client since `grant execute ... to authenticated` allows any logged-in user to invoke them:
```sql
create or replace function get_all_schools_with_stats()
returns table (id uuid, name text, total_students bigint, active_students bigint, ...)
language plpgsql security definer set search_path = public
as $$ select s.id, s.name, count(st.*), ... from schools s left join students st ... $$;
```

### Benefit
Zero service key needed in the browser for portal admin reads. All sensitive data access is controlled by the RPC's internal logic, not by trusting the client.

---

## 9. Pre-Commit Security Gate

### What we built
A `CLAUDE.md` project file and a memory rule that acts as a first-gate check before writing any code:

**Block and ask to double-confirm if content contains:**
- API keys/JWTs (`eyJ...`)
- Passwords (hardcoded strings)
- Personal email addresses
- Local filesystem paths (`/Users/...`)
- Database connection strings with credentials

**Never trust "yes include it"** — ask twice if a credential is about to be committed.

### Implementation
- `CLAUDE.md` — project-level instructions loaded every Claude Code session
- `.githooks/pre-push` — warns if `src/` changed but `docs/` not updated

---

## 10. Netlify Functions Crash on Node 20 with Supabase JS v2

### The mistake
`netlify.toml` had `NODE_VERSION = "20"`. Supabase JS v2 calls `new WebSocket()` in the `SupabaseClient` constructor to init the realtime module — even when realtime is never used.

### What happened
Every call to `createClient()` inside the Netlify function threw:
> `Node.js detected but native WebSocket not found. Ensure you are running Node.js 22+`

Registration failed immediately with a 500 error. The error was confusing because it appeared in the Netlify function even though realtime was never explicitly used.

### The fix
Upgrade to Node 22 in `netlify.toml`:
```toml
[build.environment]
  NODE_VERSION = "22"
```
Node 22 ships native `WebSocket` — no polyfill needed.

### Rule
Always set `NODE_VERSION = "22"` (or higher) in `netlify.toml` when using Supabase JS v2 in serverless functions. Node 18 and 20 lack native WebSocket.

---

## 11. VITE_ Prefix Exposes Secrets in Browser Bundle

### The mistake
Created a `supabaseAdmin.ts` in `src/lib/` that read `import.meta.env.VITE_SUPABASE_SECRET_KEY`. Even though the client was never actually used in production code, Vite replaces all `import.meta.env.VITE_*` references at build time with their actual values.

### What happened
The `sb_secret_...` key was baked into the browser JS bundle — visible to anyone with DevTools → Sources → search.

### The fix
1. Delete any file in `src/` that reads `import.meta.env.VITE_SUPABASE_SECRET_KEY`
2. All admin operations must go through Netlify serverless functions using `process.env.SUPABASE_SECRET_KEY` (no VITE_ prefix)
3. In Netlify env vars, set `SUPABASE_SECRET_KEY` (not `VITE_SUPABASE_SECRET_KEY`) — Netlify only exposes `VITE_*` vars to the Vite build

### Detection
```bash
npm run build && grep -r "sb_secret_[A-Za-z0-9_-]\{20,\}" dist/
```
If this returns anything, a real key is in the bundle.

### Rule
**VITE_ prefix = browser-visible.** Never give a secret key a VITE_ prefix. Secrets belong in serverless functions only, accessed via `process.env.SECRET_NAME`.

---

## 12. Email Is Not a Reliable Primary Key for User Lookup

### The context
Parents can register with a User ID only (no real email). The system assigns them an internal email `loginid@daycareportal.internal`. Contacts pre-created by admins have a real email but the registered parent's auth email is the internal one.

### What happened
- `get_my_student_ids()` used `WHERE email = auth.email()` → failed for User-ID-only parents
- `ParentPortal.fetchChildren()` used `eq("email", user.email)` → returned 0 rows for Arif (his contact had no email)
- Parent portal showed "No children linked" despite the student existing

### The fix
1. Add `profile_id uuid` column to `student_contacts` — set on registration via invite
2. Update `get_my_student_ids()` to match by `profile_id = auth.uid()` first, fall back to email only for pre-migration contacts
3. Update all queries to use `profile_id` as the primary lookup, email as fallback

```sql
select student_id from student_contacts where profile_id = auth.uid()
union
select student_id from student_contacts where email = auth.email() and email is not null
```

### Rule
Use UUIDs (profile/user IDs) as database join keys — never email. Email is user-entered, optional, and mutable. UUID is system-assigned and stable.

---

## Summary Table

| # | Issue | Root Cause | Fix |
|---|---|---|---|
| 1 | 401 in browser with secret key | Wrong key type (Management API vs project) | Use project secret key; move to server-side |
| 2 | Service key in git history | Hardcoded in committed files | Rotate immediately; use `.env` + security gate |
| 3 | Registration hangs on localhost | Netlify Function not available in dev | Vite middleware mirrors the function locally |
| 4 | FK violation on delete | `NO ACTION` FK constraints | Security-definer RPC nullifies refs before delete |
| 5 | Focus lost on every keystroke | Component defined inside component | Move to module level |
| 6 | 406 on empty menu week | `.single()` errors when no row | Use `.maybeSingle()` |
| 7 | Playwright crash importing supabase-js | WebAuthn browser API in Node.js | Raw fetch helper for e2e tests |
| 8 | Portal admin sees 0 students | RLS blocks `school_id = null` user | Security-definer RPCs for cross-school reads |
| 9 | Credentials in repo | No pre-commit gate | `CLAUDE.md` + git hook |
| 10 | Netlify function crashes on Node 20 | Supabase JS v2 needs native WebSocket (Node 22+) | Set `NODE_VERSION = "22"` in `netlify.toml` |
| 11 | Secret key in browser bundle | `VITE_SUPABASE_SECRET_KEY` in `src/` file | Remove; secrets only in serverless functions via `process.env` |
| 12 | Parent portal shows "No children" | Email used as join key; optional for User-ID-only users | Add `profile_id` UUID column; use it as primary key |

---

## Test Coverage Map

Every lesson has at least one automated regression TC:

| Lesson | TC ID(s) | Spec file |
|---|---|---|
| 1 — Wrong key type (portal admin 0 counts) | `TC-lesson1-portal-admin-student-counts` | `regression-lessons.spec.ts` |
| 2 — Service key in git history | `TC-lesson9-no-service-key-in-bundle` | `regression-lessons.spec.ts` |
| 3 — Registration hangs on localhost | `TC-lesson3-register-endpoint-reachable`, `TC-register-school-admin`, `TC-register-staff`, `TC-register-parent` | `regression-lessons.spec.ts`, `registration-flows.spec.ts` |
| 4 — FK violations on delete | `TC-lesson4-delete-room-safe-rpc`, `TC-lesson4-delete-portal-user-no-fk-error`, `TC-delete-student-rpc-no-fk-error`, `TC-portal-users-delete-rpc-no-column-errors` | `regression-lessons.spec.ts`, `delete-scenarios.spec.ts`, `portal-admin-manage.spec.ts` |
| 5 — Focus lost on every keystroke | `TC-lesson5-add-student-no-focus-loss` | `regression-lessons.spec.ts` |
| 6 — `.single()` returns 406 | `TC-lesson6-menus-no-406-empty-week`, `TC-lesson6-portal-students-no-406` | `regression-lessons.spec.ts` |
| 7 — @supabase/supabase-js crash in Node | Prevented by using `e2e/helpers/supabase-admin.ts` (raw fetch) in all specs | `registration-flows.spec.ts` |
| 8 — RLS blocks portal admin | `TC-lesson1-portal-admin-student-counts`, `TC-portal-schools-active-students-badge` | `regression-lessons.spec.ts`, `portal-admin-manage.spec.ts` |
| 9 — Credentials in repo | `TC-lesson9-no-service-key-in-bundle` | `regression-lessons.spec.ts` |
