// Attribute API Types
export interface AttributeResponse {
  attributeId: number;
  attributeName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributeCreationRequest {
  attributeName: string;
}

export interface AttributeUpdateRequest {
  attributeName: string;
}
