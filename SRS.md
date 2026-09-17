# 📋 Software Requirements Specification (SRS)
## Project: NutriLens — Vision-Based AI Nutrition & Metabolic Health Intelligence Platform

---

## 1. Introduction
### 1.1 Purpose
This document provides a comprehensive technical specification for the **NutriLens** system. NutriLens is a multimodal AI health-tech platform that combines on-device neural computer vision, perceptual hashing visual memory, verified South Asian & global food composition data, 20 evidence-based clinical diet protocols, medical safety rules aligned with ADA, AHA, and KDIGO, and metabolic expenditure analytics.

### 1.2 Scope
- **Vision Engine**: Client-side TensorFlow.js MobileNetV2 with fallback chromatic color analysis and 64-bit perceptual difference hashing (`dHash`) for continuous self-learning.
- **Nutritional Database**: Verified food composition tables incorporating Bangladeshi bazaar foods and global staples with portion, glycemic, purine, goitrogen, and allergen metadata.
- **Canonical Protocols**: 20 evidence-graded clinical & hormonal regimens (PCOS, Hypothyroidism, Insulin Resistance, DASH Cardio, Low-Purine Gout, Fatty Liver Lifestyle Support, Fertility Prep, etc.) with individualized macro target ranges.
- **Medical Rules Engine**: Context-aware clinical decision support aligned with American Diabetes Association (ADA), American Heart Association (AHA), and KDIGO guidelines.
- **Personalized Metabolism**: Mifflin-St Jeor TDEE, 30-day theoretical energy balance estimation, individualized hydration targets, and NEAT non-exercise activity tracking.

---

## 2. Overall Description
### 2.1 System Architecture
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand 5, Lucide Icons, Recharts.
- **Backend API**: Node.js, Express.js 4.21, REST architecture, Centralized Nutrition Intelligence Service (`nutrition-intelligence.js`).
- **Database**: MongoDB 8 with Mongoose schemas (User, Food, Meal, FoodScan, DietPlan, PlannedMeal, WeightLog, Vegetable, LearnedFoodMatch).
- **Client Vision**: TensorFlow.js in-browser execution with zero mandatory external API keys.

### 2.2 System Features & Modules
1. **Multimodal Food Scanner (`/scan`)**:
   - Camera capture & image upload.
   - On-device classification + visual memory matching.
   - 5-Tier Semantic Compliance Engine: `SAFE` | `CAUTION` | `LIMIT` | `AVOID` | `PROFESSIONAL_REVIEW`.
   - Real-time macro calculations and portion sliders with live risk re-scoring.
2. **Clinical AI Nutritionist Dashboard (`/dashboard`)**:
   - Clean initial state for new users.
   - 30-day estimated energy balance change projection ($7,700 \text{ kcal} = 1\text{ kg fat}$) with educational disclaimers.
   - Personalized hydration tracker (ml and 250ml glasses count).
   - Physical activity and NEAT no-gym habits toggle.
3. **Canonical Diet Protocol Explorer (`/diets`, `/diets/[slug]`)**:
   - 20 evidence-based protocols with physiological mechanism summaries and evidence levels (`strong`, `moderate`, `traditional`, etc.).
   - Pre-adoption safety validation checking eligibility, contraindications, and allergen conflicts.
   - Individualized macro target and TDEE calculation upon adoption.
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
- **Responsiveness**: 100% responsive across Mobile, Tablet, and Desktop.
- **Privacy & Safety**: On-device vision processing ensures image privacy; clinical guardrails prevent automated diagnosis or high-risk medical prescriptions without healthcare professional review.
- **Data Integrity**: Centralized backend nutrition intelligence as the single source of truth.

