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

### Node.js 20 or newer (includes npm)
Download the LTS installer from <https://nodejs.org> (or `winget install OpenJS.NodeJS.LTS` on Windows, `brew install node` on macOS). Check: `node -v`.

### Git
<https://git-scm.com/downloads>. Check: `git --version`.

### MongoDB Community Server 7 or 8

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
npm install                      # root helper (runs both apps together)
npm --prefix server install
npm --prefix web install
```

## 4. Configure environment files

**`server/.env`** (copy `server/.env.example`, then edit):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/nutrilens
JWT_SECRET=<long random string>
DEMO_MODE=true
```
Generate a secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Use `127.0.0.1`, not `localhost`: Node 18+ can resolve `localhost` to IPv6 (`::1`), where MongoDB is not listening.

**`web/.env.local`** (copy `web/.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_DEMO_MODE=true
```
`NEXT_PUBLIC_API_URL` must use the same port as `PORT` above.

## 5. Create the empty database and seed it

MongoDB creates the `nutrilens` database automatically on first write, so there is nothing to create by hand. (Optional explicit check: `mongosh nutrilens --eval "db.createCollection('users')"`.)

```bash
npm run seed
```
Expected output ends with `✨ Database seeding successfully finished!` and prints the demo credentials. It loads about 98 foods, 106 vegetables, the diet protocols, a sample planner, weight history and the two demo logins.

> ⚠️ `npm run seed` **wipes every collection** in the target database before reloading. Use it only on a fresh or development database.

## 6. Start the app

```bash
npm run dev          # API + web together
```
Or use two terminals: `npm run server` and `npm run web`.

Check the API: <http://localhost:5000/api/health> must show `"database":{"status":"connected","connected":true}`.

## 7. Exact first-login path

1. Open <http://localhost:3000/login>.
2. Click **Member App** (or type `demo.member@nutrilens.app` / `Demo@1234`) and press **Sign in**. You land on `/dashboard`.
3. Admin: sign out, click **Admin Panel** (`demo.admin@nutrilens.app` / `Admin@1234`). It opens `/admin` (read-only demo admin).
4. Your own account: <http://localhost:3000/register> → create it → complete the 8-step assessment on `/onboarding` → dashboard.

To make your own account an admin:
```bash
mongosh nutrilens --eval "db.users.updateOne({ email: 'you@example.com' }, { \$set: { role: 'admin' } })"
```

## 8. Verify everything works

```bash
npm --prefix server run test:e2e
```
Logs in as member and admin, registers a user, and exercises profile, progress/weight, meals, foods, vegetables, diets, planner, scans and every admin endpoint (32 checks, all must `PASS`).

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
| Atlas `ServerSelection` / `tlsv1` error | Allow your IP in Atlas → Network Access. |

## `npm audit` status

`npm audit fix` was applied to root, `server` and `web`. This resolved the critical Next.js RCE advisories, `shell-quote`, `body-parser`, `brace-expansion` and `sharp`. Unused `zod`, `react-hook-form` and `@hookform/resolvers` were removed from `web`. Remaining findings, deliberately not force-fixed:

* **web: `postcss` bundled inside `next` (build-time tooling, no untrusted CSS reaches it).** Clearing it needs `npm audit fix --force`, which jumps Next.js 15 → 16, a breaking major upgrade. Do that as a separate change with a full regression pass.
* **server: `minimatch` via `nodemon` (dev-only) and `qs` via `express` (moderate).** The offered fix downgrades `nodemon` to 1.0.2; track upstream patches instead.
