import { NextRequest, NextResponse } from 'next/server';
import { recognizeFoodFromImage } from '../../../../services/food-recognition';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mealType } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          code: 422,
          errors: ['Image data is required'],
        },
        { status: 422 }
      );
    }

    const result = await recognizeFoodFromImage(image, mealType);

    return NextResponse.json(
      {
        success: true,
        code: 200,
        message: 'Food analysis completed successfully',
        result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        code: 422,
        errors: [error.message || 'Internal Server Error during analysis'],
      },
      { status: 422 }
    );
  }
}
