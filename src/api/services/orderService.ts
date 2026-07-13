// Order Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { OrderResponse, PlaceOrderRequest, UpdateOrderStatusRequest } from '../types/order';
import { PagedResponse } from '../types/common';

const normalizeOrder = (order: OrderResponse): OrderResponse => {
  if (!order) return order;
  if (order.paymentType) return order;

  // Backend mới có thể trả paymentMode/paymentMethod thay vì paymentType.
  const mode = (order.paymentMode || '').toUpperCase();
  const method = (order.paymentMethod || '').toUpperCase();

  if (mode === 'INSTALLMENT') {
    return { ...order, paymentType: 'INSTALLMENT' };
  }
  if (method === 'COD') {
    return { ...order, paymentType: 'COD' };
  }
  return { ...order, paymentType: 'FULL' };
};

export interface OrderPageParams {
  page?: number;
  size?: number;
}

export const orderService = {
  // Place order from cart (requires MEMBER/STAFF/ADMIN)
  placeOrder: async (data: PlaceOrderRequest): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>(API_ENDPOINTS.ORDERS, data, true);
    if (!response.result) throw new Error('Failed to place order');
    return normalizeOrder(response.result);
  },

  // Get my orders (requires authentication)
  getMyOrders: async (): Promise<OrderResponse[]> => {
    const response = await apiClient.get<OrderResponse[]>(API_ENDPOINTS.ORDERS_ME, true);
    return (response.result || []).map(normalizeOrder);
  },

  // Get my orders paged
  getMyOrdersPaged: async (params: OrderPageParams = {}): Promise<PagedResponse<OrderResponse>> => {
    const { page = 0, size = 10 } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await apiClient.get<PagedResponse<OrderResponse>>(`${API_ENDPOINTS.ORDERS_ME_PAGED}?${query}`, true);
    return response.result!;
  },

  // Get order by ID (requires authentication)
  getOrderById: async (id: number): Promise<OrderResponse> => {
    const response = await apiClient.get<OrderResponse>(API_ENDPOINTS.ORDER_BY_ID(id), true);
    if (!response.result) throw new Error('Order not found');
    return normalizeOrder(response.result);
  },

  // Get all orders (requires STAFF/ADMIN)
  getAllOrders: async (): Promise<OrderResponse[]> => {
    const response = await apiClient.get<OrderResponse[]>(API_ENDPOINTS.ORDERS, true);
    return (response.result || []).map(normalizeOrder);
  },

  // Get all orders paged (requires STAFF/ADMIN)
  getAllOrdersPaged: async (params: OrderPageParams = {}): Promise<PagedResponse<OrderResponse>> => {
    const { page = 0, size = 10 } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    const response = await apiClient.get<PagedResponse<OrderResponse>>(`${API_ENDPOINTS.ORDERS_PAGED}?${query}`, true);
    return response.result!;
  },

  // Update order status (requires STAFF/ADMIN)
  updateOrderStatus: async (id: number, data: UpdateOrderStatusRequest): Promise<OrderResponse> => {
    const response = await apiClient.put<OrderResponse>(API_ENDPOINTS.ORDER_UPDATE_STATUS(id), data, true);
    if (!response.result) throw new Error('Failed to update order status');
    return normalizeOrder(response.result);
  },

  // Cancel order (requires MEMBER/STAFF/ADMIN)
  cancelOrder: async (id: number): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.ORDER_CANCEL(id), {}, true);
  },
};

