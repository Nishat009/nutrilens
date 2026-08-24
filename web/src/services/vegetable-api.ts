import { Vegetable, CalculatedVegetableNutrition, VegetableMatchResult } from '../lib/types/vegetable';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
  : '';

interface ApiResponse<T = any> {
  success: boolean;
  code?: number;
  message?: string;
  count?: number;
  total?: number;
  categories?: string[];
  data?: T;
  result?: T;
  errors?: string[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    errors: ['Failed to parse JSON response from server'],
  }));

  if (!response.ok || data.success === false) {
    const errorMsg =
      data.errors && data.errors.length > 0
        ? data.errors.join(', ')
        : data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return (data.data !== undefined ? data.data : data.result !== undefined ? data.result : (data as unknown as T)) as T;
}

export const vegetableApi = {
  async getVegetables(params?: {
    category?: string;
    search?: string;
    sortBy?: 'name' | 'calories' | 'protein' | 'carbs' | 'fiber' | 'fat';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ vegetables: Vegetable[]; total: number; categories: string[] }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.order) query.append('order', params.order);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<Vegetable[]>(`/api/vegetables${qs}`);
    return {
      vegetables: Array.isArray(res) ? res : [],
      total: (res as any)?.total || (Array.isArray(res) ? res.length : 0),
      categories: (res as any)?.categories || [],
    };
  },

  async searchVegetables(query: string): Promise<Vegetable[]> {
    if (!query || !query.trim()) return [];
    const qs = `?q=${encodeURIComponent(query.trim())}`;
    const res = await request<Vegetable[]>(`/api/vegetables/search${qs}`);
    return Array.isArray(res) ? res : [];
  },

  async getVegetableByIdOrSlug(idOrSlug: string): Promise<Vegetable> {
    return request<Vegetable>(`/api/vegetables/${encodeURIComponent(idOrSlug)}`);
  },

  async matchVegetables(detectedNames: string[]): Promise<VegetableMatchResult[]> {
    const res = await request<VegetableMatchResult[]>('/api/vegetables/match', {
      method: 'POST',
      body: JSON.stringify({ detectedNames }),
    });
    return Array.isArray(res) ? res : [];
  },

  async calculateNutrition(idOrSlug: string, quantityGrams: number): Promise<CalculatedVegetableNutrition> {
    return request<CalculatedVegetableNutrition>(`/api/vegetables/${encodeURIComponent(idOrSlug)}/calculate`, {
      method: 'POST',
      body: JSON.stringify({ quantityGrams }),
    });
  },

  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const res = await request<Array<{ category: string; count: number }>>('/api/vegetables/categories');
    return Array.isArray(res) ? res : [];
  },
};
