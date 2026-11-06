# 🚀 NutriLens Production Deployment Guide

This comprehensive guide covers deploying the full **NutriLens** stack to production with **Vercel** (Next.js 15 App Router Frontend), **Render** (Express.js API Backend), and **MongoDB Atlas** (Cloud Database).

---

## 🏗️ Architecture Overview

```
                               ┌──────────────────────────────────────────────┐
                               │             Vercel (Next.js 15)              │
                               │        https://nutrilens.vercel.app          │
                               │         (App Router + Glassmorphism UI)      │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      │ HTTPS Requests / Rewrites
                                                      │ NEXT_PUBLIC_API_URL
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │          Render (Express API Server)         │
                               │       https://nutrilens-api.onrender.com     │
                               │      (Node.js 24 LTS / Vision AI Engine)     │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      │ MONGODB_URI (TLS/SSL)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │        MongoDB Atlas (Cloud Database)        │
                               │        (M0 Free Tier Cluster / replica)      │
                               └──────────────────────────────────────────────┘
```

---

## ⚠️ Important: Making your Vercel Site Public (Fix "Protected Deployment")

If visiting your Vercel URL displays **"Protected Deployment — Log in to Vercel"**, follow these quick steps:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your **`nutrilens`** project.
3. Navigate to **Settings** (top tab) → **Deployment Protection** (left sidebar).
4. Under **Vercel Authentication**, toggle it **OFF** (or set to **Disabled**).
5. Click **Save**.
6. *Your website is now publicly accessible to everyone without requiring a Vercel login.*

---

## 📋 Pre-Deployment Checklist

