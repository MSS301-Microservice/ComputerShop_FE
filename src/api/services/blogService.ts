// Blog Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { BlogResponse, BlogCreationRequest, BlogUpdateRequest } from '../types/blog';
import { PagedResponse } from '../types/common';

export interface BlogPageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const blogService = {
  // Get all blogs (public)
  getAllBlogs: async (): Promise<BlogResponse[]> => {
    const response = await apiClient.get<BlogResponse[]>(API_ENDPOINTS.BLOGS);
    return response.result || [];
  },

  // Get blogs paged (public)
  getAllBlogsPaged: async (params: BlogPageParams = {}): Promise<PagedResponse<BlogResponse>> => {
    const { page = 0, size = 10, sortBy = 'blogId', sortDir = 'desc' } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDir });
    const response = await apiClient.get<PagedResponse<BlogResponse>>(`${API_ENDPOINTS.BLOGS_PAGED}?${query}`);
    return response.result!;
  },

  // Get blog by ID (public)
  getBlogById: async (id: number): Promise<BlogResponse> => {
    const response = await apiClient.get<BlogResponse>(
      API_ENDPOINTS.BLOG_BY_ID(id)
    );
    if (!response.result) {
      throw new Error('Blog not found');
    }
    return response.result;
  },

  // Get blogs by user ID (public)
  getBlogsByUserId: async (userId: number): Promise<BlogResponse[]> => {
    const response = await apiClient.get<BlogResponse[]>(
      API_ENDPOINTS.BLOGS_BY_USER(userId)
    );
    return response.result || [];
  },

  // Create blog (requires MEMBER/STAFF/ADMIN)
  createBlog: async (data: BlogCreationRequest): Promise<BlogResponse> => {
    const response = await apiClient.post<BlogResponse>(
      API_ENDPOINTS.BLOGS,
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to create blog');
    }
    return response.result;
  },

  // Update blog (requires MEMBER/STAFF/ADMIN)
  updateBlog: async (id: number, data: BlogUpdateRequest): Promise<BlogResponse> => {
    const response = await apiClient.put<BlogResponse>(
      API_ENDPOINTS.BLOG_BY_ID(id),
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update blog');
    }
    return response.result;
  },

  // Delete blog (requires STAFF/ADMIN)
  deleteBlog: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BLOG_BY_ID(id), true);
  },
};
