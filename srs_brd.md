## Implementation Status

The current implementation includes the personalized diet engine, Bangladeshi food dataset, authenticated user sessions, user-scoped persistence for meals/scans/planner/progress, and honest low-confidence handling for unavailable food recognition. Two-factor authentication is intentionally deferred.

Runtime convention: successful operations return `200`; validation, authentication, and application errors return `422`.
# 📋 Unified Software Requirements & Business Requirements Document (SRS & BRD)
## Project: NutriLens — AI Vision & Clinical Nutrition Intelligence Platform

---

# SECTION 1: BUSINESS REQUIREMENTS DOCUMENT (BRD)

## 1. Executive Summary & Problem Statement
NutriLens bridges the critical gap between complex clinical dietary advice and everyday eating habits. Traditional calorie-counting apps rely on foreign food databases and generic calorie targets that fail in real-world cultural contexts (e.g., South Asian and Bangladeshi diets). 

NutriLens provides:
1. Instant on-device computer vision recognition without mandatory third-party API costs.
2. An 8-step personalized nutrition onboarding assessment calculating exact BMR/TDEE and safe caloric floors.
3. Multi-factor clinical matching across 7 peer-documented diet protocols.
4. Deep Bangladeshi food adaptation with practical household portion sizes.
5. Interactive 7-day meal schedules, instant food swaps, and 2–3 week adaptive progress reviews.

---

## 2. Business Goals & Value Proposition
- **High Retention & Personalization**: Users receive meal plans that incorporate their everyday staples (*Lal Chal*, *Atta Roti*, *Rui/Katla fish*, *Dal*, *Lal Shak*, *Tok Doi*) instead of generic foreign foods.
- **Clinical Safety First**: Enforces minimum safe calorie floors (1,200 kcal/day for women, 1,500 kcal/day for men) and flags doctor consultation requirements for conditions like kidney disease, pregnancy, and diabetes medication.
- **Zero API Lock-in**: Browser-native TensorFlow.js vision and internal 100+ ingredient database minimize operating infrastructure costs.
- **Continuous Adaptive Coaching**: 2–3 week progress check-ins prevent weight loss plateaus and prevent extreme caloric restriction.

---

## 3. User Personas & Target Segments
1. **Bangladeshi Health & Weight Loss Seekers**:
   - Want sustainable fat loss without completely eliminating rice or home-cooked meals.
2. **Users with Metabolic & Chronic Health Conditions (Diabetes, Prediabetes, PCOS, Hypertension)**:
   - Need evidence-based protocol matching (Low-GI Care, DASH Protocol) with strict sodium/sugar controls.
3. **Athletes, Bodybuilders & Gym Enthusiasts**:
   - Require high-protein density ($1.6\text{g} - 2.2\text{g/kg}$), precise macronutrient distribution, and weekly planner synchronization.
4. **Plant-Based & Vegetarian Eaters**:
   - Need botanical meal plans meeting complete amino acid profiles using lentils, chickpeas, and tofu.

---

## 4. Key Performance Indicators (KPIs)
- **Onboarding Completion Rate**: > 80% completion of the 8-step assessment.
- **Diet Plan Adherence Rate**: > 75% adherence facilitated by 1-click food substitutions.
- **Response Latency**: < 100ms for recommendation generation and food swap queries.
- **Zero Allergen Leakage**: 100% hard exclusion compliance for user-selected allergens.

---

# SECTION 2: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 1. System Architecture & Tech Stack
- **Frontend Layer**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand 5, Lucide Icons, Recharts.
- **Backend API Layer**: Node.js, Express.js 4.21, REST architecture, CORS enabled, Trust Proxy support.
- **Database Layer**: MongoDB 8 with Mongoose schemas (`User`, `DietPlan`, `Food`, `Meal`, `FoodScan`, `PlannedMeal`, `WeightLog`, `LearnedFoodMatch`).
- **Computer Vision Pipeline**: In-browser TensorFlow.js MobileNetV2 + 64-bit gradient perceptual difference hashing (`dHash`).

---

## 2. Functional Requirements & Feature Modules

