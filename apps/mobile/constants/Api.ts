import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage helper en memoria y con persistencia multiplataforma (AsyncStorage + Web localStorage)
let inMemoryToken: string | null = null;
let inMemoryUser: any = null;
let inMemoryHousehold: any = null;
let inMemoryApiUrl: string | null = null;

// Inicialización de entorno
const DEFAULT_ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-hogariq.kasino21.com';

/**
 * Inicializa el almacenamiento en memoria leyendo de AsyncStorage al arrancar la app.
 */
export async function initStorage(): Promise<boolean> {
  try {
    const [token, user, household, url] = await Promise.all([
      AsyncStorage.getItem('hogariq_mobile_token'),
      AsyncStorage.getItem('hogariq_mobile_user'),
      AsyncStorage.getItem('hogariq_mobile_household'),
      AsyncStorage.getItem('hogariq_mobile_api_url'),
    ]);

    if (token) inMemoryToken = token;
    if (user) {
      try { inMemoryUser = JSON.parse(user); } catch {}
    }
    if (household) {
      try { inMemoryHousehold = JSON.parse(household); } catch {}
    }
    if (url) inMemoryApiUrl = url;

    return !!inMemoryToken;
  } catch (e) {
    console.warn('Error inicializando AsyncStorage:', e);
    return false;
  }
}

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
  AsyncStorage.setItem('hogariq_mobile_api_url', cleanUrl).catch(() => {});
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
  if (token) {
    AsyncStorage.setItem('hogariq_mobile_token', token).catch(() => {});
  } else {
    AsyncStorage.removeItem('hogariq_mobile_token').catch(() => {});
  }

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
  if (user) {
    AsyncStorage.setItem('hogariq_mobile_user', JSON.stringify(user)).catch(() => {});
  } else {
    AsyncStorage.removeItem('hogariq_mobile_user').catch(() => {});
  }

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
  if (household) {
    AsyncStorage.setItem('hogariq_mobile_household', JSON.stringify(household)).catch(() => {});
  } else {
    AsyncStorage.removeItem('hogariq_mobile_household').catch(() => {});
  }

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

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = '@hogariq_offline_queue';
const queueListeners: Set<(count: number) => void> = new Set();

export async function getOfflineQueue(): Promise<QueuedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getOfflineQueueCount(): Promise<number> {
  const q = await getOfflineQueue();
  return q.length;
}

function notifyQueueListeners(count: number) {
  queueListeners.forEach((fn) => {
    try {
      fn(count);
    } catch {}
  });
}

export function subscribeOfflineQueue(callback: (count: number) => void): () => void {
  queueListeners.add(callback);
  getOfflineQueueCount().then(callback).catch(() => {});
  return () => {
    queueListeners.delete(callback);
  };
}

export async function enqueueOfflineMutation(
  endpoint: string,
  method: string,
  options: RequestInit = {}
): Promise<QueuedMutation> {
  const queue = await getOfflineQueue();
  const mutation: QueuedMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    endpoint,
    method: method.toUpperCase(),
    body: typeof options.body === 'string' ? options.body : undefined,
    headers: (options.headers as Record<string, string>) || {},
    timestamp: Date.now(),
    retryCount: 0,
  };
  queue.push(mutation);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  notifyQueueListeners(queue.length);
  return mutation;
}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number; remaining: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  let synced = 0;
  let failed = 0;
  const remainingQueue: QueuedMutation[] = [];

  const currentApiUrl = getApiUrl();
  const token = getAuthToken();

  for (const item of queue) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(item.headers || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const fullUrl = item.endpoint.startsWith('http') ? item.endpoint : `${currentApiUrl}${item.endpoint}`;
      const res = await fetch(fullUrl, {
        method: item.method,
        headers,
        body: item.body,
      });

      if (res.ok || (res.status >= 200 && res.status < 300)) {
        synced++;
      } else if (res.status >= 400 && res.status < 500) {
        // Error irrecuperable de cliente: descartar para evitar taponar la cola
        failed++;
      } else {
        // Error de servidor (5xx): mantener para reintento
        item.retryCount = (item.retryCount || 0) + 1;
        remainingQueue.push(item);
      }
    } catch {
      // Red aún caída: conservar mutación
      remainingQueue.push(item);
    }
  }

  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  notifyQueueListeners(remainingQueue.length);
  return { synced, failed, remaining: remainingQueue.length };
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  notifyQueueListeners(0);
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const currentApiUrl = getApiUrl();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${currentApiUrl}${endpoint}`;

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });
    return res;
  } catch (err: any) {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isNetworkError =
      err?.message?.includes('Network request failed') ||
      err?.name === 'TypeError' ||
      err?.message?.includes('fetch failed') ||
      err?.message?.includes('Failed to fetch');

    if (isMutation && isNetworkError) {
      console.warn(`[OfflineQueue] Encolando mutación offline ${method} ${endpoint}`);
      await enqueueOfflineMutation(endpoint, method, options);

      const mockBody = JSON.stringify({
        _offlineQueued: true,
        message: 'Guardado en cola offline. Se sincronizará automáticamente cuando recuperes conexión.',
      });

      if (typeof Response !== 'undefined') {
        try {
          return new Response(mockBody, {
            status: 202,
            statusText: 'Accepted (Offline Queued)',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch {}
      }

      return {
        ok: true,
        status: 202,
        statusText: 'Accepted (Offline Queued)',
        json: async () => JSON.parse(mockBody),
        text: async () => mockBody,
        headers: { get: () => 'application/json' } as any,
      } as unknown as Response;
    }

    throw err;
  }
}


/**
 * Obtiene la lista de hogares disponibles para el usuario actual.
 */
export async function getAvailableHouseholds(): Promise<any[]> {
  try {
    const res = await fetchWithAuth('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      return data.availableHouseholds || [];
    }
  } catch (e) {
    console.error('Error fetching available households:', e);
  }
  return [];
}

/**
 * Cambia el hogar activo del usuario, actualizando el JWT y el hogar en storage.
 */
export async function switchHouseholdApi(targetHouseholdId: string): Promise<boolean> {
  try {
    const res = await fetchWithAuth('/api/auth/switch-household', {
      method: 'POST',
      body: JSON.stringify({ householdId: targetHouseholdId }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) setAuthToken(data.accessToken);
      if (data.user) setUser(data.user);
      if (data.household) setHousehold(data.household);
      return true;
    }
  } catch (e) {
    console.error('Error conmutando hogar:', e);
  }
  return false;
}
