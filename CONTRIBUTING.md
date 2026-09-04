# Contributing to JsDayCare (DayCarePortal)

## Architecture Overview

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase (PostgreSQL + Auth + Storage)  
**Hosting:** Netlify (frontend + serverless functions) + Supabase (ap-south-1 region)  
**Testing:** Playwright e2e (250 tests), enforced via pre-push git hook

```
Browser (React SPA)
    │
    ├── Supabase JS client (anon key — safe to expose, RLS enforced)
    │       └── PostgreSQL with Row Level Security
    │
    └── /api/register-user (Netlify serverless function)
            └── Supabase service role key (server-side only, never in browser)
```

---

## How it's hosted

### Frontend — Netlify
- **Build:** `npm run build` → `dist/` published to Netlify CDN
- **SPA routing:** `netlify.toml` has `/* → /index.html 200` redirect so React Router works on refresh
- **Branch deploys:** Every push to `main` triggers a Netlify deploy
- **Domain:** Configured in Netlify dashboard

### Serverless function — Netlify Functions
- `netlify/functions/register-user.ts` handles user account creation
- Runs Node.js 20 on Netlify's edge, has access to server-only env vars
- Called from `Register.tsx` via `POST /api/register-user`
- This is how the Supabase service role key is kept server-side (never in browser)

### Database — Supabase (ap-south-1)
- PostgreSQL with Row Level Security (RLS) on every table
- Security-definer functions for cross-school operations
- Auth: JWT tokens, no email verification (admin API creates users)
- Storage: `avatars` bucket for contact/staff photos

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Netlify + local `.env` | Supabase project URL (safe to expose) |
| `VITE_SUPABASE_ANON_KEY` | Netlify + local `.env` | Supabase anon key (RLS-enforced, safe) |
| `VITE_SUPABASE_SERVICE_KEY` | Local `.env` only | Service key for PortalAdmin cross-school queries (not needed for production users) |
| `SUPABASE_SERVICE_KEY` | Netlify server env only | Service key for serverless function (NEVER in browser) |

> ⚠️ Never commit `.env` to git. It is gitignored.

---

## Local setup

```bash
git clone https://github.com/naatu-paakam/jsdaycare.git
cd jsdaycare
npm install          # installs deps AND runs `prepare` → sets git hooksPath to .githooks/
cp .env.example .env # fill in Supabase credentials (see .notes for dev credentials)
npm run dev          # starts Vite dev server on http://localhost:5174
```

### Run e2e tests
```bash
# Dev server must be running first
npm run dev &
node_modules/.bin/playwright test
```

---

## Git Hooks (pre-push)

The `prepare` script in `package.json` runs after `npm install` and sets `core.hooksPath = .githooks/`. Every contributor gets the same hooks automatically — no manual setup.

The pre-push hook does 4 things (in order):
1. ✅ **Dev server check** — blocks if localhost:5174 is not running
2. ✅ **Run all Playwright tests** — blocks push if any test fails (~250 tests, ~30 min)
3. 🧹 **Purge test data** — deletes TC-* students/food/invitations from DB
4. ⚠️ **Doc reminder** — warns if `src/` changed but `docs/` was not updated

To manually re-install hooks after a fresh clone:
```bash
npm run prepare
```

---

## Project structure

```
src/
├── components/        # Shared UI (Layout, Sidebar, InviteDialog…)
├── lib/               # supabase client, auth context, types
├── pages/
│   ├── auth/          # Login, Register
│   ├── home/          # Admin dashboard
│   ├── students/      # Student list + profile (5 tabs)
│   ├── rooms/         # Room list + detail (check-in, activities)
│   ├── staff/         # Staff list + profile
│   ├── parent/        # Parent portal (home + check-in)
│   ├── portal/        # Portal admin (schools + users management)
│   ├── menus/         # Weekly menu + food library
│   ├── calendar/      # Holiday calendar + operating hours
│   ├── schedule/      # Staff + student schedules
│   ├── settings/      # School settings (name, address, QR code)
│   └── stories/       # Stories (R1 stub)
netlify/
└── functions/
    └── register-user.ts   # Server-side user creation (service key here)
supabase/
└── migrations/            # All schema + RLS migrations
e2e/                       # Playwright specs
docs/
├── guides/                # User guides per persona
├── features/              # Feature specs
└── releases/              # MVP + R1 scope docs
```

---

## 4 personas

| Role | Login | Access |
|---|---|---|
| Portal Admin | portal@daycareportal.com | All schools + users management |
| School Admin | admin@jsdaycare.com | Full school access |
| Staff/Teacher | teacher@jsdaycare.com | Students, rooms, activities (no admin settings) |
| Parent | parent@jsdaycare.com | Own children, check-in, menus, calendar |

See `docs/guides/` for per-persona user guides and `docs/personas.md` for permissions tables.
