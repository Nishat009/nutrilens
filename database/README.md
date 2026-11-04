# Database

NutriLens runs on **MongoDB** through the Mongoose models in [`server/src/models/`](../server/src/models/).
The models are the source of truth for the runtime schema.

## Create the runtime database (MongoDB)

```bash
cd server
cp .env.example .env        # set MONGODB_URI
npm run db:migrate          # creates every collection and syncs its indexes from the models
npm run seed                # loads diets, foods, vegetables and demo accounts
```

`npm run db:migrate` ([`server/scripts/migrate.js`](../server/scripts/migrate.js)) can be re-run safely.
It runs `createCollection()` and `syncIndexes()` for each model, so the database ends up with exactly
the indexes the models declare. An index that is in the database but not in the models is dropped.

## The SQL files: documentation only

[`schema.sql`](schema.sql) and [`seed.sql`](seed.sql) are **documentation / reference only**. The app never
reads them and they cannot create the MongoDB database. They describe the same data model in PostgreSQL
so it can be reviewed in one place, or loaded into PostgreSQL for analysis.
Keep them in step with the models whenever a model changes.

## Model ↔ collection ↔ SQL table mapping

| Mongoose model (file) | MongoDB collection | SQL table(s) | Indexes (both sides) |
|---|---|---|---|
| `User` (User.js) | `users` | `users` | unique `email`; `role`; `isDemo` |
| `Food` (Food.js) | `foods` | `foods` | `name`; text(`name`, `category`, `tags`) |
| `Meal` (Meal.js) | `meals` | `meals` + `meal_items` (embedded `items[]`) | `userId`; `date`; `userId + date` |
| `FoodScan` (FoodScan.js) | `foodscans` | `food_scans` + `scan_items` (embedded `detectedItems[]`) | `userId`; `userId + createdAt desc` |
| `LearnedFoodMatch` (LearnedFoodMatch.js) | `learnedfoodmatches` | `learned_food_matches` | `foodId`; `perceptualHash` |
| `PlannedMeal` (PlannedMeal.js) | `plannedmeals` | `planned_meals` | `userId`; `userId + dayOfWeek` |
| `WeightLog` (WeightLog.js) | `weightlogs` | `weight_logs` | `userId`; `date`; `userId + date desc` |
| `DietPlan` (DietPlan.js) | `dietplans` | `diet_plans` | unique `slug`; `id` |
| `Vegetable` (Vegetable.js) | `vegetables` | `vegetables` | unique `slug`; `name`; `aliases`; `category`; `isActive`; weighted text search |

How the shapes map:

- `_id` (ObjectId) → `id UUID PRIMARY KEY`; references such as `userId` → `user_id ... REFERENCES users(id)`.
- camelCase fields → snake_case columns (`heightCm` → `height_cm`, `isDemo` → `is_demo`).
- Embedded arrays of sub-documents (meal items, detected scan items) → child tables with a foreign key.
- Other nested objects (`goal`, `lifestyle`, diet `clinicalProfile`, `macroRatio`, ...) → `JSONB` columns.
- Mongoose `enum` → `CHECK (... IN (...))`; `timestamps: true` → `created_at` / `updated_at`.
