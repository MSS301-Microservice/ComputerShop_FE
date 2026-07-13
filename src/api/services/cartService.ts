// Cart Service
import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { 
  CartResponse, 
  AddToCartRequest, 
  UpdateCartItemRequest 
} from '../types/cart';

export const cartService = {
  // Get my cart (requires authentication)
  getMyCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get<CartResponse>(
      API_ENDPOINTS.CART,
      true
    );
    if (!response.result) {
      throw new Error('Failed to get cart');
    }
    return response.result;
  },

  // Add item to cart (requires MEMBER/STAFF/ADMIN)
  addToCart: async (data: AddToCartRequest): Promise<CartResponse> => {
    const response = await apiClient.post<CartResponse>(
      API_ENDPOINTS.CART_ITEMS,
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to add to cart');
    }
    return response.result;
  },

  // Update cart item quantity (requires MEMBER/STAFF/ADMIN)
  updateCartItem: async (
    cartItemId: number, 
    data: UpdateCartItemRequest
  ): Promise<CartResponse> => {
    const response = await apiClient.put<CartResponse>(
      API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId),
      data,
      true
    );
    if (!response.result) {
      throw new Error('Failed to update cart item');
    }
    return response.result;
  },

  // Remove cart item (requires MEMBER/STAFF/ADMIN)
  removeCartItem: async (cartItemId: number): Promise<CartResponse> => {
    const response = await apiClient.delete<CartResponse>(
      API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId),
      true
    );
    if (!response.result) {
      throw new Error('Failed to remove cart item');
    }
    return response.result;
  },

  // Clear cart (requires MEMBER/STAFF/ADMIN)
  clearCart: async (): Promise<CartResponse> => {
    const response = await apiClient.delete<CartResponse>(
      API_ENDPOINTS.CART,
      true
    );
    if (!response.result) {
      throw new Error('Failed to clear cart');
    }
    return response.result;
  },
};
