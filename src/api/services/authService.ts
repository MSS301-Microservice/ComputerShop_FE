import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { ApiResponse } from '../types/common';
import {
  AuthenticationRequest,
  AuthenticationResponse,
  IntrospectRequest,
  IntrospectResponse,
  LogoutRequest,
  RefreshRequest,
  UserInfo,
} from '../types/auth';

export const authService = {
  // Login
  login: async (
    email: string,
    password: string
  ): Promise<AuthenticationResponse> => {
    const request: AuthenticationRequest = { email, password };
    console.log('Login request:', request);
    
    const response = await apiClient.post<AuthenticationResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      request
    );
    
    console.log('Login response:', response);
    
    if (!response.result) {
      throw new Error('Login failed - no result in response');
    }

    // Store tokens in localStorage
    if (response.result.token) {
      localStorage.setItem('authToken', response.result.token);
    }
    if (response.result.refreshToken) {
      localStorage.setItem('refreshToken', response.result.refreshToken);
    }

    return response.result;
  },

  // Logout
  logout: async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const request: LogoutRequest = { token };
        await apiClient.post(API_ENDPOINTS.AUTH_LOGOUT, request);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear tokens from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },

  // Introspect token (validate and get user info)
  introspect: async (): Promise<IntrospectResponse> => {
    const token = localStorage.getItem('authToken');
    console.log('Introspect - token:', token ? 'exists' : 'missing');
    
    if (!token) {
      throw new Error('No token found');
    }

    const request: IntrospectRequest = { token };
    console.log('Introspect request:', request);
    
    const response = await apiClient.post<IntrospectResponse>(
      API_ENDPOINTS.AUTH_INTROSPECT,
      request
    );

    console.log('Introspect response:', response);

    if (!response.result) {
      throw new Error('Token introspection failed');
    }

    return response.result;
  },

  // Refresh token
  refreshToken: async (): Promise<AuthenticationResponse> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const request: RefreshRequest = { token: refreshToken };
    const response = await apiClient.post<AuthenticationResponse>(
      API_ENDPOINTS.AUTH_REFRESH,
      request
    );

    if (!response.result) {
      throw new Error('Token refresh failed');
    }

    // Update tokens in localStorage
    if (response.result.token) {
      localStorage.setItem('authToken', response.result.token);
    }
    if (response.result.refreshToken) {
      localStorage.setItem('refreshToken', response.result.refreshToken);
    }

    return response.result;
  },

  // Get current user info from token — decode JWT locally, không cần introspect
  getCurrentUser: async (): Promise<UserInfo | null> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      // Decode JWT payload locally trước
      let payload: any;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
      } catch {
        return null;
      }

      // Kiểm tra token hết hạn locally
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('getCurrentUser - token expired locally');
        return null;
      }

      // Introspect để verify với server
      console.log('getCurrentUser - calling introspect...');
      try {
        const introspectResult = await authService.introspect();
        console.log('getCurrentUser - introspect result:', introspectResult);
        if (!introspectResult.valid) return null;
      } catch (introspectError: any) {
        // Nếu lỗi network (500, timeout), dùng local decode thay vì logout
        const code = introspectError?.code;
        if (code === 401 || code === 403 || code === 1006 || code === 1005) {
          return null; // Token thực sự invalid
        }
        // Lỗi network — tin tưởng local decode
        console.warn('getCurrentUser - introspect network error, using local decode');
      }

      console.log('getCurrentUser - full decoded payload:', JSON.stringify(payload));

      const rawRole = payload.scope || payload.role || payload.roles ||
                     payload.authorities || payload.roleName || '';
      const roleStr = Array.isArray(rawRole) ? rawRole[0] : rawRole;
      const cleanRole = roleStr.replace('ROLE_', '').toUpperCase();
      console.log('getCurrentUser - extracted role:', cleanRole);

      return {
        email: payload.sub || payload.email || '',
        role: cleanRole || 'MEMBER',
        name: payload.name || payload.username || '',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Google login with ID token credential
  googleLogin: async (idToken: string): Promise<AuthenticationResponse> => {
    const response = await apiClient.post<AuthenticationResponse>(
      API_ENDPOINTS.AUTH_GOOGLE,
      { token: idToken }
    );
    if (!response.result) {
      throw new Error('Google login failed - no result in response');
    }
    if (response.result.token) {
      localStorage.setItem('authToken', response.result.token);
    }
    if (response.result.refreshToken) {
      localStorage.setItem('refreshToken', response.result.refreshToken);
    }
    return response.result;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },
};
