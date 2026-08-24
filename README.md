# 🥗 NutriLens — AI Fitness & Nutrition Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey?style=flat&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**NutriLens** is an advanced, full-stack AI-driven health and nutrition platform. It empowers users to photograph meals, analyze nutritional profiles instantly via multimodal computer vision, track daily calories and macronutrients, explore an extensive botanical/vegetable encyclopedia, adopt tailored diet protocols, and plan meals across an interactive 7-day schedule.

---

## 🌟 Key Features

### 📸 1. Multimodal AI Food Scanner & Computer Vision
- **Resilient 3-Tier Recognition Pipeline**:
  - **Google Gemini 1.5 Flash Multimodal Vision API**: High-accuracy food classification and portion estimation directly from camera capture or uploaded photos.
  - **Hugging Face Food-101 Vision Model**: Open-source neural network integration for rapid food item identification.
  - **Chromatic Visual Signature Analyzer**: Intelligent image color-space profiling (HSV/RGB color distribution & shape heuristics) to distinguish fresh produce, curries, grains, and specialty dishes.
  - **Smart Client-Side Fallback Heuristics**: Seamless offline-ready food detection fallback.
- **Interactive Portion & Unit Adjustment**: Real-time recalculation of calories, protein, carbs, fat, and fiber as users change portion sizes or measurement units (grams, ounces, servings, cups, pieces).
- **One-Click Logging**: Directly log scanned meals into today's timeline.

### 🥦 2. Vegetable & Botanical Directory (100+ Items)
- **Comprehensive Botanical Database**: Rich encyclopedia featuring 100+ vegetables, leafy greens, cruciferous varieties, legumes, root crops, alliums, and culinary herbs.
- **Micro & Macronutrient Breakdown**: In-depth nutritional data per 100g raw edible portion based on verified USDA FoodData Central standards, glycemic index, water content, and dietary fiber.
- **Culinary & Health Insights**: Preparation tips, culinary flavor pairings, seasonal availability, and health benefits (cardiovascular, gut health, antioxidants).
- **Advanced Filtering & Instant Search**: Filter by botanical categories, seasonal availability, and health benefits.

### 📊 3. Smart Nutrition & Meal Tracking Dashboard
- **Dynamic Calorie Gauge**: Real-time circular progress visualizer tracking target budget vs. consumed calories.
- **Macronutrient Meters**: Live progress bars for Protein, Carbohydrates, Fats, and Dietary Fiber compared against daily goals.
- **Meal Chronology**: Meal logs grouped by Breakfast, Lunch, Dinner, and Snacks with exact timestamps and individual item breakdowns.
- **Hydration Tracker**: Quick-increment water logger with daily target monitoring.
- **Recent Scans Quick Widget**: Instant access to recent food scans for fast re-logging.

### 🥗 4. Tailored Diet Plans & Protocols
- **Structured Dietary Regimes**: Curated diet plans including **Keto / Low-Carb**, **Mediterranean**, **High Protein Fitness**, **Balanced Clean Eating**, **Plant-Based / Vegan**, and **Intermittent Fasting**.
- **Daily Meal Breakdown**: Step-by-step meal plans with calorie and macro distributions.
- **Active Plan Switching**: Seamlessly activate and follow your preferred diet protocol.

### 📅 5. 7-Day Interactive Weekly Meal Planner
- **Full-Week Scheduling Grid**: Plan meals from Monday through Sunday across all meal slots.
- **Nutritional Balance Overview**: Daily aggregate calorie and macro calculations to ensure balanced weekly nutrition.
- **Diet Plan Integration**: Assign recipes and meals directly from active diet plans.

### 📈 6. Progress Analytics & Weight Tracking
- **Interactive Weight Charts**: Track body weight progression against target milestones powered by Recharts.
- **Compliance & Calorie Trends**: Visualize calorie surplus/deficit and macro distributions over 7-day, 30-day, and 90-day timeframes.
- **Streak & Consistency Metrics**: Track logging streaks and daily consistency.

### 👤 7. Personalized Onboarding & BMR/TDEE Calculator
- **Mifflin-St Jeor Metabolic Engine**: Computes personalized Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on age, gender, height, weight, and activity level.
- **Fitness Goal Customization**: Tailored targets for weight loss, lean muscle gain, maintenance, or athletic performance.
- **Custom Macro Ratio Configuration**: Configurable macro splits (e.g. 40/30/30 or custom ratios).

---

