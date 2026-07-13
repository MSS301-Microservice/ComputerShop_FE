// Promotion API Types

export interface PromotionResponse {
  promotionId: number;
  promoCode: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromotionCreationRequest {
  promoCode: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface PromotionUpdateRequest {
  promoCode?: string;
  description?: string;
  discountPercent?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface AddPromotionToProductsRequest {
  promotionId: number;
  productIds: number[];
}

export interface AddPromotionToCategoryRequest {
  promotionId: number;
  categoryId: number;
}

export interface AddPromotionToBrandRequest {
  promotionId: number;
  brandId: number;
}
