import { create } from 'zustand';
import { FoodScan, FoodScanItem, MealType } from '../types';
import { scanApi } from '../../services/api-client';

interface ScanState {
  currentScan: FoodScan | null;
  history: FoodScan[];
  isAnalyzing: boolean;
  analysisStep: number;
  analysisProgress: number;
  isLoadingHistory: boolean;

  fetchHistory: (userId?: string) => Promise<void>;
  setCurrentScan: (scan: FoodScan | null) => void;
  updateDetectedItem: (itemId: string, updates: Partial<FoodScanItem>) => void;
  removeDetectedItem: (itemId: string) => void;
  addDetectedItem: (item: FoodScanItem) => void;
  recalculateScanTotals: () => void;
  startScanSimulation: (imageUrl: string, suggestedMealType?: MealType) => Promise<FoodScan>;
  clearCurrentScan: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  currentScan: null,
  history: [],
  isAnalyzing: false,
  analysisStep: 0,
  analysisProgress: 0,
  isLoadingHistory: false,

  fetchHistory: async (userId?: string) => {
    set({ isLoadingHistory: true });
    try {
      const scans = await scanApi.getScans(userId);
      set({ history: scans, isLoadingHistory: false });
    } catch (err) {
      console.warn('Failed to load scan history from backend:', err);
      set({ isLoadingHistory: false });
    }
  },

  setCurrentScan: (scan) => set({ currentScan: scan }),

  updateDetectedItem: (itemId, updates) => {
    const { currentScan } = get();
    if (!currentScan) return;

    const newItems = currentScan.detectedItems.map((item) => {
      if (item.id !== itemId) return item;

      const updated = { ...item, ...updates };
      if (updates.estimatedQuantity && updates.estimatedQuantity !== item.estimatedQuantity) {
        const ratio = updates.estimatedQuantity / (item.estimatedQuantity || 1);
        updated.calories = Math.round(item.calories * ratio);
        updated.protein = Math.round(item.protein * ratio * 10) / 10;
        updated.carbs = Math.round(item.carbs * ratio * 10) / 10;
        updated.fat = Math.round(item.fat * ratio * 10) / 10;
        updated.fiber = Math.round(item.fiber * ratio * 10) / 10;
      }
      return updated;
    });

    set({ currentScan: { ...currentScan, detectedItems: newItems } });
    get().recalculateScanTotals();
  },

  removeDetectedItem: (itemId) => {
    const { currentScan } = get();
    if (!currentScan) return;
    const newItems = currentScan.detectedItems.filter((i) => i.id !== itemId);
    set({ currentScan: { ...currentScan, detectedItems: newItems } });
    get().recalculateScanTotals();
  },

  addDetectedItem: (item) => {
    const { currentScan } = get();
    if (!currentScan) return;
    set({ currentScan: { ...currentScan, detectedItems: [...currentScan.detectedItems, item] } });
    get().recalculateScanTotals();
  },

  recalculateScanTotals: () => {
    const { currentScan } = get();
    if (!currentScan) return;

    const totals = currentScan.detectedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fiber: acc.fiber + item.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    set({
      currentScan: {
        ...currentScan,
        totalCalories: totals.calories,
        totalProtein: Math.round(totals.protein * 10) / 10,
        totalCarbs: Math.round(totals.carbs * 10) / 10,
        totalFat: Math.round(totals.fat * 10) / 10,
        totalFiber: Math.round(totals.fiber * 10) / 10,
      },
    });
  },

  startScanSimulation: async (imageUrl: string, suggestedMealType: MealType = 'lunch') => {
    set({ isAnalyzing: true, analysisStep: 1, analysisProgress: 15 });

    // Step 1: Identifying
    await new Promise((r) => setTimeout(r, 600));
    set({ analysisStep: 2, analysisProgress: 50 });

    // Step 2: Estimating portions & calculating
    await new Promise((r) => setTimeout(r, 600));
    set({ analysisStep: 3, analysisProgress: 85 });

    try {
      const { recognizeFoodFromImage } = await import('../../services/food-recognition');
      const result = await recognizeFoodFromImage(imageUrl, suggestedMealType);

      const totalCalories = result.detectedFoods.reduce((acc: number, item: any) => acc + item.calories, 0);
      const totalProtein = Math.round(result.detectedFoods.reduce((acc: number, item: any) => acc + item.protein, 0) * 10) / 10;
      const totalCarbs = Math.round(result.detectedFoods.reduce((acc: number, item: any) => acc + item.carbs, 0) * 10) / 10;
      const totalFat = Math.round(result.detectedFoods.reduce((acc: number, item: any) => acc + item.fat, 0) * 10) / 10;
      const totalFiber = Math.round(result.detectedFoods.reduce((acc: number, item: any) => acc + item.fiber, 0) * 10) / 10;

      const scanData: Partial<FoodScan> = {
        imageUrl,
        status: 'completed',
        suggestedMealType: result.suggestedMealType || suggestedMealType,
        analysisNotes: result.analysisNotes,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber,
        detectedItems: result.detectedFoods.map((item: any, idx: number) => ({
          id: `det_${Date.now()}_${idx}`,
          name: item.name,
          confidence: item.confidence,
          estimatedQuantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber,
          foodId: item.foodId,
        })),
      };

      const savedScan = await scanApi.createScan(scanData);

      set((state) => ({
        isAnalyzing: false,
        analysisStep: 4,
        analysisProgress: 100,
        currentScan: savedScan,
        history: [savedScan, ...state.history],
      }));

      return savedScan;
    } catch (err) {
      console.error('Scan analysis error:', err);
      set({ isAnalyzing: false, analysisStep: 0, analysisProgress: 0 });
      throw err;
    }
  },

  clearCurrentScan: () => set({ currentScan: null, isAnalyzing: false, analysisStep: 0, analysisProgress: 0 }),
}));
