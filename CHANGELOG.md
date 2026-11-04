# Changelog

All notable changes to NutriLens. Format: [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/).

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
