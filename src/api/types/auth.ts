// Auth API Types

// Request Types
export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface IntrospectRequest {
  token: string;
}

export interface LogoutRequest {
  token: string;
}

export interface RefreshRequest {
  token: string;
}

// Response Types
export interface AuthenticationResponse {
  token: string;
  refreshToken?: string;
  authenticated: boolean;
}

export interface IntrospectResponse {
  valid: boolean;
  email?: string;
  role?: string;
  exp?: number;
}

// User info from token
export interface UserInfo {
  email: string;
  role: string;
  name?: string;
}
