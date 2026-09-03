# 📊 Business Requirements Document (BRD)
## Project: NutriLens — Digital Clinical AI Nutritionist SaaS

---

## 1. Executive Summary
NutriLens addresses the primary barrier to long-term health and weight management: tedious manual calorie counting and generic diet advice. By leveraging on-device computer vision and evidence-based clinical nutrition, NutriLens provides instant visual food identification, self-learning visual memory, tailored clinical diets, and dynamic 30-day metabolic forecasting.

---

## 2. Business Objectives & Value Proposition
- **Personalized Cultural Adaptation**: Generate tailored diet plans with authentic Bangladeshi food staples (*Lal Chal*, *Atta Roti*, *Rui/Katla fish*, *Dal*, *Lal Shak*, *Tok Doi*, *Mustard oil*) instead of unrealistic foreign meal replacements.
- **Evidence-Based Medical Safety**: Enforce physiological safe calorie floors (1,200 kcal for women, 1,500 kcal for men) and clinical contraindication warnings for conditions like kidney disease and pregnancy.
- **Zero API Dependency**: Eliminate expensive third-party vision API costs by providing browser-native neural networks and localized vegetable databases.
- **Continuous Retention Loop**: Visual memory (`dHash`) and 2–3 week adaptive plan check-ins increase long-term user adherence.
- **Actionable Metabolic Guidance**: Concrete household portion measurements (*cups*, *palm-sized pieces*, *bowls*, *teaspoons*) and NEAT no-gym habits.

---

## 3. Target Audience & Personas
1. **Bangladeshi Health & Weight Loss Seekers**:
   - Want sustainable fat loss without completely eliminating rice or home-cooked meals.
2. **Clinical Diet Adherents (Keto, Diabetes, PCOS, Heart Health)**:
   - Need strict real-time warnings and protocol matching (Low-GI Diabetes Care, DASH).
3. **Gym Enthusiasts & Athletes**:
   - Require high-protein macro precision ($1.6\text{g} - 2.2\text{g/kg}$) and weekly meal planning.
4. **Plant-Based / Vegan Eaters**:
   - Need complete amino acid profile botanical meal schedules.

---

## 4. Key Performance Indicators (KPIs)
- **Onboarding Completion**: > 80% completion through intuitive 8-step wizard.
- **Log Friction Reduction**: < 3 seconds from photo capture to nutritional breakdown.
- **Diet Compliance Rate**: > 85% adherence through 1-click food swaps.
- **Active Engagement**: Weekly adaptive check-in participation and planner synchronization.

---

## 5. Security, Compliance & Deployment
- **Client Security**: Modern responsive layout tested across 320px–1920px viewports with glassmorphic UI tokens.
- **Server Deployment**: Express API ready for Render with trust proxy support and strict 200/422 status codes.
- **Database**: MongoDB Atlas M0 / Local MongoDB 8 with Mongoose schemas.
