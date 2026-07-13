import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services/authService';
import { UserInfo } from '../api/types/auth';

interface User {
  email: string;
  role: 'admin' | 'staff' | 'user';
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setLoading(false); return; }

        // Decode JWT locally trước để check expiry — không cần network
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            // Token hết hạn rõ ràng — xóa
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setLoading(false);
            return;
          }
          // Token còn hạn — set user từ local decode ngay, không chờ network
          const rawRole = payload.scope || payload.role || '';
          const roleStr = Array.isArray(rawRole) ? rawRole[0] : rawRole;
          const cleanRole = roleStr.replace('ROLE_', '').toUpperCase();
          let mappedRole: 'admin' | 'staff' | 'user' = 'user';
          if (cleanRole === 'ADMIN') mappedRole = 'admin';
          else if (cleanRole === 'STAFF') mappedRole = 'staff';
          setUser({
            email: payload.sub || payload.email || '',
            role: mappedRole,
            name: payload.name || payload.username || (payload.sub || '').split('@')[0],
          });
        } catch {
          // Token malformed — xóa
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      console.log('AuthContext - login response:', response);
      
      // Nếu có token thì coi như thành công
      if (response.token) {
        // Lấy role thực từ introspect trước khi set user
        const userInfo = await authService.getCurrentUser();
        console.log('AuthContext - user info from introspect:', userInfo);
        
        if (userInfo) {
          // Map backend roles to frontend roles
          let mappedRole: 'admin' | 'staff' | 'user' = 'user';
          const backendRole = userInfo.role?.toUpperCase();
          
          if (backendRole === 'ADMIN') {
            mappedRole = 'admin';
          } else if (backendRole === 'STAFF') {
            mappedRole = 'staff';
          } else {
            mappedRole = 'user'; // MEMBER or any other role
          }
          
          const newUser: User = {
            email: userInfo.email,
            role: mappedRole,
            name: userInfo.name || userInfo.email.split('@')[0],
          };
          setUser(newUser);
          console.log('AuthContext - user set with real role:', newUser);
          return; // Success
        }
        
        throw new Error('Failed to get user info from token');
      }
      throw new Error('Authentication failed - no token');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await authService.googleLogin(idToken);
      if (response.token) {
        const userInfo = await authService.getCurrentUser();
        if (userInfo) {
          let mappedRole: 'admin' | 'staff' | 'user' = 'user';
          const backendRole = userInfo.role?.toUpperCase();
          if (backendRole === 'ADMIN') mappedRole = 'admin';
          else if (backendRole === 'STAFF') mappedRole = 'staff';
          setUser({
            email: userInfo.email,
            role: mappedRole,
            name: userInfo.name || userInfo.email.split('@')[0],
          });
          return;
        }
      }
      throw new Error('Google login failed');
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
