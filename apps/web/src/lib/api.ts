export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-hogariq.kasino21.com';

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('hogariq_token');
}

export function setToken(token: string | null) {
  if (!isBrowser()) return;
  if (token) {
    localStorage.setItem('hogariq_token', token);
  } else {
    localStorage.removeItem('hogariq_token');
  }
}

export function getUser(): any | null {
  if (!isBrowser()) return null;
  const user = localStorage.getItem('hogariq_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setUser(user: any | null) {
  if (!isBrowser()) return;
  if (user) {
    localStorage.setItem('hogariq_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('hogariq_user');
  }
}

export function getHousehold(): any | null {
  if (!isBrowser()) return null;
  const household = localStorage.getItem('hogariq_household');
  if (!household) return null;
  try {
    return JSON.parse(household);
  } catch {
    return null;
  }
}

export function setHousehold(household: any | null) {
  if (!isBrowser()) return;
  if (household) {
    localStorage.setItem('hogariq_household', JSON.stringify(household));
  } else {
    localStorage.removeItem('hogariq_household');
  }
}

export function logout() {
  if (!isBrowser()) return;
  localStorage.removeItem('hogariq_token');
  localStorage.removeItem('hogariq_user');
  localStorage.removeItem('hogariq_household');
  window.location.href = '/login';
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Cliente HTTP unificado para el frontend web con inyección automática de JWT
 * y manejo centralizado de 401 Unauthorized.
 */
export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = getToken();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token && !skipAuth) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (res.status === 401) {
    // Sesión expirada o token inválido
    logout();
    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
  }

  if (!res.ok) {
    let errorMsg = `Error HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  // Devolver JSON si existe contenido
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return res.text() as unknown as T;
}
