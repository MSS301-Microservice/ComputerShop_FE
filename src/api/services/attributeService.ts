import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { ApiResponse, PagedResponse } from '../types/common';
import {
  AttributeResponse,
  AttributeCreationRequest,
  AttributeUpdateRequest,
} from '../types/attribute';

export const attributeService = {
  // Get all attributes
  getAllAttributes: async (): Promise<AttributeResponse[]> => {
    const response = await apiClient.get<AttributeResponse[]>(
      API_ENDPOINTS.ATTRIBUTES
    );
    return response.result || [];
  },

  // Get all attributes paged
  getAllAttributesPaged: async (page = 0, size = 10): Promise<PagedResponse<AttributeResponse>> => {
    const response = await apiClient.get<PagedResponse<AttributeResponse>>(
      `${API_ENDPOINTS.ATTRIBUTES_PAGED}?page=${page}&size=${size}`
    );
    return response.result!;
  },

  // Get attribute by ID
  getAttributeById: async (id: number): Promise<AttributeResponse> => {
    const response = await apiClient.get<AttributeResponse>(
      API_ENDPOINTS.ATTRIBUTE_BY_ID(id)
    );
    if (!response.result) {
      throw new Error('Attribute not found');
    }
    return response.result;
  },

  // Create new attribute (requires STAFF or ADMIN role)
  createAttribute: async (
    data: AttributeCreationRequest
  ): Promise<AttributeResponse> => {
    const response = await apiClient.post<AttributeResponse>(
      API_ENDPOINTS.ATTRIBUTES,
      data,
      true // requires authentication
    );
    if (!response.result) {
      throw new Error('Failed to create attribute');
    }
    return response.result;
  },

  // Update attribute (requires STAFF or ADMIN role)
  updateAttribute: async (
    id: number,
    data: AttributeUpdateRequest
  ): Promise<AttributeResponse> => {
    const response = await apiClient.put<AttributeResponse>(
      API_ENDPOINTS.ATTRIBUTE_BY_ID(id),
      data,
      true // requires authentication
    );
    if (!response.result) {
      throw new Error('Failed to update attribute');
    }
    return response.result;
  },

  // Delete attribute (requires STAFF or ADMIN role)
  deleteAttribute: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ATTRIBUTE_BY_ID(id), true);
  },
};
