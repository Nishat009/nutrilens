# Changelog

All notable changes to NutriLens. Format: [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/).

## [1.0.9] - 2026-11-04
Fixes from audit run #1844 (version 1.0.8).

### Security
- **Access-control matrix test.** New `server/tests/route-guards.test.js` walks all 51 Express routes and fails if a non-public route lacks `requireAuth`, an admin route lacks `requireAdmin`, an admin write lacks `blockDemoWrites`, a profile route lacks `requireSelf`, or a public route mutates data. Every route file now states its access policy in a header comment. Full matrix in the new [SECURITY.md](SECURITY.md).
- **Cross-user tests.** `e2e-smoke.js` (now 56 checks) proves a second member cannot read or delete another member's meal, planner slot or scan, a member cannot create foods, the demo admin cannot change roles or edit vegetables, and unknown routes return 404.
- **Token revocation.** Tokens carry the user's `tokenVersion`; new `POST /api/auth/logout-all` increments it and every older token returns 401. `User.tokenVersion` added (and `users.token_version` in `schema.sql`).
- `verifyToken` checks the signature length before `timingSafeEqual`. Token lifetime is the named setting `JWT_TTL_SECONDS` (default 7 days). New `server/tests/auth-token.test.js`.
- **CORS restricted** to `CORS_ORIGINS` (default `http://localhost:3000` in development, none in production). `render.yaml` sets the Vercel URL.
- **Error status codes.** Unknown routes return 404 (was 422). The global handler uses the error's own status (400 bad JSON, 413 too large), 422 for validation, and 500 with a generic message for unexpected errors (was 422 with the raw message).
- **Demo admin privacy.** The shared demo admin sees real (non-demo) members with masked name and email and no health data, and `GET /api/admin/users/:id` returns 403 for a real member. Writes stay blocked.
- `GET /api/diets/recommendations` no longer falls back to anonymous defaults.
- `POST /api/scans` copies only known scan fields (was `...req.body`).
- `server/.env.example`: `DEMO_MODE` is empty by default (on in development, off in production) with a warning never to enable it on a server with real members. `JWT_SECRET` and `MONGODB_URI` are marked **REQUIRED**. `DEPLOYMENT.md` and `render.yaml` carry the same warning.
- Test scripts generate passwords at runtime (`test-user-persistence.js`, `e2e-smoke.js`); no password-like literal is committed.

### Database
- `GET /api/scans` is paginated (`page`, `limit` ≤ 50) and leaves the photo out (`.select('-imageUrl')`, `.lean()`); `GET /api/scans/:id` still returns it.
- Scan and meal photos are capped at `MAX_SCAN_IMAGE_BYTES` (3 MB) with a clear 422 message; the JSON body limit is `BODY_LIMIT` (5mb, was 10mb). Camera captures are downscaled to 1024 px like uploads.
- `GET /api/diets/:slug` looks up only indexed fields (`slug`, `id`); names resolve through the built-in catalogue.
- `npm run db:migrate` diffs indexes first. In production it creates missing indexes but only lists stale ones until re-run with `--confirm`.
- New `server/scripts/check-schema-docs.js`, run by `npm run build`: fails when `database/schema.sql` is missing a model or field. README states the SQL is reference only.

### Changed
- Deployment settings (CORS origins, body and photo limits, token lifetime, 503 message) moved to `server/src/config/app.js`, read from env.
- New `sumNutrients()` (`server/src/utils/nutrients.js`) replaces the five repeated `reduce` calls in the scan and meal controllers.
- `register` no longer hard-codes demo body values; unset fields take the User model defaults until onboarding.
- One `refreshDemoSafely()` helper replaces the copied catch block in `login` and `demoLogin`.
- Removed the `/api/scan` alias; `/api/scans` is the single mount path (web rewrite removed too).
- Root `npm run build` now builds both projects (same as `npm run check`).
- `web/tsconfig.tsbuildinfo` removed from git; `*.tsbuildinfo` is ignored.
- `express-rate-limit` 7.5.1 → 8.7.3.
- HowToSetup.md: tested MongoDB versions (7.0, 8.0), a required-variables table, `NEXT_PUBLIC_API_URL` required for the web build, and the no-database checks (`npm run check`, `test:unit`).

**`npm audit` (2026-11-04):** root 0. `server/` 0 (dev `minimatch` fixed by an override). `web/` 0 production; 14 moderate dev-only (`minimatch` in the ESLint toolchain). No critical or high. Details in SECURITY.md.

## [1.0.7] - 2026-11-04
Fixes from audit run #1841.

