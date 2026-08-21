'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useScanStore } from '../../../../lib/stores/scan-store';
import { FoodAnalysisResult } from '../../../../components/scanner/FoodAnalysisResult';
import { FoodRecognitionResult } from '../../../../services/food-recognition';
import { findBestFoodMatch } from '../../../../services/nutrition-engine';
import { NUTRITION_DATABASE } from '../../../../data/nutrition-database';
import { scanApi } from '../../../../services/api-client';
import { FoodScan } from '../../../../lib/types';

export default function ScanResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scanId = params.id as string;
  const { currentScan, setCurrentScan } = useScanStore();
  const [scan, setScan] = useState<FoodScan | null>(currentScan);
  const [isLoading, setIsLoading] = useState(!currentScan);

  useEffect(() => {
    if (!currentScan && scanId) {
      setIsLoading(true);
      scanApi
        .getScanById(scanId)
        .then((fetched) => {
          setScan(fetched);
          setCurrentScan(fetched);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else if (currentScan) {
      setScan(currentScan);
    }
  }, [scanId, currentScan, setCurrentScan]);

  if (isLoading) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading food scan details from backend...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Scan Not Found</h2>
        <p className="text-xs text-slate-400">Please scan a new meal to review and log results.</p>
        <Link href="/scan">
          <Button variant="glow">Open Food Scanner</Button>
        </Link>
      </div>
    );
  }

  // Convert FoodScan into FoodRecognitionResult format
  const recognitionResult: FoodRecognitionResult = {
    scanId: scan.id,
    status: 'completed',
    isDemoMode: false,
    modelName: 'AI Multimodal Vision Classifier',
    detectedFoods: scan.detectedItems.map((item) => {
      const match = findBestFoodMatch(item.name);
      return {
        id: item.id,
        foodId: item.foodId || match.item.id,
        name: item.name,
        category: match.item.category,
        quantity: item.estimatedQuantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        confidence: item.confidence || 0.95,
        confidenceLevel: item.confidence && item.confidence < 0.6 ? 'low' : item.confidence && item.confidence < 0.8 ? 'medium' : 'high',
        suggestions: NUTRITION_DATABASE.slice(0, 4).map((f) => f.name),
        imageUrl: match.item.imageUrl,
      };
    }),
    overallConfidence: 0.94,
    overallConfidenceLevel: 'high',
    topSuggestions: NUTRITION_DATABASE.slice(0, 5).map((f) => f.name),
    suggestedMealType: scan.suggestedMealType || 'lunch',
    analysisNotes: scan.analysisNotes || 'AI Food Vision recognized ingredients with high semantic confidence.',
    disclaimer:
      'Nutrition values are estimates based on standard recipe averages and may vary depending on exact ingredients, preparation method, and portion size. Not intended for medical diagnosis.',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link href="/scan">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Scanner
          </Button>
        </Link>
      </div>

      <FoodAnalysisResult
        image={scan.imageUrl}
        initialResult={recognitionResult}
        onReset={() => router.push('/scan')}
      />
    </div>
  );
}
