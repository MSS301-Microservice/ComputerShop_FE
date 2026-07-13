// Brand API Types

export interface BrandResponse {
  brandId: number;
  brandName: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandCreationRequest {
  brandName: string;
}

export interface BrandUpdateRequest {
  brandName: string;
}
