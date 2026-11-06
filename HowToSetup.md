# NutriLens — Clean-Machine Setup Guide

Follow these steps top to bottom on a machine with nothing installed.

**What runs where**

| Part | Port | Folder |
|------|------|--------|
| MongoDB | 27017 | system service |
| API (Express) | 5000 (change with `PORT`) | `server/` |
| Web (Next.js) | 3000 | `web/` |

---

## 1. Install prerequisites

### Node.js 24 LTS (includes npm)
Download the LTS installer from <https://nodejs.org> (or `winget install OpenJS.NodeJS.LTS` on Windows, `brew install node` on macOS). Check: `node -v` prints `v24.x`. With nvm: `nvm install && nvm use` (reads `.nvmrc`).

### Git
<https://git-scm.com/downloads>. Check: `git --version`.

### MongoDB Community Server 7 or 8
Tested with MongoDB 7.0 and 8.0 (Mongoose 8.24). Older servers are not tested. MongoDB Atlas works too.

**Windows**
1. Download the MSI from <https://www.mongodb.com/try/download/community> (or `winget install MongoDB.Server`).
2. Run the installer, choose **Complete**, and keep **Install MongoDB as a Service** ticked. MongoDB Compass is optional.
3. Verify the service: `Get-Service MongoDB` → `Status: Running`.

**macOS (Homebrew)**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Ubuntu/Debian** — follow <https://www.mongodb.com/docs/manual/administration/install-on-linux/>, then `sudo apt-get install -y mongodb-org`.

**Docker alternative (any OS)**
```bash
docker run -d --name nutrilens-mongo -p 27017:27017 -v nutrilens-data:/data/db mongo:7
```

> Prefer no local install? Create a free MongoDB Atlas cluster and put its connection string in `MONGODB_URI` (step 4).

## 2. Start the MongoDB service

| OS | Command |
|----|---------|
| Windows (admin PowerShell) | `net start MongoDB` |
| macOS | `brew services start mongodb-community` |
| Linux | `sudo systemctl enable --now mongod` |
| Docker | `docker start nutrilens-mongo` |

Confirm it is listening: `mongosh --eval "db.runCommand({ ping: 1 })"` → `{ ok: 1 }`.
Without mongosh on Windows: `Test-NetConnection 127.0.0.1 -Port 27017` → `TcpTestSucceeded : True`.

## 3. Get the code and install dependencies

```bash
git clone https://github.com/Nishat009/nutrilens.git
cd nutrilens
npm run install:all              # npm ci in root, server/ and web/ (exact lockfile versions)
```
Use `npm run install:all` (not `npm install`): it installs exactly the versions in the three lockfiles.

## 4. Configure environment files

**`server/.env`** (copy `server/.env.example`, then edit):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/nutrilens   # REQUIRED
JWT_SECRET=<long random string>                   # REQUIRED in production
DEMO_MODE=true                                    # local demo logins; never true on a server with real members
```
| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Every route except `/api/health` returns 503 without it |
| `JWT_SECRET` | yes in production | Development falls back to a random per-run secret |
| `CORS_ORIGINS` | when the browser calls the API directly | Defaults to `http://localhost:3000` in development |
| `DEMO_MODE` | no | Empty = on in development, off in production |
| `DEMO_SHOWCASE` | only with `NODE_ENV=production` + `DEMO_MODE=true` | `true` confirms the database holds sample data only; without it the API refuses to start |
| `JWT_TTL_SECONDS`, `BODY_LIMIT`, `MAX_SCAN_IMAGE_BYTES` | no | Token lifetime (7 days), request size (5mb), photo size (3 MB) |

Generate a secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Use `127.0.0.1`, not `localhost`: Node 18+ can resolve `localhost` to IPv6 (`::1`), where MongoDB is not listening.

