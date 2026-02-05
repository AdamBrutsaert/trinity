import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = '@trinity_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[api] baseURL =', API_BASE_URL);
}

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  async login(email, password) {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email: email.toLowerCase().trim(),
        password,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        return { success: true, token: response.data.token };
      }
      
      return { success: false, error: 'No token received' };
    } catch (error) {
      const method = error?.config?.method?.toUpperCase();
      const url = `${error?.config?.baseURL || ''}${error?.config?.url || ''}`;
      console.error('Login error:', {
        message: error?.message,
        code: error?.code,
        method,
        url,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      
      if (error.response && error.response.status === 401) {
        return { success: false, error: 'Invalid email or password.' };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: `Request timed out while calling the API (${API_BASE_URL}). Check the IP/port and make sure your phone is on the same network.`,
        };
      }

      if (!error.response) {
        return {
          success: false,
          error: `Unable to reach the API (${API_BASE_URL}). Make sure the backend is running and reachable from this device.`,
        };
      }

      const serverMessage =
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.message;
      
      return { 
        success: false, 
        error: serverMessage || 'An error occurred while signing in.' 
      };
    }
  },

  async register(userData) {
    try {
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        return { success: false, error: 'Please fill in all required fields.' };
      }

      if (userData.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      const response = await apiClient.post(API_ENDPOINTS.REGISTER, {
        ...userData,
        email: userData.email.toLowerCase().trim(),
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        return { success: true, token: response.data.token };
      }
      
      return { success: false, error: 'No token received' };
    } catch (error) {
      const method = error?.config?.method?.toUpperCase();
      const url = `${error?.config?.baseURL || ''}${error?.config?.url || ''}`;
      console.error('Register error:', {
        message: error?.message,
        code: error?.code,
        method,
        url,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      
      if (error.response && error.response.status === 409) {
        return { success: false, error: 'This email is already in use.' };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: `Request timed out while calling the API (${API_BASE_URL}). Check the IP/port and make sure your phone is on the same network.`,
        };
      }

      if (!error.response) {
        return {
          success: false,
          error: `Unable to reach the API (${API_BASE_URL}). Make sure the backend is running and reachable from this device.`,
        };
      }

      const serverMessage =
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.message;
      
      return { 
        success: false, 
        error: serverMessage || 'An error occurred while signing up.' 
      };
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Error while logging out.' };
    }
  },

  async getToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  },
};
