# CLAUDE.md — guide for AI coding tools

NutriLens: AI food scanner and nutrition platform. Next.js 15 web app + Express API + MongoDB.

## Architecture
```
web/ (Next.js 15, React 19, Tailwind 4, port 3000)
  └─ rewrites /api/* ─▶ server/ (Express 4, port 5000) ─▶ MongoDB (Mongoose 8)
```
- Auth: HMAC-SHA256 signed bearer tokens (`server/src/middleware/auth.js`), scrypt password hashes (`server/src/utils/password.js`). Roles: `user`, `admin`.
- Errors use `{ success:false, code:422, errors:[...] }`; the API answers 503 when MongoDB is down.

## Folder map
| Path | What |
|------|------|
| `server/src/index.js` | App setup, route mounting, health check |
| `server/src/routes/` | One router per resource; auth middleware applied here |
| `server/src/controllers/` | Request handlers |
| `server/src/models/` | Mongoose models (User, Meal, FoodScan, DietPlan, Vegetable, ...) |
| `server/src/services/` | Nutrition engine, diet recommendation, food recognition, demo accounts |
| `server/src/data/`, `server/src/nutrition/` | Static food, diet and medical-rule data |
| `server/src/seed.js` | `npm run seed` — loads diets, vegetables and demo data |
| `server/scripts/` | `check-syntax.js` (build), `e2e-smoke.js` (end-to-end test) |
| `web/src/app/` | App Router pages: `(auth)`, `(dashboard)`, `(admin)`, `(onboarding)`, `showcase` |
| `web/src/components/` | UI: scanner, diets, layout, admin, brand |
| `web/src/services/api-client.ts` | Typed API client (adds the bearer token) |
| `database/` | `schema.sql` and `seed.sql` — the data model as SQL plus demo data |
| `HowToSetup.md`, `DEPLOYMENT.md` | Clean-machine setup and production deploy |

## Conventions
- Every route that creates, changes or deletes data uses `requireAuth`; admin routes add `requireAdmin` and `blockDemoWrites`. New mutating endpoints must follow this.
- Scope data to `req.user` — never trust a user id from the request body.
- Never commit secrets: use `server/.env` (git-ignored); document new variables in `server/.env.example`.
- Server is CommonJS JavaScript; web is TypeScript (strict). Match the surrounding style.
- Keep `database/schema.sql` in step with `server/src/models/`.
- Do not commit `node_modules/` or `.next/`.

## Run and test
```bash
cd server && cp .env.example .env     # set JWT_SECRET and MONGODB_URI
npm install && npm run seed && npm start    # API on :5000
cd web && npm install && npm run dev        # web on :3000
```
- Build check (server): `cd server && npm run build`
- Build (web): `cd web && npm run build`
- End-to-end smoke test (API must be running): `cd server && npm run test:e2e`
- Demo logins: `demo.member@nutrilens.app` / `Demo@1234`, `demo.admin@nutrilens.app` / `Admin@1234`
