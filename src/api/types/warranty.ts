// Warranty & Claim API Types

export type WarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOIDED';
export type WarrantyType = 'MANUFACTURER' | 'SELLER';
export type ClaimStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
export type SolutionType = 'REPAIR' | 'REPLACE' | 'REFUND' | 'REJECT';

export interface ClaimResponse {
  claimId: number;
  warrantyId: number;
  claimDate: string;
  customerNote?: string;
  technicianNote?: string;
  status: ClaimStatus;
  solutionType?: SolutionType;
  returnDate?: string;
}

export interface WarrantyResponse {
  id: number;
  orderItemId: number;
  productId: number;
  productName: string;
  serialNumber?: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: WarrantyStatus;
  type: WarrantyType;
  claims?: ClaimResponse[];
}

export interface ClaimCreationRequest {
  warrantyId: number;
  customerNote?: string;
}

export interface UpdateClaimRequest {
  technicianNote?: string;
  status?: ClaimStatus;
  solutionType?: SolutionType;
  returnDate?: string;
}

export interface UpdateWarrantyStatusRequest {
  status: WarrantyStatus;
}
