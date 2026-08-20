# NutriLens Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide walks you through deploying **NutriLens** to production for free using **Vercel** for the Next.js frontend and **Render** for the Express + Node.js backend.

---

## 🏗️ Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │      Vercel (Next.js App)       │
                        │  https://nutrilens.vercel.app   │
                        └────────────────┬────────────────┘
                                         │  NEXT_PUBLIC_API_URL
                                         ▼
                        ┌─────────────────────────────────┐
                        │     Render (Node.js API)        │
                        │ https://nutrilens-api.onrender.com
                        └────────────────┬────────────────┘
                                         │  MONGODB_URI
                                         ▼
                        ┌─────────────────────────────────┐
                        │   MongoDB Atlas (Cloud Cluster) │
                        └─────────────────────────────────┘
```

---

## Part 1: Deploy Backend to Render

### Option A: 1-Click Render Blueprint (Recommended)
1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](./render.yaml) and configure the `nutrilens-api` service.
5. In the environment variables configuration, add your **`MONGODB_URI`** (e.g. from MongoDB Atlas).
6. Click **Apply**. Render will deploy your API and give you a live URL like:
   `https://nutrilens-api.onrender.com`

---

### Option B: Manual Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `nutrilens-api`
   - **Language**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/nutrilens?retryWrites=true&w=majority` |
   | `HF_TOKEN` | *(Optional) Free Hugging Face token for Food-101 vision model* |
5. Click **Create Web Service**.
6. Note down your backend URL (e.g. `https://nutrilens-api.onrender.com`).
7. Test the health endpoint: `https://nutrilens-api.onrender.com/api/health`.

---

## Part 2: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`web`**
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `.next` (Default)
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://nutrilens-api.onrender.com` *(your Render API URL)* |
5. Click **Deploy**.
6. Vercel will build and launch your site with a custom domain (e.g. `https://nutrilens.vercel.app`).

---

## Part 3: Setting Up MongoDB Atlas (Cloud Database)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) (Free M0 Cluster).
2. Create a free shared cluster.
3. Under **Database Access**, create a user with username and password.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere so Render can connect).
5. Click **Connect** → **Drivers** → Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority
   ```
6. Paste this into Render's `MONGODB_URI` environment variable.

---

## 🧪 Post-Deployment Verification

1. **Verify Backend Health**:
   Visit `https://<your-render-app>.onrender.com/api/health` — should return:
   ```json
   { "success": true, "code": 200, "message": "NutriLens API service is healthy", "status": "ok" }
   ```

2. **Verify Frontend**:
   Visit `https://<your-vercel-app>.vercel.app/scan` and scan a meal.
   Check that food recognition, portion editing, and "Add to Today's Meals" successfully save to your cloud database!
