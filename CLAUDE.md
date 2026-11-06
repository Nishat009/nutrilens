# CLAUDE.md — guide for AI coding tools

NutriLens: AI food scanner and nutrition platform. Next.js 15 web app + Express API + MongoDB.

## Architecture
```
web/ (Next.js 15, React 19, Tailwind 4, port 3000)
  └─ rewrites /api/* ─▶ server/ (Express 4, port 5000) ─▶ MongoDB (Mongoose 8)
```
- Auth: HMAC-SHA256 signed bearer tokens (`server/src/middleware/auth.js`), scrypt password hashes only (`server/src/utils/password.js`). Roles: `user`, `admin`.
- Node 24 LTS (`.nvmrc`, `engines` "24.x"; Render and Vercel build on the same major). Install with `npm run install:all` (npm ci); `npm run check` builds everything.
- Stack versions: Next.js 15.5, React 19.2, TypeScript 5.9, Tailwind 4, Express 4.22, Mongoose 8.24, MongoDB 7 or 8.
- Errors use `{ success:false, code, errors:[...] }`: 400 for malformed JSON, 401 for a missing/invalid/revoked token, 403 for a forbidden action, 404 for an unknown route, 413 for a too-large body, 422 for validation, 429 when rate-limited, 500 for unexpected errors (generic message), 503 when MongoDB is down.
- Deployment settings (CORS origins, body/photo limits, token lifetime) live in `server/src/config/app.js`, read from env.

## Folder map
| Path | What |
|------|------|
| `server/src/index.js` | App setup, route mounting, health check |
| `server/src/routes/` | One router per resource; auth middleware applied here |
| `server/src/controllers/` | Request handlers |
| `server/src/models/` | Mongoose models (User, Meal, FoodScan, DietPlan, Vegetable, ...) |
| `server/src/services/` | Nutrition engine, diet recommendation, food recognition, demo accounts |
| `server/src/data/`, `server/src/nutrition/` | Static food, diet and medical-rule data. The `nutrition/*.json` files are the single copy, also imported by `web/src/data/` |
| `server/src/seed.js` | `npm run seed` — loads diets, vegetables and demo data |
| `server/tests/` | Unit tests (`npm run test:unit`): `route-guards.test.js` (access-control matrix for every route), `auth-token.test.js`, diet engine, `nutrition-parity.test.js` (web scanner and API nutrition engine agree) |
| `server/scripts/` | `check-syntax.js` (build), `migrate.js` (MongoDB collections + indexes), `e2e-smoke.js` (end-to-end test), `verify-live.js` (deployed demo check) |
| `web/src/app/` | App Router pages: `(auth)`, `(dashboard)`, `(admin)`, `(onboarding)`, `showcase` |
| `web/src/components/` | UI: scanner, diets, layout, admin, brand |
| `web/src/services/api-client.ts` | Typed API client (adds the bearer token) |
| `database/` | `schema.sql` and `seed.sql` — documentation-only SQL view of the data model; mapping in `database/README.md` |
| `HowToSetup.md`, `DEPLOYMENT.md` | Clean-machine setup and production deploy |

## Conventions
- Food and diet data have one copy, in `server/src/nutrition/*.json`; the web app imports those files (`web/src/data/`). Never paste data into a second file. The nutrition engine exists in both `web/src/services/nutrition-engine.ts` and `server/src/services/nutrition-engine.js`: change both, `nutrition-parity.test.js` checks they match.
- Every route that creates, changes or deletes data uses `requireAuth`; admin routes add `requireAdmin` and `blockDemoWrites`. New mutating endpoints must follow this, and new public routes must be added to the allow-list in `server/tests/route-guards.test.js`.
- The shared demo admin sees real (non-demo) members masked in admin reads; keep using `privacyFor` / `maskScans` in `admin.controller.js` for new admin reads that return member data.
- List endpoints are paginated (`page`, `limit`, capped) and leave large fields such as scan photos out.
- Scope data to `req.user` — never trust a user id from the request body. `/:id` routes for a member's own record use `requireSelf`.
- Return errors with `sendError(res, error, 'fallback message')` from `server/src/utils/http.js`.
- Never commit secrets: use `server/.env` (git-ignored); document new variables in `server/.env.example`.
- Server is CommonJS JavaScript; web is TypeScript (strict). Match the surrounding style.
- Keep `database/schema.sql` and `database/README.md` in step with `server/src/models/`.
- Escape user text before building a RegExp (`server/src/utils/regex.js`). Only pass strings (never raw `req.body` objects) into a query filter.
- Never put a password or secret in a `NEXT_PUBLIC_*` variable; it is compiled into the browser bundle.
- Dependencies are pinned to exact versions; install with `npm install <pkg>@<version> --save-exact`.
- Do not commit `node_modules/` or `.next/`.

## Run and test
```bash
npm run install:all                  # npm ci in root, server/ and web/ (exact lockfile versions)
cp server/.env.example server/.env   # set JWT_SECRET and MONGODB_URI
npm run db:migrate && npm run seed   # collections + indexes, then sample data
npm run dev                          # API on :5000 + web on :3000
```
- Build check (server): `cd server && npm run build` (syntax check + `check-schema-docs.js`, which fails when `database/schema.sql` drifts from the models)
- Everything: `npm run check` (or `npm run build`) at the root builds the server check and the web app.
- Build (web): `cd web && npm run build`
- End-to-end smoke test (API must be running): `cd server && npm run test:e2e`
- Check a deployed demo: `cd server && npm run verify:live -- https://<your-app>`
- Demo logins: one-click `POST /api/auth/demo-login` with `{ role: 'user' | 'admin' }` (needs `DEMO_MODE`; on by default outside production). No demo password lives in code or docs; set `DEMO_MEMBER_PASSWORD` / `DEMO_ADMIN_PASSWORD` in `server/.env` for email + password sign-in.
- Unit tests: `npm run test:unit` (`server/tests/`).
- Production with `DEMO_MODE=true` also needs `DEMO_SHOWCASE=true` (sample-data database only), or the API refuses to start.
- Deleting a member goes through `server/src/services/user-data.js`; add any new model with a `userId` to `USER_SCOPED_MODELS` (`user-data.test.js` checks it).
