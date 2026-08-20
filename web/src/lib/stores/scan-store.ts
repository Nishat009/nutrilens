import { create } from 'zustand';
import { MOCK_RECENT_SCANS } from '../../data/mock/scans';
import { FoodScan, FoodScanItem, MealType, ScanStatus } from '../types';

interface ScanState {
  currentScan: FoodScan | null;
  history: FoodScan[];
  isAnalyzing: boolean;
  analysisStep: number; // 0: Idle, 1: Identifying, 2: Estimating portions, 3: Calculating nutrition, 4: Done
  analysisProgress: number; // 0 to 100%
  
  setCurrentScan: (scan: FoodScan | null) => void;
  updateDetectedItem: (itemId: string, updates: Partial<FoodScanItem>) => void;
  removeDetectedItem: (itemId: string) => void;
  addDetectedItem: (item: FoodScanItem) => void;
  recalculateScanTotals: () => void;
  startScanSimulation: (imageUrl: string, suggestedMealType?: MealType) => Promise<FoodScan>;
  clearCurrentScan: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  currentScan: MOCK_RECENT_SCANS[0],
  history: MOCK_RECENT_SCANS,
  isAnalyzing: false,
  analysisStep: 0,
  analysisProgress: 0,

  setCurrentScan: (scan) => set({ currentScan: scan }),

  updateDetectedItem: (itemId, updates) => {
    const { currentScan } = get();
    if (!currentScan) return;

    const newItems = currentScan.detectedItems.map((item) => {
      if (item.id !== itemId) return item;
      
      const updated = { ...item, ...updates };
      // If quantity changed, scale the calories/macros proportionally
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
    await new Promise((r) => setTimeout(r, 900));
    set({ analysisStep: 2, analysisProgress: 55 });

    // Step 2: Estimating portions
    await new Promise((r) => setTimeout(r, 900));
    set({ analysisStep: 3, analysisProgress: 88 });

    // Step 3: Calculating nutrition
    await new Promise((r) => setTimeout(r, 600));

    // Dynamic Image Classification from Vision Engine
    const { classifyFoodImage } = await import('../../services/vision-recognition');
    const match = classifyFoodImage(imageUrl, suggestedMealType);

    const totalCalories = match.items.reduce((acc, item) => acc + item.calories, 0);
    const totalProtein = Math.round(match.items.reduce((acc, item) => acc + item.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(match.items.reduce((acc, item) => acc + item.carbs, 0) * 10) / 10;
    const totalFat = Math.round(match.items.reduce((acc, item) => acc + item.fat, 0) * 10) / 10;
    const totalFiber = Math.round(match.items.reduce((acc, item) => acc + item.fiber, 0) * 10) / 10;

    const newScanId = 'scan_' + Date.now().toString(36);
    const completedScan: FoodScan = {
      id: newScanId,
      userId: 'usr_prantik_99',
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
      detectedItems: match.items.map((item, idx) => ({
        id: `det_${Date.now()}_${idx}`,
        ...item,
      })),
    };

    set((state) => ({
      isAnalyzing: false,
      analysisStep: 4,
      analysisProgress: 100,
      currentScan: completedScan,
      history: [completedScan, ...state.history],
    }));

    return completedScan;
  },

  clearCurrentScan: () => set({ currentScan: null, isAnalyzing: false, analysisStep: 0, analysisProgress: 0 }),
}));
