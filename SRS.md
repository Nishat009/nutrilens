# 📋 Software Requirements Specification (SRS)
## Project: NutriLens — Vision-Based AI Nutrition & Fitness Intelligence Platform

---

## 1. Introduction
### 1.1 Purpose
This document provides a comprehensive technical specification for the **NutriLens** system. NutriLens is a multimodal AI health-tech platform that combines on-device neural computer vision, perceptual hashing visual memory, 100+ ingredient nutritional modeling, clinical diet protocols, and metabolic expenditure analytics.

### 1.2 Scope
- **Vision Engine**: Client-side TensorFlow.js MobileNetV2 with fallback chromatic color analysis and 64-bit perceptual difference hashing (`dHash`) for continuous self-learning.
- **Nutritional Database**: 100+ items calibrated with ICMR and USDA standards including traditional Bengali bazaar vegetables and global fitness staples.
- **Clinical Protocols**: 7 evidence-based dietary regimens (Mediterranean, Keto, High-Protein, Intermittent Fasting, Low-GI Diabetes Care, DASH, Plant-Based).
- **Personalized Metabolism**: Mifflin-St Jeor TDEE, dynamic 30-day fat loss projections, hydration prescription (weight/height based), and NEAT non-exercise activity alternatives.

---

## 2. Overall Description
### 2.1 System Architecture
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand 5, Lucide Icons, Recharts.
- **Backend API**: Node.js, Express.js 4.21, REST architecture, CORS enabled, Trust Proxy support.
- **Database**: MongoDB 8 with Mongoose schemas (User, Food, Meal, FoodScan, DietPlan, PlannedMeal, WeightLog, LearnedFoodMatch).
- **Client Vision**: TensorFlow.js in-browser execution with zero mandatory external API keys.

### 2.2 System Features & Modules
1. **Multimodal Food Scanner (`/scan`)**:
   - Camera capture & image upload.
   - On-device classification + visual memory matching.
   - Direct manual vegetable search and instant auto-teaching.
   - Real-time macro calculations and portion sliders.
2. **Clinical AI Nutritionist Dashboard (`/dashboard`)**:
   - Zero fake data clean initial state for new users.
   - 30-day dynamic predictive weight loss engine ($7,700 \text{ kcal} = 1\text{ kg fat}$).
   - Hydration tracker with ml and 250ml glasses count.
   - Physical activity and NEAT no-gym habits toggle.
   - Active diet protocol status and superfood suggestions.
3. **Diet Protocol Explorer (`/diets`, `/diets/[slug]`)**:
   - 7 evidence-based protocols with full clinical mechanisms.
   - 1-click adoption updating user profile and macro target ratios.
   - Real-time diet violation detection and healthy alternative suggestions.
4. **Meal Logs & History (`/meals`, `/meals/[id]`)**:
   - Complete CRUD tracking for Breakfast, Lunch, Dinner, Snacks.
5. **Weekly Meal Planner (`/planner`)**:
   - 7-day schedule with planned meal slots and macronutrient tallies.
6. **Health Trends & Analytics (`/progress`)**:
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
- **Responsiveness**: 100% responsive across Mobile, Tablet, and Desktop (Mobile Slide-in Drawer, TopBar Hamburger Menu, Mobile Bottom Bar).
- **Privacy & Performance**: On-device vision processing ensures image privacy and ultra-fast offline fallback.
- **Data Integrity**: MongoDB ObjectId resolution and schema validation across all collections.