### Security
- **No demo password in code, bundle or docs.** Removed the `Demo@1234` / `Admin@1234` fallbacks from `server/src/services/demo-accounts.js`, `web/src/lib/constants`, `e2e-smoke.js`, `verify-live.js`, `CLAUDE.md`, `README.md`, `HowToSetup.md` and `database/seed.sql`. The `NEXT_PUBLIC_DEMO_*_PASSWORD` variables were removed.
- New `POST /api/auth/demo-login` (`{ role: 'user' | 'admin' }`). The one-click buttons use it, so the browser never sends or stores a demo credential. It returns 404 when demo mode is off. `DEMO_MEMBER_PASSWORD` / `DEMO_ADMIN_PASSWORD` are optional; when unset a random password is generated on each start.
- `DEMO_MODE` is now **off by default when `NODE_ENV=production`**; set `DEMO_MODE=true` to run a live demo (`render.yaml` does).
- `requireAuth` no longer loads the password hash into `req.user`. Auth failures return **401**, and role, ownership and demo-write denials return **403** (they were 422). Validation errors stay 422.
- Login and register accept the email only as a string, trimmed and lowercased, so `{"$ne":null}` can't be used as a query operator. Duplicate sign-ups are caught by the unique index (error 11000) instead of a racy `findOne` check.
- Added `helmet` 8.1.0 (security headers) and `express-rate-limit` 7.5.1: 1000 requests per 15 minutes per IP on `/api`, and 30 per 15 minutes on register, login and demo-login.
- Learned visual matches (`POST /api/scans/teach`, `GET /api/scan/learned`) are now scoped to the caller (`LearnedFoodMatch.userId`). Before this, any member could overwrite or read another member's matches.
- Removed the unused, unauthenticated Next.js route handlers `web/src/app/api/scan` and `web/src/app/api/scan/analyze`. Scans go through the authenticated Express API only.

### Verified (no change needed)
- `meal`, `planner` and `scan` controllers already filter `/:id` reads and deletes by `{ _id, userId: req.user._id }` and return "not found" otherwise.
- Admin `deleteUser` already removes the member's meals, scans, weight logs and planned meals, and blocks self-deletion.
- Public diet, food and vegetable reads return catalogue data only.

### Changed
- `eslint-config-next` moved to `devDependencies`.
- The ad-hoc tests moved from `server/src/` to `server/tests/`, and `npm run test:unit` runs them. `npm run build` also syntax-checks `tests/`.
- Root scripts: `start:api` starts the Express API and `build:all` builds the server and the web app. The web and API services are started separately.
- `getDiets` logs the DB error before it falls back to the built-in catalogue. Removed a stale comment.
- `database/schema.sql`: `learned_food_matches.user_id` (FK `ON DELETE CASCADE`, indexed).
- Docs now list the installed versions: Next.js 15.5, TypeScript 5.9, Express 4.22, Mongoose 8 (MongoDB 7 or 8 server, as in HowToSetup.md).
- `.env.example` files: document which code reads `GEMINI_API_KEY` and `HF_TOKEN`/`HUGGINGFACE_API_KEY`, and how `NEXT_PUBLIC_API_URL` feeds the `next.config.ts` rewrite.
- e2e smoke test: 42 checks, including the operator-injection login, a case-insensitive duplicate email, and 401/403 status codes.

### Notes
- Express stays on 4.x on purpose. 4.22 is patched, and moving to Express 5 needs a pass over the route patterns (path-to-regexp v8).
- `@tensorflow/tfjs` is used only by the on-device scanner (`web/src/services/local-vision-classifier.ts`).

**`npm audit` (2026-11-04):** root 0. `server/` 0 production, 2 moderate dev-only (`minimatch` via `nodemon`). `web/` 0 production, 14 moderate dev-only (`minimatch` in the ESLint toolchain). No critical or high findings.

## [1.0.6] - 2026-11-04
### Security
- Upgraded `next` 15.1.7 → **15.5.29** (and `eslint-config-next` to match), the latest 15.5.x, which patches the 15.1.x critical middleware-bypass (CVE-2025-29927) and RSC advisories. `next`'s bundled `postcss` is overridden to 8.5.26 (high-severity PostCSS advisories).
- Upgraded `express` 4.21.2 → 4.22.3 and `mongoose` 8.12.1 → 8.24.8.
- Every dependency in `package.json`, `server/package.json` and `web/package.json` is pinned to an exact version (no `^`/`~` ranges); lockfiles stay committed.
- Removed the hard-coded development JWT secret. Without `JWT_SECRET` in development a random per-process secret is generated; production still refuses to start signing without it.
- Search text is regex-escaped before querying (`GET /api/foods?search=`, `GET /api/vegetables/:idOrSlug`, `POST /api/vegetables/:idOrSlug/calculate`) via the shared `server/src/utils/regex.js`.
- `requireAuth` added to `POST /api/vegetables/match`, `POST /api/vegetables/:idOrSlug/calculate`, `GET /api/scan/learned` and `GET /api/diets/recommendations`.
- `/api/users/:id` routes now run a route-level `requireSelf` middleware: `:id` must be `current` or the caller's own id, otherwise 422. The duplicated checks in `user.controller.js` were removed. Covered by new e2e checks.
- **Fixed:** `POST /api/scans/evaluate` read another member's diet, medical conditions, allergies and medications when their id was sent in the body. It now uses only `req.user`. The `resolveUserId` helper (fell back to "first user in the database") was removed from the scan, planner and progress controllers.
- **Fixed:** `User.password` defaulted to `password123` and `passwordMatches` accepted plain-text stored passwords. The field is now required and only scrypt hashes can match. The seeded sample owner (`alex.morgan@nutrilens.ai`) gets a random password instead of `password123`.
- Demo passwords can be overridden per deployment: `DEMO_MEMBER_PASSWORD` / `DEMO_ADMIN_PASSWORD` (API) and `NEXT_PUBLIC_DEMO_MEMBER_PASSWORD` / `NEXT_PUBLIC_DEMO_ADMIN_PASSWORD` (web). The public showcase values remain the defaults.

