-- NutriLens database schema (PostgreSQL dialect) -- DOCUMENTATION / REFERENCE ONLY
--
-- The running application does NOT use this file. It stores its data in MongoDB through
-- the Mongoose models in server/src/models/. To create the runtime database run, in server/:
--   npm run db:migrate   (creates every collection and its indexes from the models)
--   npm run seed         (loads diets, foods, vegetables and demo accounts)
-- This file is the same data model written as SQL so it can be reviewed as a whole (or
-- loaded into PostgreSQL for analysis). Table = Mongoose model, nested sub-documents become
-- child tables or JSON columns. The model-to-table mapping is in database/README.md.
--
-- Optional reference load:  psql "$DATABASE_URL" -f database/schema.sql && psql "$DATABASE_URL" -f database/seed.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users  (server/src/models/User.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash        TEXT        NOT NULL,                 -- scrypt$<salt>$<hash>, never plain text
  role                 TEXT        NOT NULL DEFAULT 'user'   CHECK (role IN ('user', 'admin')),
  is_demo              BOOLEAN     NOT NULL DEFAULT FALSE,   -- shared showcase accounts
  gender               TEXT        NOT NULL DEFAULT 'male'   CHECK (gender IN ('male', 'female', 'other')),
  dob                  DATE,
  height_cm            NUMERIC(5,1),
  weight_kg            NUMERIC(5,1),
  target_weight_kg     NUMERIC(5,1),
  waist_cm             NUMERIC(5,1),
  activity_level       TEXT        NOT NULL DEFAULT 'moderately_active'
                         CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')),
  primary_goal         TEXT        NOT NULL DEFAULT 'lose_weight',
  goal_pace            TEXT        NOT NULL DEFAULT 'moderate'
                         CHECK (goal_pace IN ('slow_sustainable', 'moderate', 'faster')),
  health_conditions    TEXT[]      NOT NULL DEFAULT '{}',
  food_preferences     TEXT[]      NOT NULL DEFAULT '{balanced,traditional_bangladeshi}',
  common_foods_eaten   TEXT[]      NOT NULL DEFAULT '{}',
  dietary_preferences  TEXT[]      NOT NULL DEFAULT '{}',
  medical_conditions   TEXT[]      NOT NULL DEFAULT '{}',
  medications          TEXT[]      NOT NULL DEFAULT '{}',
  allergies            TEXT[]      NOT NULL DEFAULT '{}',
  active_diet_id       TEXT,
  lifestyle            JSONB       NOT NULL DEFAULT '{"sleepHours":"6_to_8","workType":"desk_job","mealFrequency":3,"cookingHabit":"family_cooks","budgetLevel":"medium"}',
  goal                 JSONB       NOT NULL DEFAULT '{}',    -- type, target calories/macros/fiber/water, weekly change
  personalized_plan    JSONB,
  avatar_url           TEXT,
  onboarding_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role    ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users (is_demo);

-- ---------------------------------------------------------------------------
-- foods  (server/src/models/Food.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS foods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  category      TEXT        NOT NULL,
  serving_size  NUMERIC     NOT NULL DEFAULT 100,
  serving_unit  TEXT        NOT NULL DEFAULT 'g',
  calories      NUMERIC     NOT NULL,
  protein       NUMERIC     NOT NULL,
  carbs         NUMERIC     NOT NULL,
  fat           NUMERIC     NOT NULL,
  fiber         NUMERIC     NOT NULL DEFAULT 0,
  sugar         NUMERIC     NOT NULL DEFAULT 0,
  sodium        NUMERIC     NOT NULL DEFAULT 0,
  image_url     TEXT        NOT NULL DEFAULT '',
  tags          TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foods_name   ON foods (name);
CREATE INDEX IF NOT EXISTS idx_foods_search ON foods USING GIN (to_tsvector('simple', name || ' ' || category || ' ' || array_to_string(tags, ' ')));

-- ---------------------------------------------------------------------------
-- meals + meal_items  (server/src/models/Meal.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  date           DATE        NOT NULL,
  time           TEXT        NOT NULL,                       -- HH:mm
  total_calories NUMERIC     NOT NULL DEFAULT 0,
  total_protein  NUMERIC     NOT NULL DEFAULT 0,
  total_carbs    NUMERIC     NOT NULL DEFAULT 0,
  total_fat      NUMERIC     NOT NULL DEFAULT 0,
  total_fiber    NUMERIC     NOT NULL DEFAULT 0,
  image_url      TEXT        NOT NULL DEFAULT '',
  notes          TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meals_user ON meals (user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals (date);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals (user_id, date);

CREATE TABLE IF NOT EXISTS meal_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    UUID    NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  food_id    UUID    REFERENCES foods (id) ON DELETE SET NULL,
  food_name  TEXT    NOT NULL,
  quantity   NUMERIC NOT NULL,
  unit       TEXT    NOT NULL,
  calories   NUMERIC NOT NULL,
  protein    NUMERIC NOT NULL,
  carbs      NUMERIC NOT NULL,
  fat        NUMERIC NOT NULL,
  fiber      NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1)
);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items (meal_id);

-- ---------------------------------------------------------------------------
-- food_scans + scan_items  (server/src/models/FoodScan.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_scans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  image_url           TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('uploading', 'identifying', 'estimating', 'calculating', 'completed', 'failed')),
  suggested_meal_type TEXT        NOT NULL DEFAULT 'lunch'
                        CHECK (suggested_meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  analysis_notes      TEXT        NOT NULL DEFAULT '',
  total_calories      NUMERIC     NOT NULL DEFAULT 0,
  total_protein       NUMERIC     NOT NULL DEFAULT 0,
  total_carbs         NUMERIC     NOT NULL DEFAULT 0,
  total_fat           NUMERIC     NOT NULL DEFAULT 0,
  total_fiber         NUMERIC     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_food_scans_user ON food_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_food_scans_user_created ON food_scans (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS scan_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id            UUID    NOT NULL REFERENCES food_scans (id) ON DELETE CASCADE,
  name               TEXT    NOT NULL,
  confidence         NUMERIC NOT NULL,
  estimated_quantity NUMERIC NOT NULL,
  unit               TEXT    NOT NULL,
  calories           NUMERIC NOT NULL,
  protein            NUMERIC NOT NULL,
  carbs              NUMERIC NOT NULL,
  fat                NUMERIC NOT NULL,
  fiber              NUMERIC NOT NULL DEFAULT 0,
  food_id            TEXT
);
CREATE INDEX IF NOT EXISTS idx_scan_items_scan ON scan_items (scan_id);

-- ---------------------------------------------------------------------------
-- learned_food_matches  (server/src/models/LearnedFoodMatch.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learned_food_matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id          TEXT        NOT NULL,
  food_name        TEXT        NOT NULL,
  category         TEXT        NOT NULL DEFAULT 'Vegetables',
  perceptual_hash  TEXT        NOT NULL,
  color_signature  NUMERIC[]   NOT NULL DEFAULT '{}',
  sample_thumbnail TEXT        NOT NULL DEFAULT '',
  confidence_score NUMERIC     NOT NULL DEFAULT 0.99,
  learned_count    INTEGER     NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_learned_food_id ON learned_food_matches (food_id);
CREATE INDEX IF NOT EXISTS idx_learned_hash    ON learned_food_matches (perceptual_hash);

-- ---------------------------------------------------------------------------
-- planned_meals  (server/src/models/PlannedMeal.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planned_meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  day_of_week SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),   -- 0 = Monday
  meal_type   TEXT        NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name   TEXT        NOT NULL,
  calories    NUMERIC     NOT NULL DEFAULT 0,
  protein     NUMERIC     NOT NULL DEFAULT 0,
  carbs       NUMERIC     NOT NULL DEFAULT 0,
  fat         NUMERIC     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planned_meals_user_day ON planned_meals (user_id, day_of_week);

-- ---------------------------------------------------------------------------
-- weight_logs  (server/src/models/WeightLog.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weight_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  weight_kg  NUMERIC(5,1) NOT NULL,
  notes      TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs (date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs (user_id, date DESC);

-- ---------------------------------------------------------------------------
-- diet_plans  (server/src/models/DietPlan.js)
-- Nested sub-documents (macro ratio, clinical profile, eligibility, ...) are JSONB.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diet_plans (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                   TEXT,
  slug                   TEXT        NOT NULL UNIQUE,
  name                   TEXT        NOT NULL,
  category               TEXT        NOT NULL DEFAULT 'general',
  status                 TEXT        NOT NULL DEFAULT 'active',
  tagline                TEXT        NOT NULL,
  description            TEXT        NOT NULL,
  full_overview          TEXT        NOT NULL,
  icon                   TEXT        NOT NULL DEFAULT 'Sparkles',
  difficulty             TEXT        NOT NULL DEFAULT 'Moderate'
                           CHECK (difficulty IN ('Easy', 'Moderate', 'Challenging', 'Advanced')),
  target_audience        TEXT        NOT NULL DEFAULT '',
  target_weight_category TEXT        NOT NULL DEFAULT '',
  clinical_profile       JSONB       NOT NULL DEFAULT '{}',
  eligibility            JSONB       NOT NULL DEFAULT '{}',
  nutrition_strategy     JSONB       NOT NULL DEFAULT '{}',
  food_rules             JSONB       NOT NULL DEFAULT '{}',
  evidence_profile       JSONB       NOT NULL DEFAULT '{}',
  safety                 JSONB       NOT NULL DEFAULT '{}',
  macro_ratio            JSONB       NOT NULL,                 -- protein / carbs / fat
  suitability            JSONB       NOT NULL DEFAULT '{}',
  sample_meal_day        JSONB       NOT NULL,                 -- breakfast / lunch / dinner / snack
  goal_compatibility     JSONB       NOT NULL DEFAULT '{}',
  health_compatibility   JSONB       NOT NULL DEFAULT '{}',
  key_benefits           TEXT[]      NOT NULL DEFAULT '{}',
  allowed_foods          TEXT[]      NOT NULL DEFAULT '{}',
  foods_to_limit         TEXT[]      NOT NULL DEFAULT '{}',
  forbidden_keywords     TEXT[]      NOT NULL DEFAULT '{}',
  guidelines             TEXT[]      NOT NULL DEFAULT '{}',
  suitable_for           TEXT[]      NOT NULL DEFAULT '{}',
  food_style             TEXT[]      NOT NULL DEFAULT '{}',
  requires_professional_review TEXT[] NOT NULL DEFAULT '{}',
  restrictions           TEXT[]      NOT NULL DEFAULT '{}',
  flexibility            TEXT        NOT NULL DEFAULT 'moderate' CHECK (flexibility IN ('high', 'moderate', 'strict')),
  is_featured            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- vegetables  (server/src/models/Vegetable.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vegetables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  slug                TEXT        NOT NULL UNIQUE CHECK (slug = lower(slug)),
  aliases             TEXT[]      NOT NULL DEFAULT '{}',
  description         TEXT        NOT NULL DEFAULT '',
  visual_description  TEXT        NOT NULL DEFAULT '',
  dominant_color      TEXT        NOT NULL DEFAULT 'green',
  secondary_colors    TEXT[]      NOT NULL DEFAULT '{}',
  shape               TEXT        NOT NULL DEFAULT 'irregular',
  piece_weight_grams  NUMERIC     NOT NULL DEFAULT 100,
  calories_per_piece  NUMERIC     NOT NULL DEFAULT 0,
  piece_unit_label    TEXT        NOT NULL DEFAULT '1 medium piece (~100g)',
  category            TEXT        NOT NULL CHECK (category IN (
                        'Root Vegetables', 'Leafy Greens', 'Cruciferous', 'Nightshades',
                        'Gourds & Squashes', 'Podded & Legumes', 'Allium', 'Mushroom & Fungi',
                        'Stems & Shoots', 'Fruit Vegetables', 'Tubers & Corms', 'Herbs & Aromatics')),
  image_url           TEXT        NOT NULL DEFAULT '/vegetables/default-vegetable.webp',
  thumbnail_url       TEXT        NOT NULL DEFAULT '',
  calories_per_100g   NUMERIC     NOT NULL CHECK (calories_per_100g >= 0),
  protein_per_100g    NUMERIC     NOT NULL CHECK (protein_per_100g >= 0),
  carbs_per_100g      NUMERIC     NOT NULL CHECK (carbs_per_100g >= 0),
  fat_per_100g        NUMERIC     NOT NULL CHECK (fat_per_100g >= 0),
  fiber_per_100g      NUMERIC     NOT NULL CHECK (fiber_per_100g >= 0),
  sugar_per_100g      NUMERIC     NOT NULL DEFAULT 0 CHECK (sugar_per_100g >= 0),
  sodium_mg           NUMERIC     NOT NULL DEFAULT 0 CHECK (sodium_mg >= 0),
  potassium_mg        NUMERIC     NOT NULL DEFAULT 0 CHECK (potassium_mg >= 0),
  vitamin_c_mg        NUMERIC     NOT NULL DEFAULT 0 CHECK (vitamin_c_mg >= 0),
  vitamin_a_iu        NUMERIC     NOT NULL DEFAULT 0 CHECK (vitamin_a_iu >= 0),
  calcium_mg          NUMERIC     NOT NULL DEFAULT 0 CHECK (calcium_mg >= 0),
  iron_mg             NUMERIC     NOT NULL DEFAULT 0 CHECK (iron_mg >= 0),
  serving_size        NUMERIC     NOT NULL DEFAULT 100,
  serving_unit        TEXT        NOT NULL DEFAULT 'g',
  preparation_state   TEXT        NOT NULL DEFAULT 'raw',
  source              TEXT        NOT NULL DEFAULT 'USDA FoodData Central',
  source_reference    TEXT        NOT NULL DEFAULT 'USDA FoodData Central / SR Legacy (Raw Edible Portion per 100g)',
  scientific_name     TEXT        NOT NULL DEFAULT '',
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vegetables_name      ON vegetables (name);
CREATE INDEX IF NOT EXISTS idx_vegetables_category  ON vegetables (category);
CREATE INDEX IF NOT EXISTS idx_vegetables_is_active ON vegetables (is_active);
CREATE INDEX IF NOT EXISTS idx_vegetables_aliases   ON vegetables USING GIN (aliases);
CREATE INDEX IF NOT EXISTS idx_vegetables_search    ON vegetables USING GIN (
  to_tsvector('simple', name || ' ' || array_to_string(aliases, ' ') || ' ' || category || ' ' || description));

COMMIT;
