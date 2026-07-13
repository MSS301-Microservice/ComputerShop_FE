// Promotion Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { 
  PromotionResponse, 
  PromotionCreationRequest, 
  PromotionUpdateRequest,
  AddPromotionToProductsRequest,
  AddPromotionToCategoryRequest,
  AddPromotionToBrandRequest,
} from '../types/promotion';
import { PagedResponse } from '../types/common';

export interface PromotionPageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const promotionService = {
  // Get all promotions
  getAllPromotions: async (): Promise<PromotionResponse[]> => {
    const response = await apiClient.get<PromotionResponse[]>(API_ENDPOINTS.PROMOTIONS);
    return response.result || [];
  },

  // Get promotions paged
  getAllPromotionsPaged: async (params: PromotionPageParams = {}): Promise<PagedResponse<PromotionResponse>> => {
    const { page = 0, size = 10, sortBy = 'promotionId', sortDir = 'desc' } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDir });
    const response = await apiClient.get<PagedResponse<PromotionResponse>>(`${API_ENDPOINTS.PROMOTIONS_PAGED}?${query}`);
    return response.result!;
  },

  // Get promotion by ID
  getPromotionById: async (id: number): Promise<PromotionResponse> => {
    const response = await apiClient.get<PromotionResponse>(
      API_ENDPOINTS.PROMOTION_BY_ID(id)
    );
    if (!response.result) {
      throw new Error('Promotion not found');
    }
    return response.result;
  },

  // Get promotion by code
  getPromotionByCode: async (code: string): Promise<PromotionResponse> => {
    const response = await apiClient.get<PromotionResponse>(
      API_ENDPOINTS.PROMOTION_BY_CODE(code)
    );
    if (!response.result) {
      throw new Error('Promotion not found');
    }
    return response.result;
  },

  // Create promotion (requires STAFF/ADMIN)
  createPromotion: async (data: PromotionCreationRequest): Promise<PromotionResponse> => {
    const response = await apiClient.post<PromotionResponse>(
      API_ENDPOINTS.PROMOTIONS,
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to create promotion');
    }
    return response.result;
  },

  // Update promotion (requires STAFF/ADMIN)
  updatePromotion: async (id: number, data: PromotionUpdateRequest): Promise<PromotionResponse> => {
    const response = await apiClient.put<PromotionResponse>(
      API_ENDPOINTS.PROMOTION_BY_ID(id),
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update promotion');
    }
    return response.result;
  },

  // Delete promotion (requires STAFF/ADMIN)
  deletePromotion: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PROMOTION_BY_ID(id), true);
  },

  // Add promotion to products (requires STAFF/ADMIN)
  addPromotionToProducts: async (data: AddPromotionToProductsRequest): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.PROMOTION_ADD_TO_PRODUCTS,
      data,
      true
    );
  },

  // Add promotion to category (requires STAFF/ADMIN)
  addPromotionToCategory: async (data: AddPromotionToCategoryRequest): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.PROMOTION_ADD_TO_CATEGORY,
      data,
      true
    );
  },

  // Add promotion to brand (requires STAFF/ADMIN)
  addPromotionToBrand: async (data: AddPromotionToBrandRequest): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.PROMOTION_ADD_TO_BRAND,
      data,
      true
    );
  },
};
