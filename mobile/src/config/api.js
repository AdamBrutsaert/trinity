// API configuration
// IMPORTANT:
// - On Android Emulator, `localhost` points to the emulator → use `10.0.2.2`
// - On a physical phone, use the LAN IP of the machine hosting the API
// - In Expo dev, we can auto-detect the IP from the Metro bundle URL

import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3000;

function getDevServerHost() {
  // Expo (reliable for physical devices with Expo Go)
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    Constants?.manifest2?.extra?.expoClient?.hostUri;

  if (hostUri && typeof hostUri === 'string') {
    // hostUri examples:
    // - "192.168.1.10:8081"
    // - "exp://192.168.1.10:8081"
    // - "http://192.168.1.10:8081"
    const match = hostUri.match(/^(?:https?:\/\/|exp:\/\/)?([^:/?#]+)(?::\d+)?/i);
    if (match?.[1]) return match[1];
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL || typeof scriptURL !== 'string') return null;

  // Examples:
  // - http://192.168.1.10:8081/index.bundle?platform=android&dev=true
  // - exp://192.168.1.10:8081
  const httpMatch = scriptURL.match(/^https?:\/\/([^:/?#]+)(?::\d+)?/i);
  if (httpMatch?.[1]) return httpMatch[1];

  const expMatch = scriptURL.match(/^exp:\/\/([^:/?#]+)(?::\d+)?/i);
  if (expMatch?.[1]) return expMatch[1];

  return null;
}

function normalizeBaseUrl(url) {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function computeApiBaseUrl() {
  // 1) Preferred: explicit env var (works well for dev + builds)
  // Set it like: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000
  const fromEnv = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_BASE_URL : undefined;
  if (fromEnv) return normalizeBaseUrl(fromEnv);

  // 2) Dev auto-detection based on Metro/Expo host
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const host = getDevServerHost();
    if (host) return `http://${host}:${API_PORT}`;
  }

  // 3) Sensible defaults
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = computeApiBaseUrl();

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
};
