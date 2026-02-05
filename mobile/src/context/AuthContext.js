import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const storedToken = await authService.getToken();
      if (storedToken) {
        setToken(storedToken);
        setUser({ authenticated: true });
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    
    if (result.success) {
      setToken(result.token);
      setUser({ authenticated: true, email });
      return { success: true };
    }
    
    return { success: false, error: result.error };
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    
    if (result.success) {
      setToken(result.token);
      setUser({ authenticated: true, email: userData.email });
      return { success: true };
    }
    
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const contextValue = {
    user,
    token,
    loading: loading === true,
    login,
    register,
    logout,
    isAuthenticated: user !== null && user !== undefined,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
