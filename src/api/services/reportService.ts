import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { GroupBy, RevenueTimeResponse, RevenueProductResponse, RevenueInstallmentResponse } from '../types/report';

export interface RevenueTimeParams {
  fromDate?: string;
  toDate?: string;
  groupBy?: GroupBy;
}

export interface RevenueProductParams {
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export const reportService = {
  getRevenueTime: async (params: RevenueTimeParams = {}): Promise<RevenueTimeResponse> => {
    const q = new URLSearchParams();
    if (params.fromDate) q.set('fromDate', params.fromDate);
    if (params.toDate) q.set('toDate', params.toDate);
    if (params.groupBy) q.set('groupBy', params.groupBy);
    const url = `${API_ENDPOINTS.REPORTS_REVENUE_TIME}${q.toString() ? '?' + q : ''}`;
    const res = await apiClient.get<RevenueTimeResponse>(url, true);
    return res.result!;
  },

  getRevenueProduct: async (params: RevenueProductParams = {}): Promise<RevenueProductResponse> => {
    const q = new URLSearchParams();
    if (params.fromDate) q.set('fromDate', params.fromDate);
    if (params.toDate) q.set('toDate', params.toDate);
    if (params.limit) q.set('limit', String(params.limit));
    const url = `${API_ENDPOINTS.REPORTS_REVENUE_PRODUCT}${q.toString() ? '?' + q : ''}`;
    const res = await apiClient.get<RevenueProductResponse>(url, true);
    return res.result!;
  },

  getRevenueInstallment: async (): Promise<RevenueInstallmentResponse> => {
    const res = await apiClient.get<RevenueInstallmentResponse>(API_ENDPOINTS.REPORTS_REVENUE_INSTALLMENT, true);
    return res.result!;
  },

  exportRevenueTime: (params: RevenueTimeParams = {}) => {
    const q = new URLSearchParams();
    if (params.fromDate) q.set('fromDate', params.fromDate);
    if (params.toDate) q.set('toDate', params.toDate);
    if (params.groupBy) q.set('groupBy', params.groupBy);
    const token = localStorage.getItem('authToken');
    const url = `${API_ENDPOINTS.REPORTS_REVENUE_TIME_EXPORT}${q.toString() ? '?' + q : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `doanh-thu-thoi-gian.xlsx`;
        a.click();
      });
  },

  exportRevenueProduct: (params: RevenueProductParams = {}) => {
    const q = new URLSearchParams();
    if (params.fromDate) q.set('fromDate', params.fromDate);
    if (params.toDate) q.set('toDate', params.toDate);
    if (params.limit) q.set('limit', String(params.limit));
    const token = localStorage.getItem('authToken');
    const url = `${API_ENDPOINTS.REPORTS_REVENUE_PRODUCT_EXPORT}${q.toString() ? '?' + q : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `doanh-thu-san-pham.xlsx`;
        a.click();
      });
  },

  exportRevenueInstallment: () => {
    const token = localStorage.getItem('authToken');
    fetch(API_ENDPOINTS.REPORTS_REVENUE_INSTALLMENT_EXPORT, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `doanh-thu-tra-gop.xlsx`;
        a.click();
      });
  },
};
