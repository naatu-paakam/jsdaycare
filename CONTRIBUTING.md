# Contributing

## Setup

```bash
git clone https://github.com/naatu-paakam/jsdaycare.git
cd jsdaycare
npm install          # installs deps AND runs `prepare` → sets git hooksPath to .githooks/
cp .env.example .env # fill in Supabase credentials
npm run dev
```

## Git Hooks (pre-push)

The `prepare` script in `package.json` runs automatically after `npm install` and configures git to use the hooks in `.githooks/` (committed to the repo). This means **every contributor gets the same hooks** without any manual setup.

The `pre-push` hook does 4 things:
1. ✅ Checks the dev server is running on port 5174
2. ✅ Runs the full Playwright e2e test suite (~250 tests)
3. 🧹 Purges TC-* test data from the Supabase DB
4. ⚠️ Warns if `src/` changed but `docs/` was not updated

To manually install hooks without `npm install`:
```bash
npm run prepare
```

## Test credentials
See `.notes` (gitignored) for test user credentials.
