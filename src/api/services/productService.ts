// Product Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { 
  ProductResponse, 
  ProductDetailResponse,
  ProductCreationRequest, 
  ProductUpdateRequest,
  ProductFilterParams 
} from '../types/product';
import { PagedResponse } from '../types/common';

export interface ProductPageParams extends ProductFilterParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const productService = {
  // Get all products with optional filters (public)
  getAllProducts: async (filters?: ProductFilterParams): Promise<ProductResponse[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.brandId) params.append('brandId', filters.brandId.toString());
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.attributes?.length) {
      filters.attributes.forEach(a => params.append('attributes', a));
    }
    const url = params.toString() ? `${API_ENDPOINTS.PRODUCTS}?${params}` : API_ENDPOINTS.PRODUCTS;
    const response = await apiClient.get<ProductResponse[]>(url);
    return response.result || [];
  },

  // Get products paged with optional filters (public)
  getProductsPaged: async (params: ProductPageParams = {}): Promise<PagedResponse<ProductResponse>> => {
    const { page = 0, size = 12, sortBy = 'productId', sortDir = 'asc', categoryId, brandId, minPrice, maxPrice } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDir });
    if (categoryId) query.append('categoryId', String(categoryId));
    if (brandId) query.append('brandId', String(brandId));
    if (minPrice) query.append('minPrice', String(minPrice));
    if (maxPrice) query.append('maxPrice', String(maxPrice));
    const response = await apiClient.get<PagedResponse<ProductResponse>>(`${API_ENDPOINTS.PRODUCTS_PAGED}?${query}`);
    return response.result!;
  },

  // Search products paged (public)
  searchProductsPaged: async (keyword: string, params: { page?: number; size?: number; sortBy?: string; sortDir?: string } = {}): Promise<PagedResponse<ProductResponse>> => {
    const { page = 0, size = 12, sortBy = 'productId', sortDir = 'asc' } = params;
    const query = new URLSearchParams({ keyword: encodeURIComponent(keyword), page: String(page), size: String(size), sortBy, sortDir });
    const response = await apiClient.get<PagedResponse<ProductResponse>>(`${API_ENDPOINTS.PRODUCTS_SEARCH_PAGED}?${query}`);
    return response.result!;
  },

  // Get product by ID with full details (public)
  getProductById: async (id: number): Promise<ProductDetailResponse> => {
    const response = await apiClient.get<ProductDetailResponse>(
      API_ENDPOINTS.PRODUCT_BY_ID(id)
    );
    if (!response.result) {
      throw new Error('Product not found');
    }
    return response.result;
  },

  // Search products by keyword (public)
  searchProducts: async (keyword: string): Promise<ProductResponse[]> => {
    const response = await apiClient.get<ProductResponse[]>(
      `${API_ENDPOINTS.PRODUCTS_SEARCH}?keyword=${encodeURIComponent(keyword)}`
    );
    return response.result || [];
  },

  // Create product with images (requires STAFF/ADMIN) - uses multipart/form-data
  createProduct: async (
    data: ProductCreationRequest, 
    images?: File[]
  ): Promise<ProductResponse> => {
    const formData = new FormData();
    
    // Add product data as JSON blob
    formData.append('product', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    // Add images if provided
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }

    const token = localStorage.getItem('authToken');
    const apiBaseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
    const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRODUCTS}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.result) {
      throw new Error(result.message || 'Failed to create product');
    }
    return result.result;
  },

  // Update product with images (requires STAFF/ADMIN) - uses multipart/form-data
  updateProduct: async (
    id: number,
    data: ProductUpdateRequest, 
    images?: File[]
  ): Promise<ProductResponse> => {
    const formData = new FormData();
    
    // Add product data as JSON blob
    formData.append('product', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    // Add images if provided
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }

    const token = localStorage.getItem('authToken');
    const apiBaseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
    const response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.PRODUCT_BY_ID(id)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.result) {
      throw new Error(result.message || 'Failed to update product');
    }
    return result.result;
  },

  // Delete product (requires STAFF/ADMIN)
  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCT_BY_ID(id), true);
  },
};

