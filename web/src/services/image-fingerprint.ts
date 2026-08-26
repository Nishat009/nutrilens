import { DatabaseFoodItem, NUTRITION_DATABASE } from '../data/nutrition-database';

export interface LearnedMemoryEntry {
  foodId: string;
  foodName: string;
  category: string;
  perceptualHash: string;
  colorSignature: number[];
  sampleThumbnail?: string;
  confidenceScore: number;
  learnedAt: string;
}

const LOCAL_STORAGE_KEY = 'nutrilens_learned_matches';

/**
 * Computes a 64-bit gradient Difference Hash (dHash) from image data URL.
 * Invariant to minor lighting shifts, cropping, and compression.
 */
export async function computePerceptualHash(imageDataUrl: string): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Fallback hash for node environment
    return fallbackHash(imageDataUrl);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 9;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(fallbackHash(imageDataUrl));
        }

        ctx.drawImage(img, 0, 0, 9, 8);
        const imgData = ctx.getImageData(0, 0, 9, 8);
        const data = imgData.data;

        // Convert to grayscale values
        const gray: number[][] = [];
        for (let y = 0; y < 8; y++) {
          gray[y] = [];
          for (let x = 0; x < 9; x++) {
            const idx = (y * 9 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            gray[y][x] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
          }
        }

        // Compute horizontal gradient difference (left > right)
        let hash = '';
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            hash += gray[y][x] > gray[y][x + 1] ? '1' : '0';
          }
        }

        resolve(hash);
      };
      img.onerror = () => resolve(fallbackHash(imageDataUrl));
      img.src = imageDataUrl;
    } catch {
      resolve(fallbackHash(imageDataUrl));
    }
  });
}

/**
 * Calculates visual similarity between two perceptual hashes using Hamming Distance.
 * Returns a value between 0.0 and 1.0 (1.0 = identical).
 */
export function calculateHashSimilarity(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 0;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return (hashA.length - distance) / hashA.length;
}

/**
 * Saves a user-taught vegetable association into both LocalStorage and MongoDB.
 */
export async function teachVisualMemory(
  imageDataUrl: string,
  food: DatabaseFoodItem
): Promise<LearnedMemoryEntry> {
  const hash = await computePerceptualHash(imageDataUrl);

  const entry: LearnedMemoryEntry = {
    foodId: food.id,
    foodName: food.name,
    category: food.category || 'Vegetables',
    perceptualHash: hash,
    colorSignature: [],
    confidenceScore: 0.99,
    learnedAt: new Date().toISOString(),
  };

  // 1. Save in client local memory
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const list: LearnedMemoryEntry[] = stored ? JSON.parse(stored) : [];
      // Remove any previous entry for this exact hash
      const filtered = list.filter((item) => item.perceptualHash !== hash);
      filtered.unshift(entry);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered.slice(0, 100)));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }

  // 2. Persist to MongoDB backend asynchronously
  try {
    const base = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
      : '';
    fetch(`${base}/api/scans/teach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodId: food.id,
        foodName: food.name,
        category: food.category,
        perceptualHash: hash,
      }),
    }).catch((e) => console.warn('Backend teach sync notice:', e));
  } catch (err) {
    console.warn('Backend sync failed:', err);
  }

  return entry;
}

/**
 * Searches the learned visual memory (LocalStorage + API) to check if this image
 * matches any vegetable the user previously taught or corrected.
 */
export async function findLearnedMemoryMatch(
  imageDataUrl: string,
  threshold: number = 0.82
): Promise<{ food: DatabaseFoodItem; similarity: number } | null> {
  const currentHash = await computePerceptualHash(imageDataUrl);
  if (!currentHash) return null;

  let candidates: LearnedMemoryEntry[] = [];

  // Read from local memory
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        candidates = JSON.parse(stored);
      }
    } catch {}
  }

  let bestMatch: { entry: LearnedMemoryEntry; similarity: number } | null = null;

  for (const cand of candidates) {
    const sim = calculateHashSimilarity(currentHash, cand.perceptualHash);
    if (sim >= threshold) {
      if (!bestMatch || sim > bestMatch.similarity) {
        bestMatch = { entry: cand, similarity: sim };
      }
    }
  }

  if (bestMatch) {
    // Find the full food item in NUTRITION_DATABASE
    let food = NUTRITION_DATABASE.find((f) => f.id === bestMatch.entry.foodId || f.name === bestMatch.entry.foodName);
    if (!food) {
      // Create on-the-fly database item from saved entry
      food = {
        id: bestMatch.entry.foodId,
        name: bestMatch.entry.foodName,
        category: bestMatch.entry.category,
        defaultPortion: 100,
        unit: 'g',
        caloriesPer100g: 35,
        proteinPer100g: 2.0,
        carbsPer100g: 6.0,
        fatPer100g: 0.2,
        fiberPer100g: 2.5,
        aliases: [bestMatch.entry.foodName],
        tags: ['custom', 'learned', 'vegetable'],
      };
    }

    return {
      food,
      similarity: bestMatch.similarity,
    };
  }

  return null;
}

function fallbackHash(str: string): string {
  let hash = '';
  for (let i = 0; i < 64; i++) {
    const code = str.charCodeAt(i % str.length) || 0;
    hash += code % 2 === 0 ? '1' : '0';
  }
  return hash;
}
