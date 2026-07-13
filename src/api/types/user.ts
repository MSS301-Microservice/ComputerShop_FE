// User API Types

export interface UserResponse {
  userId: number;
  username: string;
  email: string;
  phoneNumber?: string;
  status?: string;
  roleName?: string;
  createdAt?: string;
  // Backward compatibility
  fullName?: string;
  address?: string;
  role?: string;
  updatedAt?: string;
}

export interface UserCreationRequest {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UserUpdateRequest {
  username?: string;
  password?: string;
  phoneNumber?: string;
  status?: string;
}
