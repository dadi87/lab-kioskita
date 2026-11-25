// KiosKita API Client Helper

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('kioskita_token');
}

export function setToken(token: string): void {
  localStorage.setItem('kioskita_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('kioskita_token');
  localStorage.removeItem('kioskita_user');
}

export function getCurrentUser(): any | null {
  const userJson = localStorage.getItem('kioskita_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any): void {
  localStorage.setItem('kioskita_user', JSON.stringify(user));
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ success: false, error: 'Respons server tidak valid' }));

  if (!res.ok && !data.error) {
    data.error = `Error ${res.status}: ${res.statusText}`;
  }

  return data;
}

