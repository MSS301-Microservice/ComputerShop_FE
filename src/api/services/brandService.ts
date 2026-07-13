// Brand Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { PagedResponse } from '../types/common';
import { BrandResponse, BrandCreationRequest, BrandUpdateRequest } from '../types/brand';

export const brandService = {
  // Get all brands (public)
  getAllBrands: async (): Promise<BrandResponse[]> => {
    const response = await apiClient.get<BrandResponse[]>(
      API_ENDPOINTS.BRANDS
    );
    return response.result || [];
  },

  // Get all brands paged (public)
  getAllBrandsPaged: async (page = 0, size = 10): Promise<PagedResponse<BrandResponse>> => {
    const response = await apiClient.get<PagedResponse<BrandResponse>>(
      `${API_ENDPOINTS.BRANDS_PAGED}?page=${page}&size=${size}`
    );
    return response.result!;
  },

  // Get brand by ID (public)
  getBrandById: async (id: number): Promise<BrandResponse> => {
    const response = await apiClient.get<BrandResponse>(
      API_ENDPOINTS.BRAND_BY_ID(id)
    );
    if (!response.result) {
      throw new Error('Brand not found');
    }
    return response.result;
  },

  // Create brand (requires STAFF/ADMIN) - with file upload
  createBrand: async (data: BrandCreationRequest, logo?: File): Promise<BrandResponse> => {
    const formData = new FormData();
    formData.append('brandName', data.brandName);
    if (logo) {
      formData.append('logo', logo);
    }

    const token = localStorage.getItem('authToken');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.BRANDS}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.result) {
      throw new Error(result.message || 'Failed to create brand');
    }
    return result.result;
  },

  // Update brand (requires STAFF/ADMIN) - with file upload
  updateBrand: async (id: number, data: BrandUpdateRequest, logo?: File): Promise<BrandResponse> => {
    const formData = new FormData();
    formData.append('brandName', data.brandName);
    if (logo) {
      formData.append('logo', logo);
    }

    const token = localStorage.getItem('authToken');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.BRAND_BY_ID(id)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.result) {
      throw new Error(result.message || 'Failed to update brand');
    }
    return result.result;
  },

  // Delete brand (requires STAFF/ADMIN)
  deleteBrand: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BRAND_BY_ID(id), true);
  },
};
