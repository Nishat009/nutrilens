# 📊 Business Requirements Document (BRD)
## Project: NutriLens — Vision-Based AI Nutrition & Metabolic Health Intelligence Platform

---

## 1. Executive Summary
NutriLens addresses the primary barriers to long-term metabolic health and nutrition management: tedious manual logging, generic non-individualized dietary advice, and misaligned nutritional recommendations. By pairing browser-native neural computer vision, 64-bit perceptual hashing visual memory, 20 evidence-based clinical diet protocols, and medical safety guardrails aligned with ADA, AHA, and KDIGO, NutriLens provides instant visual food identification, smart multi-candidate swap, validated diet adoption, and metabolic forecasting.

---

## 2. Business Objectives & Value Proposition
- **Zero-Cost Edge Computer Vision**: Eliminates third-party vision API costs by executing neural inference (TensorFlow.js) and chromatic color analysis directly on the user's device.
- **Continuous Self-Learning Loop**: 64-bit perceptual difference hashing (`dHash`) learns from user corrections and manual vegetable selections, ensuring permanent accuracy improvements.
- **Clinical Nutrition Guardrails**: Context-aware clinical decision support aligned with American Diabetes Association (ADA), American Heart Association (AHA), and KDIGO guidelines.
- **Evidence-Graded Protocols**: 20 canonical regimens (PCOS, Hypothyroidism, Insulin Resistance, DASH Cardio, Low-Purine Gout, Fatty Liver Lifestyle Support, Fertility, etc.) with individualized macro target ranges.
- **Actionable Metabolic Forecasts**: 30-day theoretical energy-balance change estimates with medical educational disclaimers.

---

## 3. Target Audience & Clinical Personas
1. **Hormonal & Metabolic Health Seekers (PCOS, Hypothyroidism, Insulin Resistance, NAFLD)**:
   - Require evidence-informed nutrition, low-GI carb choices, and anti-inflammatory food suggestions.
2. **Clinical Diet Adherents (DASH, Low-Purine Gout, CKD Stage Review)**:
   - Need real-time multi-tier feedback (`SAFE`, `CAUTION`, `LIMIT`, `AVOID`, `PROFESSIONAL_REVIEW`) preventing adverse clinical conflicts.
3. **Weight Management & Fitness Athletes**:
   - Require precision macro target calculation, Mifflin-St Jeor TDEE energy budgeting, and weekly meal planning.

---

## 4. Key Performance Indicators (KPIs)
- **Scanning & Swap Speed**: < 2.5 seconds from image capture to 5-tier evaluation and candidate swap.
- **Diet Compliance Accuracy**: 5-tier semantic feedback eliminating false "hard avoids" for healthy staples (e.g. moderate white rice, cooked brassicas).
- **Safety Clearance**: 100% of high-risk medical adoptions (CKD + High Protein, Pregnancy + Keto/Fasting, Underweight + Fasting) guarded by mandatory professional review.

---

## 5. System Standards & Architecture
- **API Standards**: Strict `200 OK` for all success operations, `422 Unprocessable Entity` for validation and domain errors.
- **Dynamic Database Categories**: All botanical, food, and diet categories dynamically populated from MongoDB.
- **Component Architecture**: 100% responsive Next.js 15 App Router components, Tailwind CSS v4, and Zustand state stores.