## 🏗️ Architecture & Tech Stack

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
                               │      (Node.js 18+ / Vision AI Engine)        │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      │ MONGODB_URI (TLS/SSL)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │        MongoDB Atlas (Cloud Database)        │
                               │        (M0 Free Tier Cluster / replica)      │
                               └──────────────────────────────────────────────┘
```

### **Frontend (`/web`)**
- **Framework**: Next.js 15+ (App Router), React 19
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS v4, PostCSS, Glassmorphism UI tokens
- **State Management**: Zustand
- **Data Visualization**: Recharts, SVG/Canvas circular gauges
- **Icons & UI**: Lucide React, clsx, tailwind-merge, React Hook Form, Zod

### **Backend (`/server`)**
- **Runtime**: Node.js & Express.js 4.21
- **Database & ODM**: MongoDB Atlas & Mongoose 8.12
- **Middleware**: CORS, Morgan logger, JSON body parser (10MB limit for image payloads)
- **AI & Vision Services**: Google Gemini 1.5 Flash Multimodal Vision API, Hugging Face Inference API, Chromatic Color Extraction & Matching Engine

---

## 📁 Repository Structure

```
nutrilens/
├── DEPLOYMENT.md              # Complete Vercel & Render production deployment guide
├── README.md                  # Project overview & documentation
├── package.json               # Root monorepo workspace scripts
├── render.yaml                # Render Blueprint infrastructure definition
│
├── server/                    # Express.js + MongoDB API Server
│   ├── .env.example           # Backend environment variable template
│   ├── package.json           # Server dependencies & scripts
│   └── src/
│       ├── config/
│       │   └── db.js          # MongoDB Mongoose connection with auto-reconnect
│       ├── controllers/       # Route business logic handlers
│       │   ├── auth.controller.js
│       │   ├── diet.controller.js
│       │   ├── food.controller.js
│       │   ├── meal.controller.js
│       │   ├── planner.controller.js
│       │   ├── progress.controller.js
│       │   ├── scan.controller.js
│       │   ├── user.controller.js
│       │   └── vegetable.controller.js
│       ├── data/              # Rich seed datasets & nutrition databases
│       │   ├── nutrition-database.js
│       │   └── vegetables-data.js (100+ botanical profiles)
│       ├── models/            # Mongoose schemas & data models
│       │   ├── DietPlan.js
│       │   ├── Food.js
│       │   ├── FoodScan.js
│       │   ├── Meal.js
│       │   ├── PlannedMeal.js
│       │   ├── User.js
│       │   ├── Vegetable.js
│       │   └── WeightLog.js
│       ├── routes/            # Express REST route definitions
│       ├── services/          # AI Vision & Nutrition engines
│       │   ├── foodRecognitionService.js
│       │   └── nutrition-engine.js
│       ├── seed.js            # Comprehensive database seeding script
│       └── index.js           # Express application entrypoint
│
└── web/                       # Next.js 15 Frontend Web Application
    ├── .env.example           # Frontend environment variable template
    ├── next.config.ts         # Next.js configuration & API reverse proxies
    ├── package.json           # Frontend dependencies & scripts
    ├── vercel.json            # Vercel deployment configuration
    └── src/
        ├── app/
        │   ├── (auth)/        # Authentication routes (login, register, forgot-password)
        │   ├── (dashboard)/   # Authenticated dashboard views
        │   │   ├── dashboard/ # Daily nutrition overview & calorie gauges
        │   │   ├── diets/     # Diet plans & detailed recipes
        │   │   ├── meals/     # Meal history & custom food logger
        │   │   ├── planner/   # 7-day weekly meal planner
        │   │   ├── profile/   # User profile & goal preferences
        │   │   ├── progress/  # Weight & compliance analytics
        │   │   ├── scan/      # AI Food Scanner & portion selector
        │   │   └── vegetables/# Vegetable & Botanical Explorer
        │   ├── (onboarding)/  # User onboarding & BMR setup flow
        │   ├── layout.tsx     # Global layout with responsive sidebar/navbar
        │   └── page.tsx       # Marketing landing page & live demo
        ├── components/        # Modular UI components
        │   ├── layout/        # Sidebar, Header, MobileNav
        │   ├── scanner/       # FoodScanner, ImageUploader, PortionSelector, DetectedFoodItem
        │   ├── ui/            # Buttons, Cards, Modals, Progress bars, Tooltips
        │   └── vegetables/    # VegetableExplorer, VegetableCard, VegetableDetailModal, VegetableSearch
        ├── data/              # Client-side nutrition & seed databases
        ├── lib/               # Utility functions, validators, types
        └── services/          # API client, vision recognition, and nutrition calculation engines