- [ ] A GitHub account with the [NutriLens repository](https://github.com/Nishat009/nutrilens) pushed to `main`.
- [ ] A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
- [ ] A free [Render](https://render.com) account.
- [ ] A free [Vercel](https://vercel.com) account.
- [ ] *(Optional)* [Google AI Studio API Key](https://aistudio.google.com/) for Gemini 1.5 Flash Vision.
- [ ] *(Optional)* [Hugging Face User Access Token](https://huggingface.co/settings/tokens) for Food-101 Vision model.

---

## Step 1: Set Up MongoDB Atlas Database

1. **Create an Account & Cluster**:
   - Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Click **Create Database** and choose the **M0 Free** shared tier.
   - Select the cloud provider and region closest to your target users.
   - Click **Create**.

2. **Create Database User**:
   - Go to **Security** → **Database Access** in the left sidebar.
   - Click **Add New Database User**.
   - Select **Password Authentication**.
   - Username: `nutrilens_admin` (or your choice).
   - Password: Click **Autogenerate Secure Password** or set a strong password. *(Save this securely)*.
   - Database User Privileges: **Read and write to any database**.
   - Click **Add User**.

3. **Configure Network Access (IP Whitelist)**:
   - Go to **Security** → **Network Access** in the left sidebar.
   - Click **Add IP Address**.
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`) so Render instances can connect dynamically.
   - Click **Confirm**.

4. **Obtain Connection String**:
   - Go to **Deployment** → **Database**.
   - Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the SRV connection URI:
     ```
     mongodb+srv://nutrilens_admin:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.

---

## Step 2: Deploy Backend API to Render

You can deploy the backend using **Render Blueprint (`render.yaml`)** or manual setup.

### Option A: Deploy via Render Blueprint (Recommended)
1. In [Render Dashboard](https://dashboard.render.com/), click **New +** → **Blueprint**.
2. Connect your `Nishat009/nutrilens` repository.
3. Render will detect `render.yaml` at the root and pre-configure the `nutrilens-api` service.
4. Input your `MONGODB_URI` and optional `GEMINI_API_KEY` when prompted.
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. In [Render Dashboard](https://dashboard.render.com/), click **New +** → **Web Service**.
2. Connect your `Nishat009/nutrilens` GitHub repository.
3. Fill in the service configuration:
   | Setting | Value |
   |---|---|
   | **Name** | `nutrilens-api` |
   | **Region** | Closest region (e.g., Frankfurt, Singapore, Oregon) |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm ci` (installs exactly what `package-lock.json` pins; same as `render.yaml`) |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

4. Configure **Environment Variables**:
   | Key | Value | Purpose |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations |
   | `PORT` | `10000` | Port assigned by Render |
   | `MONGODB_URI` | `mongodb+srv://nutrilens_admin:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority` | **Required.** MongoDB Atlas URI |
   | `JWT_SECRET` | 96-char random hex (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) | **Required.** Signs login tokens; the API refuses tokens in production without it |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` | **Required** when the web app sets `NEXT_PUBLIC_API_URL` (browser calls the API directly). Comma-separated; no other origin is allowed |
   | `DEMO_MODE` | `true` only for a showcase deployment | Enables `POST /api/auth/demo-login` (404 without it). See the warning below |
   | `DEMO_SHOWCASE` | `true` with `DEMO_MODE=true` | **Required** with `DEMO_MODE=true` in production: confirms the database holds sample data only. Without it the API exits at startup |
   | `GEMINI_API_KEY` | `AIzaSy...` *(optional)* | Google Gemini 1.5 Flash Vision AI key |
   | `HF_TOKEN` | `hf_...` *(optional)* | Hugging Face Food-101 Vision token |

   > ⚠️ **`DEMO_MODE` and real data.** `DEMO_MODE=true` lets anyone open the one-click demo member and the
   > demo admin. The demo admin cannot change anything (`blockDemoWrites`) and sees real members only with a
   > masked name and email and no health data, but it is still a public view of the admin panel. Use
   > `DEMO_MODE=true` only for a showcase deployment that holds sample data. For a production deployment with
   > real members, set `DEMO_MODE=false` (or leave it unset: it is off by default when `NODE_ENV=production`).
   > To enforce this, the API **refuses to start** when `NODE_ENV=production` and `DEMO_MODE=true` unless
   > `DEMO_SHOWCASE=true` is also set.

5. Click **Create Web Service**.
6. Wait 1–2 minutes for the deployment to finish.
7. Your public backend URL will look like:
   ```
   https://nutrilens-api.onrender.com
   ```
8. **Verify Backend Health**:
   Visit `https://nutrilens-api.onrender.com/api/health` in your browser. Expected response:
   ```json
   {
     "success": true,
     "code": 200,
     "message": "NutriLens API service is healthy",
     "status": "ok",
     "service": "NutriLens API",
     "database": {
       "status": "connected",
       "connected": true
     }
   }
   ```

---

## Step 3: Seed Database with Nutrition & Botanical Data

Populate your production MongoDB Atlas cluster with 100+ botanical profiles, curated diet plans, and USDA nutrition standards.

From your local terminal, run:

```bash
# Windows PowerShell
$env:MONGODB_URI="mongodb+srv://nutrilens_admin:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority"
npm run seed

# macOS / Linux / Git Bash
MONGODB_URI="mongodb+srv://nutrilens_admin:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority" npm run seed
```

Output confirmation:
```
🌱 Seeding NutriLens Database...
✅ Cleared existing collections.
🌿 Seeded 100+ Botanical & Vegetable profiles.
🥗 Seeded curated Diet Protocols & Daily Plans.
🍽️ Seeded USDA Nutrition Reference Database.
🎉 Database seeding completed successfully!
```

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select and import your GitHub repository (`Nishat009/nutrilens`).
3. In the **Configure Project** modal:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and set to **`web`** *(CRITICAL: The Next.js frontend is located in `/web`)*.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `.next` (default).
   - **Install Command**: `npm ci` (installs exactly what `web/package-lock.json` pins).

4. In **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://nutrilens-api.onrender.com` | **Required at build time.** Your Render backend URL from Step 2; `next.config.ts` rewrites `/api/*` to it and the browser client calls it. Add the Vercel URL to `CORS_ORIGINS` on Render |
   | `NEXT_PUBLIC_DEMO_MODE` | `true` / `false` | Shows the one-click demo buttons; match the API's `DEMO_MODE` |

5. Click **Deploy**.
6. Once deployed, disable **Vercel Authentication** (see section at the top of this guide) to make your deployment public.

---

## Step 5: Post-Deployment Smoke Test & Verification

Run the automated check first. It calls `/api/health` and both one-click demo logins through the Vercel
rewrite and prints PASS / FAIL for each:

```bash
cd server && npm run verify:live -- https://your-app.vercel.app
```

Then perform these tests on your live Vercel URL (e.g. `https://nutrilens.vercel.app`):

| Test Area | Action | Expected Result |
|---|---|---|
| **Health Check** | Visit `https://your-app.vercel.app/api/health` | Returns JSON status `{ "database": { "connected": true } }` via Next.js reverse proxy |
| **Landing Page** | Open root `/` | Marketing hero, feature cards, and "Launch Dashboard" button load instantly |
| **Onboarding** | Visit `/onboarding` | Completes Mifflin-St Jeor BMR/TDEE calculation and sets initial goal |
| **AI Food Scanner** | Visit `/scan`, upload an image (e.g. carrot, tomato, or meal) | Multimodal AI identifies food item, estimates portions, and renders macro breakdown |
| **Portion Adjustments** | Change grams/unit on scanned food | Calories, protein, carbs, fat, and fiber dynamically recalculate in real-time |
| **Meal Logging** | Click "Add to Today's Meals" on scan results | Meal appears immediately under `/meals` and `/dashboard` timeline |
| **Dashboard Gauges** | Visit `/dashboard` | Circular calorie budget gauge, macro meters, and water tracker display live numbers |
| **Vegetable Explorer** | Visit `/vegetables` | Browse and filter 100+ botanical profiles, view 100g USDA breakdowns & health benefits |
| **Diet Protocols** | Visit `/diets` | Explore diet plans (Keto, Mediterranean, High Protein) and activate chosen protocol |
| **Weekly Planner** | Visit `/planner` | Schedule meals across Monday–Sunday grid with daily aggregate macro sums |
| **Weight Analytics** | Visit `/progress` | Interactive Recharts graph displays historical weight trajectory and compliance trends |

---

## 🔧 Troubleshooting & FAQ

### 1. Render Free Tier Cold Starts
- **Symptom**: The first API request after 15 minutes of inactivity takes 30–50 seconds to respond.
- **Cause**: Render spins down free tier web services during idle periods.
- **Solution**: The frontend handles cold starts gracefully with automatic retry headers. For zero-latency uptime, upgrade to Render's starter tier ($7/mo) or use a free uptime monitor (e.g., UptimeRobot) pinging `/api/health` every 10 minutes.

### 2. CORS Errors in Browser Console
- **Symptom**: `Access to fetch at ... has been blocked by CORS policy`.
- **Solution**: The API only allows the origins in `CORS_ORIGINS` (comma-separated, e.g. `https://your-app.vercel.app`). Add your exact Vercel URL there on Render and redeploy. Requests that go through the `next.config.ts` `/api/*` rewrite are same-origin and need no CORS.

### 3. MongoDB Connection Timeout (`MongooseServerSelectionError`)
- **Symptom**: Server logs show `MongoServerSelectionError: connection timed out`.
- **Solution**: In MongoDB Atlas, check **Security** → **Network Access** and ensure `0.0.0.0/0` (Allow Access from Anywhere) is active. Also check that your database username and password in `MONGODB_URI` are URL-encoded if they contain special characters (`@`, `!`, `#`).

### 4. Large Image Upload Payloads (413 Payload Too Large)
- **Symptom**: Uploading high-resolution camera photos produces HTTP 413.
- **Solution**: The browser downscales uploads and camera captures to 1024 px before sending. The API accepts JSON bodies up to `BODY_LIMIT` (default `5mb`) and scan photos up to `MAX_SCAN_IMAGE_BYTES` (default 3 MB); larger photos get a clear 422 message.

### 5. Gemini API Key Limits or Network Outages
- **Symptom**: Food scan falls back to chromatic analysis.
- **Solution**: NutriLens features a resilient 3-tier fallback architecture:
  1. Google Gemini 1.5 Flash Vision (primary multimodal AI)
  2. Hugging Face Food-101 Open Vision Model (secondary neural network)
  3. Chromatic Visual Signature Engine & Botanical Database matching (offline-ready client/server fallback)

---

## 📄 License & Maintainer

Maintained by [@Nishat009](https://github.com/Nishat009). Licensed under the [MIT License](LICENSE).
