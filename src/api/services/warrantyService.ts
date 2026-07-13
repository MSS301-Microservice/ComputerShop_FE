import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  WarrantyResponse,
  ClaimResponse,
  ClaimCreationRequest,
  UpdateClaimRequest,
  UpdateWarrantyStatusRequest,
} from '../types/warranty';

export const warrantyService = {
  getById: async (id: number): Promise<WarrantyResponse> => {
    const res = await apiClient.get<WarrantyResponse>(API_ENDPOINTS.WARRANTY_BY_ID(id), true);
    return res.result!;
  },

  getByOrderId: async (orderId: number): Promise<WarrantyResponse[]> => {
    const res = await apiClient.get<WarrantyResponse[]>(API_ENDPOINTS.WARRANTIES_BY_ORDER(orderId), true);
    return res.result || [];
  },

  getByPhone: async (phone: string): Promise<WarrantyResponse[]> => {
    const res = await apiClient.get<WarrantyResponse[]>(API_ENDPOINTS.WARRANTIES_BY_PHONE(phone), true);
    return res.result || [];
  },

  updateStatus: async (id: number, data: UpdateWarrantyStatusRequest): Promise<WarrantyResponse> => {
    const res = await apiClient.put<WarrantyResponse>(API_ENDPOINTS.WARRANTY_UPDATE_STATUS(id), data, true);
    return res.result!;
  },

  createClaim: async (data: ClaimCreationRequest): Promise<ClaimResponse> => {
    const res = await apiClient.post<ClaimResponse>(API_ENDPOINTS.CLAIMS, data, true);
    return res.result!;
  },

  getClaimById: async (id: number): Promise<ClaimResponse> => {
    const res = await apiClient.get<ClaimResponse>(API_ENDPOINTS.CLAIM_BY_ID(id), true);
    return res.result!;
  },

  getClaimsByWarranty: async (warrantyId: number): Promise<ClaimResponse[]> => {
    const res = await apiClient.get<ClaimResponse[]>(API_ENDPOINTS.CLAIMS_BY_WARRANTY(warrantyId), true);
    return res.result || [];
  },

  updateClaim: async (id: number, data: UpdateClaimRequest): Promise<ClaimResponse> => {
    const res = await apiClient.put<ClaimResponse>(API_ENDPOINTS.CLAIM_BY_ID(id), data, true);
    return res.result!;
  },
};