```

---

## 🚀 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & MongoDB connection status |
| **Auth & User** | | |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & receive session token |
| `GET` | `/api/auth/me` | Get currently authenticated user details |
| `GET` | `/api/users/:id` | Get user profile and nutritional targets |
| `PUT` | `/api/users/:id` | Update user metrics and biological details |
| `PUT` | `/api/users/:id/goal` | Update fitness goal and custom macro splits |
| **AI Food Scan** | | |
| `POST` | `/api/scan/analyze` | Multimodal AI vision analysis (Gemini / Food-101 / Chromatic) |
| `GET` | `/api/scans` | Get recent food scans for current user |
| `POST` | `/api/scans` | Save a new food scan entry |
| `GET` | `/api/scans/:id` | Retrieve specific food scan record |
| **Meals & Nutrition** | | |
| `GET` | `/api/meals` | List logged meals with optional date filtering |
| `POST` | `/api/meals` | Log a meal (Breakfast, Lunch, Dinner, Snack) with items |
| `GET` | `/api/meals/:id` | Fetch specific meal entry by ID |
| `DELETE` | `/api/meals/:id` | Delete a logged meal entry |
| **Foods Database** | | |
| `GET` | `/api/foods` | List food items from the central database |
| `POST` | `/api/foods` | Add a custom food item |
| `GET` | `/api/foods/:id` | Get single food nutritional profile |
| **Vegetables & Botanicals** | | |
| `GET` | `/api/vegetables` | List all vegetables with pagination & category filter |
| `GET` | `/api/vegetables/search` | Search vegetables by name, flavor, or health benefits |
| `GET` | `/api/vegetables/categories` | Get botanical categories with item counts |
| `POST` | `/api/vegetables/match` | Match uploaded food image/attributes against botanical DB |
| `GET` | `/api/vegetables/:idOrSlug` | Get complete profile for a specific vegetable |
| `POST` | `/api/vegetables/:idOrSlug/calculate` | Calculate nutrition for custom portion & unit |
| **Diet Plans & Planner** | | |
| `GET` | `/api/diets` | Retrieve all curated diet protocols |
| `GET` | `/api/diets/:slug` | Retrieve specific diet protocol details & meals |
| `POST` | `/api/diets/adopt` | Adopt / activate a diet plan for user profile |
| `GET` | `/api/planner` | Fetch 7-day scheduled meal planner entries |
| `POST` | `/api/planner` | Assign or update a planned meal slot |
| `DELETE` | `/api/planner/:id` | Remove a planned meal slot |
| **Progress & Analytics** | | |
| `GET` | `/api/progress` | Retrieve calorie compliance, streaks, and macro averages |
| `GET` | `/api/progress/weight` | Fetch historical weight logs |
| `POST` | `/api/progress/weight` | Log a new body weight entry |
| `GET` | `/api/progress/nutrition` | Retrieve detailed nutrition trend logs |

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

### 1. Clone the Repository
```bash
git clone https://github.com/Nishat009/nutrilens.git
cd nutrilens
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server & web dependencies
npm --prefix server install
npm --prefix web install
```

### 3. Configure Environment Variables

**Backend (`server/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nutrilens?retryWrites=true&w=majority
NODE_ENV=development

# Optional AI Vision API Keys:
GEMINI_API_KEY= # (Optional) Google Gemini API Key
HF_TOKEN=       # (Optional) Hugging Face token
```

**Frontend (`web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Seed the Database
Populate MongoDB with default nutrition databases, 100+ vegetable profiles, sample diet plans, and demo meal logs:
```bash
npm run seed
```

### 5. Run Development Servers
Run both backend API and frontend Next.js application concurrently:
```bash
npm run dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📦 Production Build & Deployment

To build the production application locally:

```bash
# Build the Next.js frontend production bundle
npm run build

# Start the Next.js production server
npm run start
```

For complete step-by-step deployment instructions to **Vercel** (Frontend), **Render** (Backend API), and **MongoDB Atlas** (Cloud Database), refer to:

👉 **[Complete Production Deployment Guide (DEPLOYMENT.md)](DEPLOYMENT.md)**

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Runs both Express backend and Next.js frontend concurrently |
| `npm run web` | Starts the Next.js frontend in development mode |
| `npm run server` | Starts the Express.js API server with nodemon |
| `npm run build` | Builds optimized production bundle for Next.js app |
| `npm run start` | Starts Next.js in production mode |
| `npm run seed` | Seeds MongoDB database with nutrition data and vegetable encyclopedia |

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
