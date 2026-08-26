# 📊 Business Requirements Document (BRD)
## Project: NutriLens — Digital Clinical AI Nutritionist SaaS

---

## 1. Executive Summary
NutriLens addresses the primary barrier to long-term health and weight management: tedious manual calorie counting and generic diet advice. By leveraging on-device computer vision and evidence-based clinical nutrition, NutriLens provides instant visual food identification, self-learning visual memory, tailored clinical diets, and dynamic 30-day metabolic forecasting.

---

## 2. Business Objectives & Value Proposition
- **Zero API Dependency**: Eliminate expensive third-party vision API costs by providing browser-native neural networks and localized vegetable databases.
- **Continuous Retention Loop**: Visual memory (`dHash`) learns from user corrections, increasing recognition accuracy with every use.
- **Clinical Personalization**: Dynamic macro target alignment based on selected medical diet protocols (Keto, Mediterranean, Low-GI Diabetes Care, etc.).
- **Actionable Metabolic Guidance**: Concrete non-exercise activity (NEAT) alternatives for users without time for gym workouts.

---

## 3. Target Audience & Personas
1. **Health-Conscious Individuals & Fat Loss Seekers**:
   - Want effortless meal logging and clear forecasts of weight changes over 30 days.
2. **Clinical Diet Adherents (Keto, Diabetes, PCOS, Heart Health)**:
   - Need strict real-time warnings when a scanned food violates their protocol.
3. **Gym Enthusiasts & Athletes**:
   - Require high-protein macro precision ($2.0\text{g} - 2.4\text{g/kg}$) and weekly meal planning.

---

## 4. Key Performance Indicators (KPIs)
- **Log Friction Reduction**: < 3 seconds from photo capture to nutritional breakdown.
- **Diet Compliance Rate**: > 85% adherence through instant violation warnings.
- **Active Engagement**: Daily hydration logging and NEAT alternative habit completion.

---

## 5. Security, Compliance & Deployment
- **Client Security**: Modern responsive layout with glassmorphic UI tokens.
- **Server Deployment**: Express API ready for Render with trust proxy support.
- **Database**: MongoDB Atlas M0 / Local MongoDB 8 with Mongoose schemas.
