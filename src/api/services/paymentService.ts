// Payment Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { PaymentDTO, PaymentResultResponse } from '../types/payment';

export const paymentService = {
  // Create VNPay payment
  createPayment: async (orderId: number, bankCode?: string, installmentNo?: number): Promise<PaymentDTO> => {
    const params = new URLSearchParams();
    params.append('orderId', orderId.toString());
    if (bankCode) {
      params.append('bankCode', bankCode);
    }
    if (installmentNo !== undefined && installmentNo !== null) {
      params.append('installmentNo', installmentNo.toString());
    }

    const response = await apiClient.get<PaymentDTO>(
      `${API_ENDPOINTS.PAYMENT_CREATE}?${params.toString()}`,
      true
    );
    
    console.log('[paymentService] createPayment raw response:', JSON.stringify(response));
    
    if (!response.result) {
      throw new Error('Failed to create payment');
    }
    // Backend có thể trả về result là string URL hoặc object { paymentUrl }
    if (typeof response.result === 'string') {
      return { paymentUrl: response.result as string };
    }
    return response.result;
  },

  // Redirect to VNPay payment URL
  redirectToPayment: (paymentUrl: string) => {
    window.location.href = paymentUrl;
  },

  // Query final payment result from backend
  getPaymentResult: async (orderId: number, installmentNo?: number): Promise<PaymentResultResponse> => {
    const params = new URLSearchParams();
    if (installmentNo !== undefined && installmentNo !== null) {
      params.append('installmentNo', installmentNo.toString());
    }

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.ORDER_PAYMENT_RESULT(orderId)}?${params.toString()}`
      : API_ENDPOINTS.ORDER_PAYMENT_RESULT(orderId);

    const response = await apiClient.get<PaymentResultResponse>(endpoint, true);
    if (!response.result) throw new Error('Failed to get payment result');
    return response.result;
  },
};