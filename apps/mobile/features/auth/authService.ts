import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api';

const TOKEN_KEY = '@trinity_token';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (__DEV__) {
  console.log('[api] baseURL =', API_BASE_URL);
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      const headersAny = config.headers as any;
      if (headersAny && typeof headersAny.set === 'function') {
        headersAny.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers as any),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    }
    return config;
  },
  async (error: AxiosError) => Promise.reject(error),
);

export type AuthResult = { success: true; token: string } | { success: false; error: string };

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
};

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      const response = await apiClient.post<{ token?: string }>(API_ENDPOINTS.LOGIN, {
        email: email.toLowerCase().trim(),
        password,
      });

      const token = response.data?.token;
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        return { success: true, token };
      }

      return { success: false, error: 'No token received' };
    } catch (error: any) {
      const method = String(error?.config?.method ?? '').toUpperCase();
      const url = `${String(error?.config?.baseURL ?? '')}${String(error?.config?.url ?? '')}`;
      console.error('Login error:', {
        message: error?.message,
        code: error?.code,
        method,
        url,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      if (error?.response?.status === 401) {
        return { success: false, error: 'Invalid email or password.' };
      }

      if (error?.code === 'ECONNABORTED') {
        return {
          success: false,
          error: `Request timed out while calling the API (${API_BASE_URL}). Check the IP/port and make sure your phone is on the same network.`,
        };
      }

      if (!error?.response) {
        return {
          success: false,
          error: `Unable to reach the API (${API_BASE_URL}). Make sure the backend is running and reachable from this device.`,
        };
      }

      const serverMessage =
        typeof error?.response?.data === 'string' ? error.response.data : error?.response?.data?.message;

      return { success: false, error: serverMessage || 'An error occurred while signing in.' };
    }
  },

  async register(userData: RegisterInput): Promise<AuthResult> {
    try {
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        return { success: false, error: 'Please fill in all required fields.' };
      }

      if (userData.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      const response = await apiClient.post<{ token?: string }>(API_ENDPOINTS.REGISTER, {
        ...userData,
        email: userData.email.toLowerCase().trim(),
      });

      const token = response.data?.token;
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        return { success: true, token };
      }

      return { success: false, error: 'No token received' };
    } catch (error: any) {
      const method = String(error?.config?.method ?? '').toUpperCase();
      const url = `${String(error?.config?.baseURL ?? '')}${String(error?.config?.url ?? '')}`;
      console.error('Register error:', {
        message: error?.message,
        code: error?.code,
        method,
        url,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      if (error?.response?.status === 409) {
        return { success: false, error: 'This email is already in use.' };
      }

      if (error?.code === 'ECONNABORTED') {
        return {
          success: false,
          error: `Request timed out while calling the API (${API_BASE_URL}). Check the IP/port and make sure your phone is on the same network.`,
        };
      }

      if (!error?.response) {
        return {
          success: false,
          error: `Unable to reach the API (${API_BASE_URL}). Make sure the backend is running and reachable from this device.`,
        };
      }

      const serverMessage =
        typeof error?.response?.data === 'string' ? error.response.data : error?.response?.data?.message;

      return { success: false, error: serverMessage || 'An error occurred while signing up.' };
    }
  },

  async logout(): Promise<{ success: true } | { success: false; error: string }> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Error while logging out.' };
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },
} as const;
