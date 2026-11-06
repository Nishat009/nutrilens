# Security

How NutriLens protects accounts and data, where each control lives, and how it is tested.

## Authentication

| Control | Where |
|---|---|
| Passwords hashed with scrypt (`scrypt$<salt>$<hash>`), never stored or returned in plain text | `server/src/utils/password.js` |
| HMAC-SHA256 signed bearer tokens with expiry (`JWT_TTL_SECONDS`, default 7 days) | `server/src/middleware/auth.js` |
| Signature compared with `timingSafeEqual` after a length check (a wrong length is a plain 401) | `verifyToken` in `middleware/auth.js` |
| Token revocation: each token carries the user's `tokenVersion`; `POST /api/auth/logout-all` increments it, so every older token is refused | `requireAuth`, `auth.controller.js` |
| `JWT_SECRET` required in production; development uses a random per-process secret, never a shared default | `getSecret` in `middleware/auth.js` |
| Rate limits: 1000 req / 15 min per IP on `/api`, 30 / 15 min on register, login and demo-login | `server/src/middleware/rate-limit.js` |
| Email accepted only as a trimmed, lowercased string, so `{"$ne":null}` cannot act as a query operator | `auth.controller.js` |
| Sign-up takes only name, email, password and an allow-list of body fields; `role` is never accepted | `REGISTRATION_FIELDS` in `auth.controller.js` |

## Authorisation (access-control matrix)

Every route that creates, changes or deletes data requires a signed-in user. Admin routes also require
`role: "admin"`, and admin writes are blocked for the shared demo admin. Member data is always read and
written through `req.user._id`; a user id in the request body or query is ignored.

