// Role API Types

export interface RoleResponse {
  roleId: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleCreationRequest {
  name: string;
  description?: string;
}

export interface RoleUpdateRequest {
  name?: string;
  description?: string;
}
