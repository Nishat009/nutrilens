# Changelog

All notable changes to NutriLens. Format: [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/).

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
