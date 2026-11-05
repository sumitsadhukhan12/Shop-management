export const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('sv_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('sv_token', token);
  } else {
    localStorage.removeItem('sv_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired or unauthorized
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  const contentType = response.headers.get('content-type');
  let data: any;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && (contentType.includes('spreadsheet') || contentType.includes('octet-stream'))) {
    data = await response.blob();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.message) || response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return data as T;
}
