import { Recommendation } from '../../lib/types';

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec_init_01',
    title: 'Protein Density Optimization',
    category: 'nutrition',
    message: 'Your lunch contained 54g of high-bioavailability protein! This successfully triggered your leucine threshold for muscle protein synthesis.',
    severity: 'success',
    actionText: 'View Lunch Breakdown',
    actionUrl: '/meals/meal_lunch_01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec_init_02',
    title: 'Hydration Target Pacing',
    category: 'hydration',
    message: "You've logged 1,800ml / 3,000ml of water today. Drinking 500ml before your dinner meal will improve nutrient absorption and fullness.",
    severity: 'info',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec_init_03',
    title: 'Micronutrient Spotlight: Magnesium & Potassium',
    category: 'recovery',
    message: 'Adding leafy greens or avocado to your dinner will help balance electrolytes and support deep REM sleep recovery tonight.',
    severity: 'info',
    actionText: 'Explore Mediterranean Plan',
    actionUrl: '/diets/mediterranean',
    createdAt: new Date().toISOString(),
  },
];
