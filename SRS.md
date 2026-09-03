# 📋 Software Requirements Specification (SRS)
## Project: NutriLens — Vision-Based AI Nutrition & Fitness Intelligence Platform

---

## 1. Introduction
### 1.1 Purpose
This document provides a comprehensive technical specification for the **NutriLens** system. NutriLens is a multimodal AI health-tech platform that combines on-device neural computer vision, perceptual hashing visual memory, 100+ ingredient nutritional modeling, clinical diet protocols, and metabolic expenditure analytics.

### 1.2 Scope
- **Vision Engine**: Client-side TensorFlow.js MobileNetV2 with fallback chromatic color analysis and 64-bit perceptual difference hashing (`dHash`) for continuous self-learning.
- **Personalized Diet & 7-Day Plan Engine**: 8-step onboarding assessment, Mifflin-St Jeor BMR/TDEE with safety floors (1,200/1,500 kcal), multi-factor diet ranking, Bangladeshi food adaptation, household portion guides, 1-click food swaps, and 2–3 week adaptive reviews.
- **Nutritional Database**: 100+ items calibrated with ICMR and USDA standards including authentic Bangladeshi staples (Lal Chal, Atta Roti, Rui, Katla, Ilish, Desi Murgi, Dal, Shak/Bhaji, Tok Doi, Mustard Oil).
- **Clinical Protocols**: 7 evidence-based dietary regimens (Mediterranean, Keto, High-Protein, Intermittent Fasting, Low-GI Diabetes Care, DASH, Plant-Based).
- **Personalized Metabolism**: Dynamic 30-day fat loss projections, hydration prescription (weight/height based), and NEAT non-exercise activity alternatives.

---

## 2. Overall Description
### 2.1 System Architecture
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand 5, Lucide Icons, Recharts.
- **Backend API**: Node.js, Express.js 4.21, REST architecture, CORS enabled, Trust Proxy support.
- **Database**: MongoDB 8 with Mongoose schemas (User, Food, Meal, FoodScan, DietPlan, PlannedMeal, WeightLog, LearnedFoodMatch).
- **Client Vision**: TensorFlow.js in-browser execution with zero mandatory external API keys.

### 2.2 System Features & Modules
1. **Personalized Diet Recommendation & 7-Day Planner (`/onboarding`, `/diets`)**:
   - 8-step onboarding flow (Biometrics, 8 Goals + Pacing, Activity, 15+ Health Conditions & Safety Alerts, Food Preferences, Hard Allergy Exclusions, Lifestyle).
   - Multi-factor clinical protocol ranking with "Why selected" and "Why ranked lower" rationale.
   - Interactive 7-Day meal plan with household measurements (*cups*, *palm-sized pieces*, *bowls*, *rotis*, *teaspoons*).
   - Instant food swap modal with macro-aligned, allergy-safe local alternatives.
   - 2–3 week adaptive progress check-in modal.
   - 1-click adoption to Weekly Planner (`/planner`) and user nutrition goals.
2. **Multimodal Food Scanner (`/scan`)**:
   - Camera capture & image upload.
   - On-device classification + visual memory matching (`dHash`).
   - Direct manual vegetable search and instant auto-teaching.
   - Real-time macro calculations and portion sliders.
3. **Clinical AI Nutritionist Dashboard (`/dashboard`)**:
   - Zero fake data clean initial state for new users.
   - 30-day dynamic predictive weight loss engine ($7,700 \text{ kcal} = 1\text{ kg fat}$).
   - Hydration tracker with ml and 250ml glasses count.
   - Physical activity and NEAT no-gym habits toggle.
   - Active diet protocol status and superfood suggestions.
4. **Diet Protocol Explorer (`/diets`, `/diets/[slug]`)**:
   - 7 evidence-based protocols with full clinical mechanisms.
   - Switcher between personalized plan and full scientific protocols catalog.
5. **Meal Logs & History (`/meals`, `/meals/[id]`)**:
   - Complete CRUD tracking for Breakfast, Lunch, Dinner, Snacks.
6. **Weekly Meal Planner (`/planner`)**:
   - 7-day schedule with planned meal slots and macronutrient tallies.
7. **Health Trends & Analytics (`/progress`)**:
   - Weight logging, trend graphs, and 30-day aggregated macro adherence.

---

## 3. External Interface Requirements
### 3.1 REST API Standards
- **Success Status**: `200 OK`
- **Error / Validation Status**: `422 Unprocessable Entity`
- **Standard JSON Envelope**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Operation completed successfully",
    "data": {}
  }
  ```

---

## 4. Non-Functional Requirements
- **Responsive Breakpoints**: 100% responsive and verified across `320px`, `375px`, `390px`, `430px`, `768px`, `1024px`, `1280px`, `1366px`, `1440px`, and `1920px`.
- **Privacy & Performance**: On-device vision processing ensures image privacy and ultra-fast offline fallback.
- **Data Integrity**: MongoDB ObjectId resolution and schema validation across all collections.

## 5. Implemented Runtime Constraints
- Authentication is required for dashboard and user-owned data endpoints. Passwords are hashed with Node.js `crypto.scrypt`, and sessions use signed bearer tokens with a seven-day expiry.
- All documented success responses use HTTP `200`; validation, authentication, and application errors use HTTP `422`.
- Scan analysis is stored as a `FoodScan` record after successful analysis. Unknown or unavailable recognition returns low confidence and requires manual review.
- User-owned meals, scans, planner slots, progress logs, profiles, and personalized plans are filtered by the authenticated user identity.
