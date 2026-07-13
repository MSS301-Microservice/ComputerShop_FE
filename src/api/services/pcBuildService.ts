import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  PCBuildResponse,
  AddBuildItemRequest,
  SaveBuildNameRequest,
  CompatibleVariantsRequest,
  CompatibleVariantsResponse,
} from '../types/pcbuild';
import { PlaceOrderRequest, OrderResponse } from '../types/order';

export const pcBuildService = {
  getDraft: async (): Promise<PCBuildResponse> => {
    const res = await apiClient.get<PCBuildResponse>(API_ENDPOINTS.PC_BUILDS_DRAFT, true);
    return res.result!;
  },

  getMyBuilds: async (): Promise<PCBuildResponse[]> => {
    const res = await apiClient.get<PCBuildResponse[]>(API_ENDPOINTS.PC_BUILDS, true);
    return res.result || [];
  },

  getBuildById: async (buildId: number): Promise<PCBuildResponse> => {
    const res = await apiClient.get<PCBuildResponse>(`${API_ENDPOINTS.PC_BUILDS}/${buildId}`, true);
    return res.result!;
  },

  upsertItem: async (data: AddBuildItemRequest): Promise<PCBuildResponse> => {
    const res = await apiClient.put<PCBuildResponse>(API_ENDPOINTS.PC_BUILDS_DRAFT_ITEMS, data, true);
    return res.result!;
  },

  removeItem: async (buildItemId: number): Promise<PCBuildResponse> => {
    const res = await apiClient.delete<PCBuildResponse>(API_ENDPOINTS.PC_BUILDS_DRAFT_ITEM(buildItemId), true);
    return res.result!;
  },

  saveBuild: async (data: SaveBuildNameRequest): Promise<PCBuildResponse> => {
    const res = await apiClient.put<PCBuildResponse>(API_ENDPOINTS.PC_BUILDS_DRAFT_SAVE, data, true);
    return res.result!;
  },

  getCompatibleVariants: async (data: CompatibleVariantsRequest): Promise<CompatibleVariantsResponse> => {
    const res = await apiClient.post<CompatibleVariantsResponse>(API_ENDPOINTS.PC_BUILDS_COMPATIBLE, data, true);
    return res.result!;
  },

  orderFromDraft: async (data: PlaceOrderRequest): Promise<OrderResponse> => {
    const res = await apiClient.post<OrderResponse>(API_ENDPOINTS.PC_BUILDS_DRAFT_ORDER, data, true);
    return res.result!;
  },
};
