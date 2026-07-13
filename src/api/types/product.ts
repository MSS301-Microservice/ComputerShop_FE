// Product API Types

export interface ProductImageResponse {
  imageId: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface VariantAttribute {
  attributeId: number;
  attributeName: string;
  value: string;
}

export interface ProductVariantResponse {
  variantId: number;
  variantName: string;
  sku?: string;
  price: number;
  stockQuantity: number;
  attributes: VariantAttribute[] | Record<string, string>;
}

export interface ProductResponse {
  productId: number;
  name: string;
  description?: string;
  categoryId: number;
  categoryName?: string;
  brandId: number;
  brandName?: string;
  brandLogoUrl?: string;
  basePrice: number;
  discountedPrice?: number;
  thumbnailUrl?: string;
  warrantyMonths?: number;
  variants?: ProductVariantResponse[];
  // Computed fields (not from backend directly)
  productName?: string; // Alias for 'name' (backward compatibility)
  primaryImage?: string; // Alias for 'thumbnailUrl' (backward compatibility)
  imageUrls?: string[]; // Only in detail view
  stockQuantity?: number; // Computed from variants
  averageRating?: number;
  totalReviews?: number;
  hasPromotion?: boolean;
  discountPercent?: number;
  promoCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDetailResponse extends ProductResponse {
  variants: ProductVariantResponse[];
  specifications?: Record<string, string>;
}

export interface VariantCreationRequest {
  sku: string;
  variantName: string;
  price: number;
  stockQuantity: number;
  attributes: { attributeId: number; attributeName: string; value: string }[];
}

export interface ProductCreationRequest {
  name?: string;
  description?: string;
  categoryId: number;
  brandId: number;
  warrantyMonths?: number;
  variants?: VariantCreationRequest[];
}

export interface VariantUpdateRequest {
  variantId?: number; // có = update existing, không có = tạo mới
  sku?: string;
  variantName?: string;
  price?: number;
  stockQuantity?: number;
  attributes?: { attributeId: number; attributeName: string; value: string }[];
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  warrantyMonths?: number;
  variants?: VariantUpdateRequest[];
}

export interface ProductFilterParams {
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  attributes?: string[];
}
