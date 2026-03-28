import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiBase || 'https://api.venn.lu/api';
const TOKEN_KEY = 'kl_session_token';

async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
}

export async function storeToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Session-Token': token } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const isAuthPath = path.startsWith('/auth/');
    if (!isAuthPath) {
      await clearSession();
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(', ')
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
