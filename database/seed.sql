-- NutriLens demo data (PostgreSQL). Run after database/schema.sql.
--
-- Mirrors the demo data the API creates on start when DEMO_MODE=true
-- (server/src/services/demo-accounts.js) so a reviewer or buyer sees a working system:
--   demo.member@nutrilens.app / Demo@1234   (member)
--   demo.admin@nutrilens.app  / Admin@1234  (read-only admin)
-- These are public showcase logins for the live demo, not real credentials.
-- Passwords are stored as scrypt hashes, the same format the API verifies.
-- The full 20-diet catalog and vegetable catalog are loaded by `npm run seed` in server/.

BEGIN;

INSERT INTO users (id, name, email, password_hash, role, is_demo, gender, dob, height_cm, weight_kg,
                   target_weight_kg, waist_cm, activity_level, primary_goal, goal_pace,
                   health_conditions, food_preferences, common_foods_eaten, onboarding_completed)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Ayesha Rahman', 'demo.member@nutrilens.app',
   'scrypt$ef6c9adbbaeeb5845c60ced8a4a08b9f$e247eab050a02076368b6dccc6fb859d6fea1b145bad5d9cb95e4213535ffd541090608772246dc007759bbcd388ead982f6eeb6d755f2a7a84bdbed11951770',
   'user', TRUE, 'female', '1994-08-12', 160, 68.4, 60, 86, 'lightly_active', 'lose_weight', 'moderate',
   '{pcos}', '{traditional_bangladeshi,balanced}',
   '{"White Rice","Atta Roti","Lentils (Masoor / Moong Dal)","Rui / Katla Fish","Whole Eggs / Boiled Eggs","Lal Shak / Palong Shak"}',
   TRUE),
  ('22222222-2222-4222-8222-222222222222', 'Demo Admin', 'demo.admin@nutrilens.app',
   'scrypt$5ad2bca4a7e830544a496ab23a90cfa6$c5ee11a4338e62a1dc63cf18a116fd05d350ca85eda4dd1093f970e044f61a26978d7762ca2a25c99a6245ac7ff3a2d5c037461b7319d2a2f678ae6bdd1dd5f0',
   'admin', TRUE, 'male', '1990-01-01', NULL, NULL, NULL, NULL, 'moderately_active', 'lose_weight', 'moderate',
   '{}', '{balanced,traditional_bangladeshi}', '{}', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Sample members for the admin panel (no login: random unusable password hash).
INSERT INTO users (name, email, password_hash, gender, dob, height_cm, weight_kg, target_weight_kg,
                   activity_level, primary_goal, health_conditions, food_preferences, is_demo, onboarding_completed)
VALUES
  ('Nadia Islam',     'nadia.islam@example.com',     'scrypt$disabled$disabled', 'female', '1990-02-11', 158, 72, 62, 'sedentary',         'blood_sugar',     '{prediabetes}',                '{traditional_bangladeshi}',            TRUE, TRUE),
  ('Tanvir Hasan',    'tanvir.hasan@example.com',    'scrypt$disabled$disabled', 'male',   '1988-11-03', 175, 88, 78, 'moderately_active', 'lose_weight',     '{hypertension}',               '{balanced}',                           TRUE, TRUE),
  ('Farhana Akter',   'farhana.akter@example.com',   'scrypt$disabled$disabled', 'female', '1996-06-25', 162, 54, 54, 'moderately_active', 'general_health',  '{anemia}',                     '{traditional_bangladeshi,balanced}',   TRUE, TRUE),
  ('Rafiq Chowdhury', 'rafiq.chowdhury@example.com', 'scrypt$disabled$disabled', 'male',   '1979-01-14', 170, 81, 74, 'lightly_active',    'blood_pressure',  '{hypertension,high_cholesterol}', '{balanced}',                        TRUE, TRUE),
  ('Sadia Karim',     'sadia.karim@example.com',     'scrypt$disabled$disabled', 'female', '1992-09-30', 165, 70, 63, 'lightly_active',    'reduce_belly_fat','{thyroid}',                    '{traditional_bangladeshi}',            TRUE, TRUE),
  ('Imran Hossain',   'imran.hossain@example.com',   'scrypt$disabled$disabled', 'male',   '1998-04-18', 180, 70, 76, 'very_active',       'gain_muscle',     '{}',                           '{high_protein}',                       TRUE, TRUE),
  ('Maliha Sultana',  'maliha.sultana@example.com',  'scrypt$disabled$disabled', 'female', '2000-12-05', 157, 49, 52, 'lightly_active',    'general_health',  '{ibs}',                        '{vegetarian}',                         TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

-- Foods
INSERT INTO foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat, fiber, tags)
VALUES
  ('White Rice (cooked)',       'Grains',     100, 'g', 130, 2.7, 28.2, 0.3, 0.4, '{bangladeshi,staple}'),
  ('Atta Roti',                 'Grains',     100, 'g', 297, 9.8, 54.0, 5.0, 7.0, '{bangladeshi,staple}'),
  ('Masoor Dal (cooked)',       'Legumes',    100, 'g', 116, 9.0, 20.1, 0.4, 7.9, '{bangladeshi,protein}'),
  ('Rui Fish Curry',            'Fish',       100, 'g', 130, 17.0, 2.0, 6.0, 0.2, '{bangladeshi,protein}'),
  ('Boiled Egg',                'Eggs',       100, 'g', 155, 12.6, 1.1, 10.6, 0,   '{protein}'),
  ('Lal Shak (cooked)',         'Vegetables', 100, 'g',  23, 2.5, 4.0, 0.3, 2.2, '{bangladeshi,leafy}'),
  ('Banana',                    'Fruits',     100, 'g',  89, 1.1, 22.8, 0.3, 2.6, '{fruit}'),
  ('Plain Yogurt (doi)',        'Dairy',      100, 'g',  61, 3.5, 4.7, 3.3, 0,   '{dairy,bangladeshi}')
ON CONFLICT DO NOTHING;

-- Demo member's weight history
INSERT INTO weight_logs (user_id, date, weight_kg, notes)
SELECT '11111111-1111-4111-8111-111111111111', CURRENT_DATE - (n * 7), 68.4 + n * 0.3, 'Weekly weigh-in'
FROM generate_series(0, 7) AS n;

-- Demo member's meals for today
WITH m AS (
  INSERT INTO meals (id, user_id, type, date, time, total_calories, total_protein, total_carbs, total_fat, total_fiber, notes)
  VALUES
    ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'breakfast', CURRENT_DATE, '08:00', 297, 9.8, 54.0, 5.0, 7.0, 'Roti with egg'),
    ('aaaaaaa2-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'lunch',     CURRENT_DATE, '13:00', 520, 31.0, 62.0, 15.0, 9.0, 'Rice, dal and fish')
  RETURNING id
)
INSERT INTO meal_items (meal_id, food_name, quantity, unit, calories, protein, carbs, fat, fiber, confidence)
VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', 'Atta Roti',        100, 'g', 297, 9.8, 54.0, 5.0, 7.0, 1.0),
  ('aaaaaaa2-0000-4000-8000-000000000002', 'White Rice (cooked)', 150, 'g', 195, 4.1, 42.3, 0.5, 0.6, 1.0),
  ('aaaaaaa2-0000-4000-8000-000000000002', 'Masoor Dal (cooked)', 100, 'g', 116, 9.0, 20.1, 0.4, 7.9, 1.0),
  ('aaaaaaa2-0000-4000-8000-000000000002', 'Rui Fish Curry',      100, 'g', 130, 17.0, 2.0, 6.0, 0.2, 1.0);

-- Weekly planner
INSERT INTO planned_meals (user_id, day_of_week, meal_type, food_name, calories, protein, carbs, fat)
VALUES
  ('11111111-1111-4111-8111-111111111111', 0, 'breakfast', 'Atta Roti with Boiled Egg', 450, 22, 56, 15),
  ('11111111-1111-4111-8111-111111111111', 0, 'lunch',     'Rice, Masoor Dal and Rui Fish', 520, 31, 62, 15),
  ('11111111-1111-4111-8111-111111111111', 0, 'dinner',    'Lal Shak with Roti', 350, 12, 55, 8),
  ('11111111-1111-4111-8111-111111111111', 1, 'breakfast', 'Banana and Plain Yogurt', 200, 5, 40, 3);

-- Sample diet plan (the full 20-diet catalog is loaded by `npm run seed`)
INSERT INTO diet_plans (slug, name, category, tagline, description, full_overview, difficulty,
                        macro_ratio, sample_meal_day, is_featured)
VALUES
  ('mediterranean-wellness', 'Mediterranean Wellness', 'heart-health',
   'Heart-healthy eating built on olive oil, fish, legumes and vegetables.',
   'A flexible, evidence-backed pattern rich in vegetables, whole grains, legumes and healthy fats.',
   'The Mediterranean pattern emphasises plants, fish, olive oil and moderate dairy, with limited red meat and refined sugar.',
   'Easy',
   '{"protein": 20, "carbs": 45, "fat": 35}',
   '{"breakfast": "Greek yogurt with fruit and nuts", "lunch": "Lentil salad with olive oil", "dinner": "Grilled fish with vegetables", "snack": "Handful of almonds"}',
   TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Sample vegetables (full catalog loaded by `npm run seed`)
INSERT INTO vegetables (name, slug, aliases, description, category, calories_per_100g, protein_per_100g,
                        carbs_per_100g, fat_per_100g, fiber_per_100g, scientific_name)
VALUES
  ('Spinach',  'spinach',  '{palong shak}',  'Tender leafy green rich in iron and folate.', 'Leafy Greens',     23, 2.9, 3.6, 0.4, 2.2, 'Spinacia oleracea'),
  ('Carrot',   'carrot',   '{gajor}',        'Crunchy orange root high in beta-carotene.',  'Root Vegetables',  41, 0.9, 9.6, 0.2, 2.8, 'Daucus carota'),
  ('Broccoli', 'broccoli', '{}',             'Cruciferous vegetable high in vitamin C.',    'Cruciferous',      34, 2.8, 6.6, 0.4, 2.6, 'Brassica oleracea var. italica'),
  ('Tomato',   'tomato',   '{tomato}',       'Juicy fruit vegetable rich in lycopene.',     'Nightshades',      18, 0.9, 3.9, 0.2, 1.2, 'Solanum lycopersicum')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