**`npm audit` results after the upgrade (2026-11-04):**

| Package | Critical | High | Moderate | Notes |
|---|---|---|---|---|
| root | 0 | 0 | 0 | `found 0 vulnerabilities` |
| `server/` | 0 | 0 | 2 | `minimatch` ReDoS in `nodemon` (dev-only) |
| `web/` | 0 | 0 | 14 | `minimatch` ReDoS in the ESLint toolchain (dev-only); fix requires Next 16 / ESLint 10 |

Before: `web/` had 1 critical and 2 high (`next` 15.1.x, `postcss`, `sharp`).

### Added
- `npm run db:migrate` (`server/scripts/migrate.js`): MongoDB migration that creates every collection and syncs its indexes from the Mongoose models.
- `database/README.md`: how to create the runtime MongoDB database and how each Mongoose model maps to its collection and SQL table.
- Compound indexes `meals {userId, date}`, `foodscans {userId, createdAt: -1}`, `weightlogs {userId, date: -1}` in the models and `schema.sql`.
- `npm run verify:live -- <url>` (`server/scripts/verify-live.js`): checks a deployed demo's API host, MongoDB connection and that both demo logins return a token.

- `.nvmrc` (Node 20) and `"engines": { "node": ">=20" }` in every `package.json`; Render pins `NODE_VERSION=20`.
- Root scripts `npm run install:all` (`npm ci` in root, `server/`, `web/`) and `npm run check` (server syntax check + web production build).

### Changed
- `database/schema.sql` and `database/seed.sql` are labelled documentation / reference only; the runtime database is MongoDB.
- Error responses go through one helper, `server/src/utils/http.js` (`sendError`). It replaced about 60 copy-pasted `res.status(422).json(...)` blocks across the controllers and returns one message per field for Mongoose validation errors.
- Removed the unreachable "offline mode" fallbacks in `GET /api/meals` and `GET /api/vegetables`: the DB-down 503 middleware in `index.js` answers first. `GET /api/meals` errors now return 422 instead of a fake empty success.
- Render (`npm ci`) and Vercel (`installCommand: npm ci`) install exactly what the lockfiles record.
- `DEPLOYMENT.md` now says Node 20+ (was 18+); `web/.env.example` documents the branding and demo-password variables; README quick start uses `install:all`, `db:migrate` and `check`.

## [1.0.5] - 2026-11-04
### Added
- `database/schema.sql` (full schema from scratch) and `database/seed.sql` (demo data).
- `CLAUDE.md` guide for AI coding tools and this `CHANGELOG.md`.
- `JWT_SECRET` generated automatically in `render.yaml`.

### Changed
- Every mutating endpoint now requires authentication: `POST /api/foods` (admin only), `POST /api/scans/evaluate` and `POST /api/scans/teach` (signed-in user).
- The API refuses to sign tokens in production when `JWT_SECRET` is not set (no built-in fallback secret).
- `server/src/seed.js` stores the sample user's password hashed.

### Removed
- `server/node_modules` is no longer tracked in git.

## [1.0.4] - 2026-10
### Added
- Database fail-fast 503, configurable branding, `HowToSetup.md` guide, end-to-end smoke test, `npm audit` fixes.

## [1.0.3] - 2026-10
### Added
- Product showcase page, one-click demo logins, admin panel and marketplace covers.

## [1.0.2] - 2026-10
### Fixed
- Member data is scoped to the signed-in user; dashboard totals refresh.

## [1.0.1] - 2026-09
### Added
- Weekly planner, progress analytics and vegetable explorer.

## [1.0.0] - 2026-09
### Added
- Initial release: AI food scanner, 20 diet protocols, medical safety rules, meal logging, user profiles, Express + MongoDB API and Next.js web app.
