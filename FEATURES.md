# NutriLens — Feature Roadmap

Status key: ✅ done · 🆕 added in this pass · ⬜ not started

## Must have

| Feature | Status |
|---|---|
| Register / login / JWT sessions, per-user data scoping | ✅ |
| Forgot / reset password | ✅ |
| 8-step onboarding, persisted profile and targets | ✅ |
| AI food scanner with clinical safety tiers | ✅ |
| Meal logging, view, delete | ✅ |
| Progress (weight logs, charts) and weekly planner | ✅ |
| 20 canonical diet protocols with adoption safety checks | ✅ |
| API integration tests and ESLint | ✅ |
| Change password (current password required) | 🆕 |
| Edit a logged meal (API; totals recalculated from items) | 🆕 |
| Meal input validation (type, date, non-negative numbers) | 🆕 |
| Export my data (JSON) | 🆕 |
| Delete account + all data (password confirmation) | 🆕 |
| CI: server tests against MongoDB, web lint and type-check | 🆕 |
| Meal edit UI on `/meals/[id]` | ⬜ |
| Token revocation / logout everywhere (tokens are stateless, valid 7 days) | ⬜ |
| Email verification on registration | ⬜ |
| Frontend tests (stores, API client, critical pages) | ⬜ |
| Clear the 185 `no-explicit-any` lint warnings | ⬜ |

## Nice to have

| Feature | Status |
|---|---|
| Barcode scanning for packaged foods | ⬜ |
| Recipe builder and saved/favourite meals for one-tap re-logging | ⬜ |
| Reminders (water, meals, weigh-in) via push or email | ⬜ |
| Weekly summary email / shareable PDF report for a clinician | ⬜ |
| Grocery list generated from the weekly planner | ⬜ |
| Dark/light theme switch and Bengali localisation | ⬜ |
| PWA / offline logging | ⬜ |
| Wearable / Google Fit step sync (replaces manual NEAT entry) | ⬜ |
| Admin dashboard for the shared food catalog (view, search, add; edit/delete still to do) | ✅ |
| Server-side image storage for scan history | ⬜ |
