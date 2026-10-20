# CLAUDE.md — NutriLens

Guide for AI coding tools working in this repo.

## What this is

NutriLens is a nutrition tracker: AI food scanner with clinical safety tiers, meal logging, weight progress, weekly planner and 20 diet protocols. Two apps in one repo:

- `server/` — Express 4 + Mongoose 8 (MongoDB), CommonJS, port 5000.
- `web/` — Next.js 15 App Router, React 19, Tailwind v4, Zustand stores, TypeScript, port 3000. `next.config.ts` proxies `/api/*` to the server.

## Folder map

```
server/src/
  index.js, app.js        entry point / Express app (middleware, route mounting, /api/health)
  config/db.js            MongoDB connection
  models/                 Mongoose models: User, Meal, FoodScan, Food, Vegetable, PlannedMeal, WeightLog, LearnedFoodMatch
  routes/ + controllers/  one pair per resource (auth, users, meals, scans, foods, vegetables, diets, planner, progress)
  middleware/auth.js      hand-rolled HS256 JWT (7-day, stateless), requireAuth, requireAdmin
  middleware/rate-limit.js
  services/               nutrition engine, diet ranking/recommendation, food recognition
  nutrition/*.json        diet-plans.json (canonical 20 diets — NOT stored in MongoDB), medical + recommendation rules
  data/                   static food and vegetable datasets used by seed.js
  seed.js                 `npm run seed` — wipes and reseeds the DB (demo user, foods, vegetables, planner, weights)
server/test/api.test.js   API integration tests (node:test)
web/src/
  app/(auth|dashboard|onboarding)/   route groups; (dashboard) pages require login
  components/             ui/, layout/, scanner/, diets/, vegetables/, profile/
  lib/stores/             Zustand stores (auth, user, meal, scan)
  services/api-client.ts  the only place that talks to the API
database/                 schema.sql + seed.sql — relational reference of the Mongo data model (the app itself uses MongoDB)
```

## Commands

```bash
# install
cd server && npm install && cd ../web && npm install

# run (two terminals, or `npm run dev` at the root with concurrently)
cd server && npm run dev        # API on :5000
cd web && npm run dev           # UI on :3000

# seed demo data (destructive: clears users, foods, vegetables, meals, scans, weights, planner)
cd server && npm run seed

# tests — need a running MongoDB; they use a separate DB whose name must contain "test"
cd server && npm test           # override with TEST_MONGODB_URI
cd server && npm run build      # syntax check only

# frontend checks
cd web && npm run lint && npx tsc --noEmit
```

CI (`.github/workflows/ci.yml`) runs the server tests against a MongoDB service plus web lint and type-check.

## Conventions

- Server code is plain CommonJS JavaScript; web code is TypeScript. Match the surrounding style and comment density.
- Every route that reads or changes user data goes through `requireAuth`; every query is scoped by `req.user` — never trust a user id from the body. Adding to the shared food catalogue also needs `requireAdmin` (emails in `ADMIN_EMAILS`).
- Controllers reply through `utils/http.js` (`sendError`, `sendUnexpectedError`) — keep the response envelope consistent.
- Meal totals are recalculated server-side from `items`; do not trust client totals.
- Passwords are stored as `scrypt$<salt>$<hash>` (`utils/password.js`). Reset tokens are stored only as SHA-256 hashes.
- Frontend API calls go through `web/src/services/api-client.ts`, not raw `fetch` in components.
- Config comes from env vars; add every new one to `server/.env.example` / `web/.env.example`. Never commit `.env`.
- `JWT_SECRET` is mandatory when `NODE_ENV=production` (the server refuses to start without it).

## Gotchas

- Diet protocols live in `server/src/nutrition/diet-plans.json`, not in MongoDB — edit the JSON, not the DB.
- `npm run seed` deletes existing data. Never point it at a production database by accident.
- Tokens are stateless, so logout does not revoke them (see FEATURES.md for the roadmap).
- `web/` has ~185 `no-explicit-any` lint warnings; don't add new ones.
