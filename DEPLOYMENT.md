# NutriLens Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide walks you through deploying **NutriLens** to production with **Vercel** hosting the Next.js frontend and **Render** hosting the Express + MongoDB backend.

---

## ⚠️ Why was your Vercel URL asking for a Login?

If visiting your Vercel URL showed **"Protected Deployment — Log in to Vercel"**, this is because Vercel's **Deployment Protection / Vercel Authentication** is enabled on your project preview deployments.

### How to make your Vercel site Public in 10 seconds:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click on your **`nutrilens`** project.
3. Click **Settings** (top tab) → **Deployment Protection** (left sidebar).
4. Under **Vercel Authentication**, toggle it **OFF** (or set to **Disabled**).
5. Click **Save**.
6. Now anyone can access your live website directly without needing a Vercel account!

---

## 🏗️ Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │             Vercel (Next.js 15)              │
                        │        https://nutrilens.vercel.app          │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               │ NEXT_PUBLIC_API_URL
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │          Render (Express API Server)         │
                        │       https://nutrilens-api.onrender.com     │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               │ MONGODB_URI
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │        MongoDB Atlas (Cloud Database)        │
                        └──────────────────────────────────────────────┘
```

---

## Part 1: Deploy Backend to Render

### Step 1: Create a Free MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in or register.
2. Create a free **M0 Cluster**.
3. Under **Security** → **Database Access**: Create a database user (e.g. `nutrilens_admin` with a secure password).
4. Under **Security** → **Network Access**: Click **Add IP Address** → choose **Allow Access From Anywhere** (`0.0.0.0/0`).
5. In **Database** → Click **Connect** → Choose **Drivers (Node.js)** and copy your connection string:
   ```
   mongodb+srv://nutrilens_admin:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual database user password).*

---

### Step 2: Deploy to Render Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `Nishat009/nutrilens`.
3. Configure the settings:
   - **Name**: `nutrilens-api`
   - **Region**: Closest to you (e.g. Frankfurt / Singapore / Oregon)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Environment Variables**, add the following:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render default port |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string from Step 1 |
   | `HF_TOKEN` | *(optional)* | Free Hugging Face token for Food-101 vision model |
5. Click **Create Web Service**.
6. Wait 1–2 minutes for the build to finish.
7. Render will provide your public URL:
   `https://nutrilens-api.onrender.com` (or similar).
8. Verify the health check by visiting:
   `https://nutrilens-api.onrender.com/api/health`
   You should see:
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

## Part 2: Deploy Frontend to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`Nishat009/nutrilens`).
4. In the **Configure Project** screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and set it to **`web`** *(CRITICAL: This tells Vercel where the Next.js app is located!)*
   - **Build Command**: Leave default (`npm run build`)
   - **Output Directory**: Leave default (`.next`)
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://nutrilens-api.onrender.com` *(your Render backend URL from Part 1)* |
6. Click **Deploy**.
7. Once deployed:
   - Go to **Settings** → **Deployment Protection**.
   - Make sure **Vercel Authentication** is **Disabled** so that your site is public for all visitors.

---

## Part 3: Verification & Live Testing

1. **Test Frontend Live**: Open your Vercel URL (e.g. `https://nutrilens.vercel.app` or your production domain).
2. **Test Food Scanning**: Go to `/scan`, upload or pick a food sample, test portion adjustments, and click **Add to Today's Meals**.
3. **Check Dashboard**: Navigate to `/dashboard` to verify nutrition summaries, macro charts, and logged meal history.
4. **Check Health**: Visit `https://your-vercel-app.vercel.app/api/health` to confirm the Next.js rewrite forwards directly to your Render backend API!

