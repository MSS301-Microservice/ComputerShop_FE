// User Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { UserResponse, UserCreationRequest, UserUpdateRequest } from '../types/user';
import { PagedResponse } from '../types/common';

export interface UserPageParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const userService = {
  // Create user (register)
  createUser: async (data: UserCreationRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>(API_ENDPOINTS.USERS, data);
    if (!response.result) throw new Error('Failed to create user');
    return response.result;
  },

  // Get all users (requires STAFF/ADMIN)
  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>(API_ENDPOINTS.USERS, true);
    return response.result || [];
  },

  // Get all users paged (requires STAFF/ADMIN)
  getAllUsersPaged: async (params: UserPageParams = {}): Promise<PagedResponse<UserResponse>> => {
    const { page = 0, size = 10, sortBy = 'userId', sortDir = 'asc' } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDir });
    const response = await apiClient.get<PagedResponse<UserResponse>>(`${API_ENDPOINTS.USERS_PAGED}?${query}`, true);
    return response.result!;
  },

  // Get user by ID (requires STAFF/ADMIN)
  getUserById: async (id: number): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(
      API_ENDPOINTS.USER_BY_ID(id),
      true
    );
    if (!response.result) {
      throw new Error('User not found');
    }
    return response.result;
  },

  // Update user (requires STAFF/ADMIN)
  updateUser: async (id: number, data: UserUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(
      API_ENDPOINTS.USER_BY_ID(id),
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update user');
    }
    return response.result;
  },

  // Delete user (requires STAFF/ADMIN)
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USER_BY_ID(id), true);
  },

  // Get my profile
  getMyProfile: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>(
      API_ENDPOINTS.USER_ME,
      true
    );
    if (!response.result) {
      throw new Error('Failed to get profile');
    }
    return response.result;
  },

  // Update my profile
  updateMyProfile: async (data: UserUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(
      API_ENDPOINTS.USER_ME,
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update profile');
    }
    return response.result;
  },
};