### 2.1 Personalized Diet Recommendation Engine
- **FR-01 (Biometric Calculation)**: Computes Mifflin-St Jeor BMR and TDEE using physical activity multipliers ($1.2$ to $1.9$).
- **FR-02 (Safe Caloric Deficit/Surplus)**: Calibrates calorie targets based on chosen pace (Slow -300 kcal, Moderate -450 kcal, Faster -600 kcal) with strict female (1,200 kcal) and male (1,500 kcal) safety floors.
- **FR-03 (Multi-Factor Diet Matching)**: Ranks all 7 scientific protocols based on Goal (40%), Health conditions (30%), Preferences (15%), and Sustainability (15%). Provides transparent "Why selected" and "Why ranked lower" rationale.
- **FR-04 (Bangladeshi Adaptation & 7-Day Plan)**: Structures 7 full days with household portion units (*cups*, *palm-sized pieces*, *bowls*, *rotis*, *measured teaspoons*).
- **FR-05 (Hard Allergy Exclusions)**: Eliminates user-selected allergens (dairy, egg, fish, seafood, peanut, treenut, gluten, soy) from all meals.
- **FR-06 (Food Swap Alternatives)**: Generates 3+ macro-matched, allergy-free local substitutes upon user request.
- **FR-07 (2–3 Week Adaptive Review)**: Analyzes weekly weight change, hunger (1–5), energy (1–5), and adherence to deliver actionable micro-adjustments.
- **FR-08 (Weekly Planner Synchronization)**: Synchronizes personalized daily meal slots with the user's weekly planner (`/planner`) and active profile goals.

### 2.2 Computer Vision Food Scanner (`/scan`)
- **FR-09 (Capture & Classification)**: Camera capture and image upload with instant macro breakdown.
- **FR-10 (Perceptual Visual Memory)**: Stores 64-bit `dHash` on manual user corrections for 100% confidence future matching.

### 2.3 Dashboard & Nutrition Tracking (`/dashboard`, `/meals`, `/progress`)
- **FR-11 (Dynamic Fat Loss Projection)**: Live 30-day weight trajectory calculation based on caloric deficit ($7,700 \text{ kcal} = 1\text{ kg fat}$).
- **FR-12 (Hydration & NEAT Tracking)**: Weight/height-based water target and non-gym activity logs.

---

## 3. External Interface & REST API Standards

### 3.1 Standard Response Envelopes
- **Success (`200 OK`)**:
  ```json
  {
    "success": true,
    "code": 200,
    "message": "Operation completed successfully",
    "data": {}
  }
  ```
- **Error / Validation Failure (`422 Unprocessable Entity`)**:
  ```json
  {
    "success": false,
    "code": 422,
    "errors": ["Detailed description of error"]
  }
  ```

### 3.2 Diet API Endpoints
- `GET /api/diets` — List all 7 protocols (Status: `200`)
- `GET /api/diets/:slug` — Protocol details (Status: `200` / `422`)
- `POST /api/diets/adopt` — Adopt protocol (Status: `200` / `422`)
- `POST /api/diets/recommend` — Generate personalized diet plan (Status: `200` / `422`)
- `POST /api/diets/swap-food` — Retrieve swap alternatives (Status: `200` / `422`)
- `POST /api/diets/adaptive-review` — Calculate 2-3 week adjustment (Status: `200` / `422`)

---

## 4. Non-Functional Requirements & Responsive Viewports

### 4.1 Responsive Viewport Breakpoints
All UI layouts are tested and optimized across the following 10 standard breakpoints:
- `320px`: Ultra-compact mobile (iPhone SE)
- `375px`: Standard compact mobile
- `390px`: Modern standard mobile (iPhone 13/14/15)
- `430px`: Large smartphone (iPhone Pro Max)
- `768px`: Tablet portrait (iPad)
- `1024px`: Tablet landscape & small laptops (iPad Pro)
- `1280px`: Desktop standard
- `1366px`: Common HD laptop screens
- `1440px`: Full HD desktop displays
- `1920px`: Large desktop / Ultrawide displays

### 4.2 Security & Data Privacy
- Passwords hashed using bcrypt.
- JWT tokens with 7-day expiration.
- On-device vision processing protects user meal photography privacy.
