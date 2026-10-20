-- NutriLens — database schema (PostgreSQL dialect)
--
-- IMPORTANT: the running application stores its data in MongoDB through
-- Mongoose (server/src/models/*.js). Collections and indexes are created
-- automatically the first time the API starts, so no migration step is needed
-- to run NutriLens:
--
--     cd server && npm run seed     # creates collections + demo data in MongoDB
--
-- This file is the equivalent relational schema. Use it to:
--   * review the data model at a glance,
--   * port NutriLens to a SQL database, or
--   * load the data into an analytics / BI tool.
-- Table and column names are the snake_case form of the Mongoose fields.
-- Embedded Mongo sub-documents (meal items, detected scan items) become child
-- tables. Run seed.sql afterwards for demo data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

BEGIN;

-- ---------------------------------------------------------------- users
-- models/User.js (the nested `goal` document is flattened into goal_* columns)
CREATE TABLE IF NOT EXISTS users (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  email                       TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash               TEXT NOT NULL,            -- scrypt$<salt>$<hash>
  gender                      TEXT CHECK (gender IN ('male', 'female', 'other')),
  dob                         DATE,
  height_cm                   NUMERIC(5, 1),
  weight_kg                   NUMERIC(5, 1),
  target_weight_kg            NUMERIC(5, 1),
  waist_cm                    NUMERIC(5, 1),
  activity_level              TEXT NOT NULL DEFAULT 'moderately_active'
                              CHECK (activity_level IN ('sedentary', 'lightly_active',
                                'moderately_active', 'very_active', 'extra_active')),
  primary_goal                TEXT NOT NULL DEFAULT 'lose_weight',
  goal_pace                   TEXT NOT NULL DEFAULT 'moderate'
                              CHECK (goal_pace IN ('slow_sustainable', 'moderate', 'faster')),
  health_conditions           TEXT[] NOT NULL DEFAULT '{}',
  food_preferences            TEXT[] NOT NULL DEFAULT '{balanced,traditional_bangladeshi}',
  common_foods_eaten          TEXT[] NOT NULL DEFAULT '{Rice,Roti,Dal,Fish,Chicken,Egg,Vegetables}',
  active_diet_id              TEXT,                     -- slug from server/src/nutrition/diet-plans.json
  medical_conditions          TEXT[] NOT NULL DEFAULT '{}',
  medications                 TEXT[] NOT NULL DEFAULT '{}',
  allergies                   TEXT[] NOT NULL DEFAULT '{}',
  dietary_preferences         TEXT[] NOT NULL DEFAULT '{}',
  sleep_hours                 TEXT NOT NULL DEFAULT '6_to_8',
  work_type                   TEXT NOT NULL DEFAULT 'desk_job',
  meal_frequency              SMALLINT NOT NULL DEFAULT 3,
  cooking_habit               TEXT NOT NULL DEFAULT 'family_cooks',
  budget_level                TEXT NOT NULL DEFAULT 'medium',
  avatar_url                  TEXT,
  goal_type                   TEXT NOT NULL DEFAULT 'lose_weight'
                              CHECK (goal_type IN ('lose_weight', 'reduce_belly_fat', 'gain_muscle',
                                'body_recomposition', 'maintain', 'general_health',
                                'blood_sugar', 'blood_pressure')),
  goal_target_calories        INTEGER NOT NULL DEFAULT 2150,
  goal_target_protein_g       INTEGER NOT NULL DEFAULT 160,
  goal_target_carbs_g         INTEGER NOT NULL DEFAULT 210,
  goal_target_fat_g           INTEGER NOT NULL DEFAULT 65,
  goal_target_fiber_g         INTEGER NOT NULL DEFAULT 32,
  goal_target_water_ml        INTEGER NOT NULL DEFAULT 3000,
  goal_weekly_weight_change_kg NUMERIC(4, 2) NOT NULL DEFAULT -0.5,
  goal_is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  personalized_plan           JSONB,
  onboarding_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  password_reset_token_hash   TEXT,                     -- SHA-256 of the emailed token
  password_reset_expires      TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- foods
-- models/Food.js — shared food catalogue (only admins may add rows)
CREATE TABLE IF NOT EXISTS foods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  serving_size  NUMERIC(8, 2) NOT NULL DEFAULT 100,
  serving_unit  TEXT NOT NULL DEFAULT 'g',
  calories      NUMERIC(8, 2) NOT NULL,
  protein       NUMERIC(8, 2) NOT NULL,
  carbs         NUMERIC(8, 2) NOT NULL,
  fat           NUMERIC(8, 2) NOT NULL,
  fiber         NUMERIC(8, 2) NOT NULL DEFAULT 0,
  sugar         NUMERIC(8, 2) NOT NULL DEFAULT 0,
  sodium        NUMERIC(8, 2) NOT NULL DEFAULT 0,
  image_url     TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS foods_name_idx ON foods (name);
CREATE INDEX IF NOT EXISTS foods_search_idx ON foods
  USING GIN (to_tsvector('simple', name || ' ' || category || ' ' || array_to_string(tags, ' ')));

-- ---------------------------------------------------------------- vegetables
-- models/Vegetable.js — reference data, nutrients per 100 g raw edible portion
CREATE TABLE IF NOT EXISTS vegetables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE CHECK (slug = lower(slug)),
  aliases             TEXT[] NOT NULL DEFAULT '{}',
  description         TEXT NOT NULL DEFAULT '',
  visual_description  TEXT NOT NULL DEFAULT '',
  dominant_color      TEXT NOT NULL DEFAULT 'green',
  secondary_colors    TEXT[] NOT NULL DEFAULT '{}',
  shape               TEXT NOT NULL DEFAULT 'irregular',
  piece_weight_grams  NUMERIC(8, 2) NOT NULL DEFAULT 100,
  calories_per_piece  NUMERIC(8, 2) NOT NULL DEFAULT 0,
  piece_unit_label    TEXT NOT NULL DEFAULT '1 medium piece (~100g)',
  category            TEXT NOT NULL CHECK (category IN ('Root Vegetables', 'Leafy Greens',
                        'Cruciferous', 'Nightshades', 'Gourds & Squashes', 'Podded & Legumes',
                        'Allium', 'Mushroom & Fungi', 'Stems & Shoots', 'Fruit Vegetables',
                        'Tubers & Corms', 'Herbs & Aromatics')),
  image_url           TEXT NOT NULL DEFAULT '/vegetables/default-vegetable.webp',
  thumbnail_url       TEXT NOT NULL DEFAULT '',
  calories_per_100g   NUMERIC(8, 2) NOT NULL CHECK (calories_per_100g >= 0),
  protein_per_100g    NUMERIC(8, 2) NOT NULL CHECK (protein_per_100g >= 0),
  carbs_per_100g      NUMERIC(8, 2) NOT NULL CHECK (carbs_per_100g >= 0),
  fat_per_100g        NUMERIC(8, 2) NOT NULL CHECK (fat_per_100g >= 0),
  fiber_per_100g      NUMERIC(8, 2) NOT NULL CHECK (fiber_per_100g >= 0),
  sugar_per_100g      NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (sugar_per_100g >= 0),
  sodium_mg           NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (sodium_mg >= 0),
  potassium_mg        NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (potassium_mg >= 0),
  vitamin_c_mg        NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (vitamin_c_mg >= 0),
  vitamin_a_iu        NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (vitamin_a_iu >= 0),
  calcium_mg          NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (calcium_mg >= 0),
  iron_mg             NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (iron_mg >= 0),
  serving_size        NUMERIC(8, 2) NOT NULL DEFAULT 100,
  serving_unit        TEXT NOT NULL DEFAULT 'g',
  preparation_state   TEXT NOT NULL DEFAULT 'raw',
  source              TEXT NOT NULL DEFAULT 'USDA FoodData Central',
  source_reference    TEXT NOT NULL DEFAULT 'USDA FoodData Central / SR Legacy (Raw Edible Portion per 100g)',
  scientific_name     TEXT NOT NULL DEFAULT '',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vegetables_name_idx ON vegetables (name);
CREATE INDEX IF NOT EXISTS vegetables_category_idx ON vegetables (category);
CREATE INDEX IF NOT EXISTS vegetables_active_idx ON vegetables (is_active);
CREATE INDEX IF NOT EXISTS vegetables_search_idx ON vegetables
  USING GIN (to_tsvector('simple', name || ' ' || array_to_string(aliases, ' ') || ' ' || category || ' ' || description));

-- ---------------------------------------------------------------- meals
-- models/Meal.js — one row per logged meal; totals are derived from meal_items
CREATE TABLE IF NOT EXISTS meals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  date            DATE NOT NULL,
  time            TEXT NOT NULL CHECK (time ~ '^[0-2][0-9]:[0-5][0-9]$'),  -- HH:mm
  total_calories  NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (total_calories >= 0),
  total_protein   NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (total_protein >= 0),
  total_carbs     NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (total_carbs >= 0),
  total_fat       NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (total_fat >= 0),
  total_fiber     NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (total_fiber >= 0),
  image_url       TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meals_user_idx ON meals (user_id);
CREATE INDEX IF NOT EXISTS meals_user_date_idx ON meals (user_id, date);

CREATE TABLE IF NOT EXISTS meal_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     UUID NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  food_id     UUID REFERENCES foods (id) ON DELETE SET NULL,
  food_name   TEXT NOT NULL,
  quantity    NUMERIC(8, 2) NOT NULL CHECK (quantity >= 0),
  unit        TEXT NOT NULL,
  calories    NUMERIC(8, 2) NOT NULL CHECK (calories >= 0),
  protein     NUMERIC(8, 2) NOT NULL CHECK (protein >= 0),
  carbs       NUMERIC(8, 2) NOT NULL CHECK (carbs >= 0),
  fat         NUMERIC(8, 2) NOT NULL CHECK (fat >= 0),
  fiber       NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (fiber >= 0),
  confidence  NUMERIC(3, 2) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1)
);
CREATE INDEX IF NOT EXISTS meal_items_meal_idx ON meal_items (meal_id);

-- ---------------------------------------------------------------- food scans
-- models/FoodScan.js — saved AI scan results
CREATE TABLE IF NOT EXISTS food_scans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  image_url             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('uploading', 'identifying', 'estimating',
                          'calculating', 'completed', 'failed')),
  suggested_meal_type   TEXT NOT NULL DEFAULT 'lunch'
                        CHECK (suggested_meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  analysis_notes        TEXT NOT NULL DEFAULT '',
  total_calories        NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_protein         NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_carbs           NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_fat             NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_fiber           NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS food_scans_user_idx ON food_scans (user_id);

CREATE TABLE IF NOT EXISTS food_scan_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id             UUID NOT NULL REFERENCES food_scans (id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  confidence          NUMERIC(4, 3) NOT NULL,
  estimated_quantity  NUMERIC(8, 2) NOT NULL,
  unit                TEXT NOT NULL,
  calories            NUMERIC(8, 2) NOT NULL,
  protein             NUMERIC(8, 2) NOT NULL,
  carbs               NUMERIC(8, 2) NOT NULL,
  fat                 NUMERIC(8, 2) NOT NULL,
  fiber               NUMERIC(8, 2) NOT NULL DEFAULT 0,
  food_id             TEXT
);
CREATE INDEX IF NOT EXISTS food_scan_items_scan_idx ON food_scan_items (scan_id);

-- ---------------------------------------------------------------- learned matches
-- models/LearnedFoodMatch.js — visual memory (64-bit perceptual hash of user corrections)
-- Shared across users, like the Mongo collection (no user_id).
CREATE TABLE IF NOT EXISTS learned_food_matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id           TEXT NOT NULL,
  food_name         TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'Vegetables',
  perceptual_hash   TEXT NOT NULL,
  color_signature   NUMERIC[] NOT NULL DEFAULT '{}',
  sample_thumbnail  TEXT NOT NULL DEFAULT '',
  confidence_score  NUMERIC(4, 3) NOT NULL DEFAULT 0.99,
  learned_count     INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learned_food_matches_food_idx ON learned_food_matches (food_id);
CREATE INDEX IF NOT EXISTS learned_food_matches_hash_idx ON learned_food_matches (perceptual_hash);

-- ---------------------------------------------------------------- planned meals
-- models/PlannedMeal.js — weekly planner (day_of_week: 0 = Monday … 6 = Sunday)
CREATE TABLE IF NOT EXISTS planned_meals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type     TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name     TEXT NOT NULL,
  calories      NUMERIC(8, 2) NOT NULL DEFAULT 0,
  protein       NUMERIC(8, 2) NOT NULL DEFAULT 0,
  carbs         NUMERIC(8, 2) NOT NULL DEFAULT 0,
  fat           NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS planned_meals_user_idx ON planned_meals (user_id);
CREATE INDEX IF NOT EXISTS planned_meals_user_day_idx ON planned_meals (user_id, day_of_week);

-- ---------------------------------------------------------------- weight logs
-- models/WeightLog.js
CREATE TABLE IF NOT EXISTS weight_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  weight_kg   NUMERIC(5, 1) NOT NULL,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS weight_logs_user_idx ON weight_logs (user_id);
CREATE INDEX IF NOT EXISTS weight_logs_date_idx ON weight_logs (date);

COMMIT;
