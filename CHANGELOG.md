# Changelog

All notable changes to NutriLens are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Landing page "Live Demo" buttons that lead to the login page.
- One-click demo login (Demo User and Demo Admin) on the login page — `POST /api/auth/demo-login`, enabled only with `DEMO_MODE=true` on the API and `NEXT_PUBLIC_DEMO_MODE=true` on the web app. `npm run seed` now also creates the demo admin.
- Admin Panel (`/admin`): catalogue stats, search and add-food form for the shared food catalogue; `isAdmin` is returned on the user profile.
- Cover images in `docs/` (1080×1080 and 1920×1080).
- Change password (current password required) — `POST /api/auth/change-password`.
- Edit a logged meal — `PUT /api/meals/:id`; totals are recalculated from items.
- Meal input validation (meal type, date, non-negative numbers).
- Export my data as JSON — `GET /api/users/current/export`.
- Delete account and all data with password confirmation — `DELETE /api/users/current`.
- Account security section on the profile page.
- GitHub Actions CI: server tests against MongoDB, web lint and type-check.
- `database/schema.sql` and `database/seed.sql` (relational reference of the data model), `CLAUDE.md`, `FEATURES.md`.

### Security
- Removed the hard-coded development JWT secret; development now uses a random per-run secret and production still requires `JWT_SECRET`.
- Seed script no longer ships a fixed demo password (uses `SEED_USER_PASSWORD` or a random one).
- Server fails fast when `MONGODB_URI` is missing in production.
- `npm audit fix`: cleared the critical `proxy-addr` advisory; refreshed Express, Mongoose, Next.js and React.

### Changed
- Added compound indexes: meals (user, date), scans (user, createdAt), weight logs (user, date).
- Auth rate-limit window is configurable (`AUTH_RATE_LIMIT_WINDOW_MS`); README gained prerequisites, MongoDB URI formats and a seed warning; added a root lockfile.

## [1.0.0]

### Added
- Register, login and JWT sessions with per-user data scoping; working forgot/reset password flow with rate limiting.
- 8-step onboarding with persisted profile and calorie/macro targets.
- AI food scanner with five clinical safety tiers (safe, caution, limit, avoid, professional review) and a perceptual-hash visual memory of user corrections.
- Meal logging, history and deletion; recent scan history; real logging streak on the dashboard.
- Progress page with weight logs and nutrition charts; weekly meal planner.
- 20 canonical diet protocols with pre-adoption safety checks, personalised plans and food swaps.
- Vegetable explorer with 100+ USDA-sourced items.
- API integration tests, ESLint, and deployment guides for Vercel, Render and MongoDB Atlas.

### Changed
- Diet plans, swaps and check-ins are generated on the server; the client-side diet engine, mock data and stub scan routes were removed.

### Fixed
- Dashboard, meals, progress and scan pages now show real data and surface save errors instead of failing silently.
