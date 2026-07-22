import { Platform } from 'react-native';

// Para emulador de Android usa 10.0.2.2, para Web/iOS localhost
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // En producción se almacena token, por ahora simulamos con credenciales o token si existe
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
