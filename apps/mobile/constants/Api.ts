import { Platform } from 'react-native';

// Storage helper en memoria y con fallback a localStorage/global window
let inMemoryToken: string | null = null;
let inMemoryUser: any = null;
let inMemoryHousehold: any = null;
let inMemoryApiUrl: string | null = null;

// Inicialización de entorno
const DEFAULT_ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export function getApiUrl(): string {
  if (inMemoryApiUrl) return inMemoryApiUrl;
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('hogariq_mobile_api_url');
    if (saved) {
      inMemoryApiUrl = saved;
      return saved;
    }
  }
  return DEFAULT_ENV_API_URL;
}

export function setApiUrl(url: string) {
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  inMemoryApiUrl = cleanUrl;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('hogariq_mobile_api_url', cleanUrl);
  }
}

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('hogariq_mobile_token');
    if (saved) {
      inMemoryToken = saved;
      return saved;
    }
  }
  return null;
}

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (token) {
      window.localStorage.setItem('hogariq_mobile_token', token);
    } else {
      window.localStorage.removeItem('hogariq_mobile_token');
    }
  }
}

export function getUser(): any {
  if (inMemoryUser) return inMemoryUser;
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('hogariq_mobile_user');
    if (saved) {
      try {
        inMemoryUser = JSON.parse(saved);
        return inMemoryUser;
      } catch (e) {}
    }
  }
  return null;
}

export function setUser(user: any) {
  inMemoryUser = user;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (user) {
      window.localStorage.setItem('hogariq_mobile_user', JSON.stringify(user));
    } else {
      window.localStorage.removeItem('hogariq_mobile_user');
    }
  }
}

export function getHousehold(): any {
  if (inMemoryHousehold) return inMemoryHousehold;
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('hogariq_mobile_household');
    if (saved) {
      try {
        inMemoryHousehold = JSON.parse(saved);
        return inMemoryHousehold;
      } catch (e) {}
    }
  }
  return null;
}

export function setHousehold(household: any) {
  inMemoryHousehold = household;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (household) {
      window.localStorage.setItem('hogariq_mobile_household', JSON.stringify(household));
    } else {
      window.localStorage.removeItem('hogariq_mobile_household');
    }
  }
}

export function logout() {
  setAuthToken(null);
  setUser(null);
  setHousehold(null);
}

export const API_URL = getApiUrl();

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const currentApiUrl = getApiUrl();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${currentApiUrl}${endpoint}`;
  return fetch(fullUrl, {
    ...options,
    headers,
  });
}
