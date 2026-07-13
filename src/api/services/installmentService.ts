// Installment Package Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { PagedResponse } from '../types/common';
import { 
  InstallmentPackageResponse, 
  InstallmentPackageRequest,
  InstallmentCalculateRequest,
  InstallmentPreviewResponse,
} from '../types/installment';

export const installmentService = {
  // Get all active installment packages (requires authentication)
  getActivePackages: async (): Promise<InstallmentPackageResponse[]> => {
    const response = await apiClient.get<InstallmentPackageResponse[]>(
      API_ENDPOINTS.INSTALLMENT_PACKAGES_ACTIVE,
      true // Requires authentication
    );
    return response.result || [];
  },

  // Get all installment packages (requires authentication)
  getAllPackages: async (): Promise<InstallmentPackageResponse[]> => {
    const response = await apiClient.get<InstallmentPackageResponse[]>(
      API_ENDPOINTS.INSTALLMENT_PACKAGES,
      true // Requires authentication
    );
    return response.result || [];
  },

  // Get all installment packages paged (requires authentication)
  getAllPackagesPaged: async (page = 0, size = 10): Promise<PagedResponse<InstallmentPackageResponse>> => {
    const response = await apiClient.get<PagedResponse<InstallmentPackageResponse>>(
      `${API_ENDPOINTS.INSTALLMENT_PACKAGES_PAGED}?page=${page}&size=${size}`,
      true
    );
    return response.result!;
  },

  // Create installment package (requires STAFF/ADMIN)
  createPackage: async (data: InstallmentPackageRequest): Promise<InstallmentPackageResponse> => {
    const response = await apiClient.post<InstallmentPackageResponse>(
      API_ENDPOINTS.INSTALLMENT_PACKAGES,
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to create installment package');
    }
    return response.result;
  },

  // Update installment package (requires STAFF/ADMIN)
  updatePackage: async (
    id: number, 
    data: InstallmentPackageRequest
  ): Promise<InstallmentPackageResponse> => {
    const response = await apiClient.put<InstallmentPackageResponse>(
      API_ENDPOINTS.INSTALLMENT_PACKAGE_BY_ID(id),
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update installment package');
    }
    return response.result;
  },

  // Delete installment package (requires STAFF/ADMIN)
  deletePackage: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.INSTALLMENT_PACKAGE_BY_ID(id), true);
  },

  // Calculate installment preview
  calculatePreview: async (data: InstallmentCalculateRequest): Promise<InstallmentPreviewResponse> => {
    const response = await apiClient.post<InstallmentPreviewResponse>(
      API_ENDPOINTS.INSTALLMENT_CALCULATE,
      data,
      true
    );
    if (!response.result) throw new Error('Failed to calculate installment');
    return response.result;
  },
};

