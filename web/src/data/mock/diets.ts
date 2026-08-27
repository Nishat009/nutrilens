import { DietPlan } from '../../lib/types';
import canonicalData from '../../../../server/src/nutrition/diet-plans.json';

export const MOCK_DIETS: DietPlan[] = canonicalData.diet_plans as unknown as DietPlan[];
