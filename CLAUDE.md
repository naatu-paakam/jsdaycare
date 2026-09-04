# JsDayCare — Claude Code Instructions

## 🔴 SECURITY GATE — Check FIRST on every file write or commit

Before writing ANY content to any tracked file, verify it does NOT contain:

- **API keys / JWT tokens** (`eyJ...`) — use `.env` variables instead
- **Passwords** — never hardcode; reference `.notes` (gitignored) or env vars
- **Personal email addresses** (e.g. @gmail.com) — use generic placeholders
- **Local filesystem paths** (e.g. `/Users/pavan.kumar.bijjala/...`)
- **Database connection strings with credentials inline**
- **Real people's names as hardcoded test data**

If any of the above is detected: **STOP and ask the user to double-confirm**, explaining it will be permanently visible in git history.

Even if the user says "yes include it" — ask a **second time** before proceeding.

---

## Rules (applied every session)

1. **Security gate** — above, every file write
2. **Test before push** — run Playwright tests before every push (pre-push hook enforces this)
3. **Test coverage** — every new feature/bug needs a TC- test case in the same commit
4. **Impact analysis** — before closing a task, surface ripple changes (e2e, docs, types, RLS, guides) and ask user to apply
5. **User guide updates** — when src/ changes, update the relevant docs/guides/ file
6. **No test credentials in repo** — seed.js and e2e files must read credentials from `.env`

---

## Stack
React 18 + Vite + TypeScript + Tailwind + Supabase + Playwright + Netlify

## Dev server
`npm run dev` → http://localhost:5174

## Test suite
`node_modules/.bin/playwright test` (~250 tests, ~30 min)

## Credentials
All credentials are in `.notes` (gitignored). Never commit them.
