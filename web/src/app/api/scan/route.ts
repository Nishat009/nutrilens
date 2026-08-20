import { NextRequest, NextResponse } from 'next/server';
import { classifyFoodImage } from '../../../services/vision-recognition';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, mealType } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Classify image based on content
    const match = classifyFoodImage(imageUrl, mealType);

    // Calculate totals
    const totalCalories = match.items.reduce((acc, item) => acc + item.calories, 0);
    const totalProtein = Math.round(match.items.reduce((acc, item) => acc + item.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(match.items.reduce((acc, item) => acc + item.carbs, 0) * 10) / 10;
    const totalFat = Math.round(match.items.reduce((acc, item) => acc + item.fat, 0) * 10) / 10;
    const totalFiber = Math.round(match.items.reduce((acc, item) => acc + item.fiber, 0) * 10) / 10;

    const detectedItems = match.items.map((item, idx) => ({
      id: `det_${Date.now()}_${idx}`,
      ...item,
    }));

    return NextResponse.json({
      id: 'scan_' + Date.now().toString(36),
      imageUrl,
      status: 'completed',
      createdAt: new Date().toISOString(),
      suggestedMealType: match.suggestedMealType,
      analysisNotes: match.analysisNotes,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      detectedItems,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process food image' }, { status: 500 });
  }
}
