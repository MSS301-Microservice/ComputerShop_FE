// Category Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { PagedResponse } from '../types/common';
import { CategoryResponse, CategoryRequest, CategoryTreeNode } from '../types/category';

export const categoryService = {
  // Get all categories (public)
  getAllCategories: async (): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<CategoryResponse[]>(
      API_ENDPOINTS.CATEGORIES
    );
    return response.result || [];
  },

  // Get all categories paged (public)
  getAllCategoriesPaged: async (page = 0, size = 10): Promise<PagedResponse<CategoryResponse>> => {
    const response = await apiClient.get<PagedResponse<CategoryResponse>>(
      `${API_ENDPOINTS.CATEGORIES_PAGED}?page=${page}&size=${size}`
    );
    return response.result!;
  },

  // Get category by ID (public)
  getCategoryById: async (id: number): Promise<CategoryResponse> => {
    const response = await apiClient.get<CategoryResponse>(
      API_ENDPOINTS.CATEGORY_BY_ID(id)
    );
    if (!response.result) {
      throw new Error('Category not found');
    }
    return response.result;
  },

  // Create category (requires STAFF/ADMIN)
  createCategory: async (data: CategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.post<CategoryResponse>(
      API_ENDPOINTS.CATEGORIES,
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to create category');
    }
    return response.result;
  },

  // Update category (requires STAFF/ADMIN)
  updateCategory: async (id: number, data: CategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.put<CategoryResponse>(
      API_ENDPOINTS.CATEGORY_BY_ID(id),
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update category');
    }
    return response.result;
  },

  // Delete category (requires STAFF/ADMIN)
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(id), true);
  },

  // Get category tree (parent → children hierarchy)
  getCategoryTree: async (): Promise<CategoryTreeNode[]> => {
    const response = await apiClient.get<CategoryTreeNode[]>(API_ENDPOINTS.CATEGORIES_TREE);
    return response.result || [];
  },

  // Get only parent categories
  getParentCategories: async (): Promise<CategoryTreeNode[]> => {
    const response = await apiClient.get<CategoryTreeNode[]>(API_ENDPOINTS.CATEGORIES_PARENTS);
    return response.result || [];
  },

  // Get children of a category
  getChildren: async (id: number): Promise<CategoryTreeNode[]> => {
    const response = await apiClient.get<CategoryTreeNode[]>(API_ENDPOINTS.CATEGORIES_CHILDREN(id));
    return response.result || [];
  },
};

