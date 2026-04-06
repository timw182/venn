import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiBase || 'https://api.venn.lu/api';
if (!__DEV__ && !API_BASE.startsWith('https://')) {
  throw new Error('API base must use HTTPS in production');
}
const TOKEN_KEY = 'vn_session_token';
const REQUEST_TIMEOUT = 15000;

// Global 401 listener — AuthContext hooks into this to force logout
let _onUnauthorized = null;
export function setOnUnauthorized(fn) { _onUnauthorized = fn; }

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
}

export async function storeToken(token) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token).catch((e) => {
      console.warn('SecureStore write failed:', e);
    });
  }
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Session-Token': token } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    const isAuthPath = path.startsWith('/auth/');
    if (!isAuthPath) {
      await clearSession();
      _onUnauthorized?.();
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => {
          const field = e.loc?.[e.loc.length - 1];
          const label = field === 'username' ? 'Email' : field === 'display_name' ? 'Name' : field;
          const msg = (e.msg || '').replace(/^Value error, /i, '');
          return label ? `${label}: ${msg}` : msg;
        }).join('\n')
      : typeof detail === 'string'
      ? detail
      : `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

const client = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
};

export default client;