**`web/.env.local`** (copy `web/.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_DEMO_MODE=true
```
`NEXT_PUBLIC_API_URL` is **required for the web build**: it must use the same port as `PORT` above (in production, your API URL). `next.config.ts` reads it at build time for the `/api/*` rewrite, so rebuild after changing it.

## 5. Create the empty database and seed it

Create every collection and its indexes from the Mongoose models, then load the data. The SQL files in `database/` are documentation only (see `database/README.md`).

```bash
npm run db:migrate
npm run seed
```
Expected output ends with `✨ Database seeding successfully finished!` and lists the demo accounts. It loads about 98 foods, 106 vegetables, the diet protocols, a sample planner, weight history and the two demo logins.

> ⚠️ `npm run seed` **wipes every collection** in the target database before reloading. Use it only on a fresh or development database.

## 6. Start the app

```bash
npm run dev          # API + web together (development)
```
Or use two terminals: `npm run server` and `npm run web`.

The API and web app are two separate services. In production, build and start them separately:
```bash
npm run build:all    # server syntax check + web production build
npm run start:api    # Express API (server/)
npm run start        # Next.js web app (web/)
```

Check the API: <http://localhost:5000/api/health> must show `"database":{"status":"connected","connected":true}`.

## 7. Exact first-login path

1. Open <http://localhost:3000/login>.
2. Click **Log in as Member** (one-click, no password). You land on `/dashboard`.
3. Admin: sign out, click **Log in as Admin**. It opens `/admin` (read-only demo admin).
   To sign in to the demo accounts with email + password instead, set `DEMO_MEMBER_PASSWORD` / `DEMO_ADMIN_PASSWORD` in `server/.env` and restart the API.
4. Your own account: <http://localhost:3000/register> → create it → complete the 8-step assessment on `/onboarding` → dashboard.

To make your own account an admin:
```bash
mongosh nutrilens --eval "db.users.updateOne({ email: 'you@example.com' }, { \$set: { role: 'admin' } })"
```

## 8. Verify everything works

```bash
npm --prefix server run test:e2e
```
Logs in as member and admin, registers a user, and exercises profile, progress/weight, meals, foods, vegetables, diets, planner, scans and every admin endpoint, including cross-user access (one member cannot read or delete another's meal), read-only demo admin writes, and token revocation (56 checks, all must `PASS`).

Without a running API:
```bash
npm run check                         # server syntax + schema-docs check, then web production build
npm --prefix server run test:unit     # route-guard matrix, token tests, diet engine
```

## 9. Branding (app name and logo)

Set these in `web/.env.local`, then **rebuild/restart** (`NEXT_PUBLIC_*` values are compiled in at build time):
```env
NEXT_PUBLIC_APP_NAME=Acme Fit
NEXT_PUBLIC_APP_LOGO_URL=/brand/logo.svg
```
Put the logo in `web/public/brand/` (SVG or PNG, square works best) or use an absolute `https://` URL. Leave both empty for the default NutriLens name and icon. The name appears on the landing page, showcase, login/register, onboarding, sidebar, admin panel and browser title. The PNGs in `marketing/` are separate artwork and are not affected.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Register/login shows **"Database unavailable: MongoDB is not connected…"** (HTTP 503) | MongoDB is not running or `MONGODB_URI` is wrong. Start the service (step 2), fix `server/.env`, restart the API. `/api/health` shows the live DB state. |
| **"Cannot reach the API server"** in the UI | The API is not running, or `NEXT_PUBLIC_API_URL` points at the wrong port. Restart `npm run dev`. |
| API log: `MONGODB_URI is not set` | `server/.env` is missing; redo step 4. |
| `ECONNREFUSED ::1:27017` | Use `127.0.0.1` in `MONGODB_URI`. |
| `EADDRINUSE` | Port taken. Change `PORT` (and `NEXT_PUBLIC_API_URL`) or stop the other process. |
| Demo buttons missing on `/login` | `NEXT_PUBLIC_DEMO_MODE=false`; set `true` and restart the web app. |
| Demo button says the server is unreachable / demo not enabled | The API runs with `NODE_ENV=production` and no `DEMO_MODE=true`. Set `DEMO_MODE=true` in `server/.env`. |
| HTTP 429 on sign-in | Rate limit (30 sign-in attempts per 15 minutes per IP). Wait and retry. |
| Atlas `ServerSelection` / `tlsv1` error | Allow your IP in Atlas → Network Access. |

## `npm audit` status

`npm audit` reports **0 vulnerabilities** in root, `server/` and `web/`, production and dev (2026-11-05; `next` 15.5.29, `react` 19.2.9). The transitive fixes are scoped `overrides` in `package.json`: `minimatch@11.0.4` (server: `nodemon`; web: `@typescript-eslint/typescript-estree`) and `postcss@8.5.26` inside `next`. Details in [SECURITY.md](SECURITY.md#dependencies).