| Area | Routes | Guards |
|---|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/demo-login` | public, rate-limited |
| | `GET /api/auth/me`, `POST /api/auth/logout-all` | `requireAuth` |
| Profile | `GET`, `PUT /api/users/:id`, `PUT /api/users/:id/goal` | `requireAuth` + `requireSelf` (`:id` must be `current` or the caller) |
| Meals | `GET /api/meals`, `GET /api/meals/:id`, `POST /api/meals`, `DELETE /api/meals/:id` | `requireAuth`; queries filter `{ _id, userId: req.user._id }` |
| Planner | `GET`, `POST /api/planner`, `DELETE /api/planner/:id` | `requireAuth`; scoped to `req.user._id` |
| Progress | `GET /api/progress`, `GET`, `POST /api/progress/weight`, `GET /api/progress/nutrition` | `requireAuth`; scoped to `req.user._id` |
| Scans | all `/api/scans/*` (analyze, evaluate, teach, learned, list, `:id`, create) | `requireAuth`; scoped to `req.user._id` |
| Diets | `GET /api/diets`, `GET /api/diets/:slug` | public catalogue reads |
| | `POST /api/diets/recommend`, `/swap-food`, `/adaptive-review`, `/adopt`, `GET /api/diets/recommendations` | `requireAuth`; no anonymous fallback |
| Foods | `GET /api/foods`, `GET /api/foods/:id` | public catalogue reads |
| | `POST /api/foods` | `requireAuth` + `requireAdmin` + `blockDemoWrites` |
| Vegetables | `GET /api/vegetables`, `/search`, `/categories`, `/:idOrSlug` | public catalogue reads |
| | `POST /api/vegetables/match`, `POST /api/vegetables/:idOrSlug/calculate` | `requireAuth` |
| Admin | every `GET /api/admin/*` | `requireAuth` + `requireAdmin` (`router.use`) |
| | `PATCH`, `DELETE /api/admin/users/:id`, `PATCH /api/admin/vegetables/:id` | + `blockDemoWrites` |

This table is enforced by [`server/tests/route-guards.test.js`](server/tests/route-guards.test.js). The test walks
every Express router, prints the guard chain of all 51 routes, and fails if a non-public route lacks
`requireAuth`, an admin route lacks `requireAdmin`, an admin write lacks `blockDemoWrites`, a profile route lacks
`requireSelf`, or a public route mutates data. Run it with `npm --prefix server run test:unit`.

Cross-user access is tested end to end in [`server/scripts/e2e-smoke.js`](server/scripts/e2e-smoke.js): a second
member cannot read or delete the first member's meal, planner slot or scan, a member cannot create foods or open
`/api/admin`, the demo admin cannot change roles, delete members or edit vegetables, and a token stops working
after `logout-all`.

### Destructive operations

| Operation | Filter |
|---|---|
| `DELETE /api/meals/:id` | `Meal.findOneAndDelete({ _id, userId: req.user._id })` |
| `DELETE /api/planner/:id` | `PlannedMeal.findOneAndDelete({ _id, userId: req.user._id })` |
| `DELETE /api/admin/users/:id` | admin only, not self, not a demo account; then `deleteMany({ userId })` on that member's meals, scans, weight logs and planned meals |
| `PATCH /api/admin/users/:id` | admin only, not self, not a demo account; only `role` (`user` / `admin`) |

No `deleteMany` or `updateMany` runs without a filter outside the seed scripts (`server/src/seed.js`,
`server/src/seeds/`), which are development tools that wipe and reload the database on purpose. Other updates
target one record by id: the caller's own user (`req.user._id`) or, for admins, one vegetable.

## Demo mode

`DEMO_MODE=true` enables `POST /api/auth/demo-login` for a shared demo member and a shared demo admin.
It is off by default when `NODE_ENV=production`.

- The demo admin is read-only (`blockDemoWrites` on every admin write).
- In admin reads it sees real (non-demo) members only with a masked name and email (`N***`, `n***@domain`) and no
  health conditions, and `GET /api/admin/users/:id` returns 403 for a real member.
- **Do not enable `DEMO_MODE` on a production server that holds real member data.** Use it for a showcase
  deployment with sample data only.

## Transport and input

- `helmet` security headers. CORS allows only the origins in `CORS_ORIGINS` (default: `http://localhost:3000`
  in development, none in production). Requests through the Next.js `/api/*` rewrite are same-origin.
- JSON bodies are limited to `BODY_LIMIT` (5mb). Scan and meal photos are limited to `MAX_SCAN_IMAGE_BYTES`
  (3 MB) and are downscaled to 1024 px in the browser first. Scan lists are paginated and leave the photo out.
- `POST /api/scans` copies only known scan fields; `userId` always comes from the session.
- User search text is escaped before it becomes a RegExp (`server/src/utils/regex.js`).
- Errors: 400 malformed JSON, 401 auth, 403 forbidden, 404 unknown route, 413 body too large, 422 validation,
  429 rate-limited, 500 unexpected (generic message, details only in the server log), 503 database down.

## Secrets

No secret is committed. `server/.env` and `web/.env.local` are git-ignored; `.env.example` files hold empty
placeholders. Test scripts generate passwords at runtime with `crypto.randomBytes`. Never put a secret in a
`NEXT_PUBLIC_*` variable: it is compiled into the browser bundle.

## Dependencies

All versions are pinned exactly, with a committed `package-lock.json` in the root, `server/` and `web/`.

`npm audit` on 2026-11-06 (`next` 15.5.29, `react`/`react-dom` 19.2.9):

| Project | Production (`--omit=dev`) | All, including dev tools |
|---|---|---|
| root | 0 | 0 |
| `server/` | 0 | 0 (the `nodemon` → `minimatch` advisory is fixed by an `overrides` pin to `minimatch@11.0.4`. `nodemon` 3.1.14 is the latest release and still asks for `minimatch@^10`; every 10.x is flagged (2 moderate without the pin). Checked: `npm run dev` with 11.0.4 restarts on a changed `.js` file and skips ignored files) |
| `web/` | 0 | 0 (the ESLint toolchain's `@typescript-eslint/typescript-estree` → `minimatch` advisory, GHSA-g3hv-75wg-m249, is fixed by an `overrides` pin to `minimatch@11.0.4`; `next`'s bundled `postcss` is pinned to 8.5.26 the same way) |

No critical or high advisories. Re-run with `npm audit` in each folder before a release.

## Reporting a vulnerability

Contact the maintainer privately through the marketplace listing with steps to reproduce. Please do not open a
public issue for security problems.
