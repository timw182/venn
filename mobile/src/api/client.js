import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://apikinklink.amoreapp.net/api';
const COOKIE_KEY = 'kl_session';

// Store cookie from Set-Cookie header
async function storeSessionCookie(headers) {
  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    await AsyncStorage.setItem(COOKIE_KEY, setCookie).catch(() => {});
  }
}

// Retrieve stored cookie
async function getSessionCookie() {
  return AsyncStorage.getItem(COOKIE_KEY).catch(() => null);
}

export async function clearSession() {
  await AsyncStorage.removeItem(COOKIE_KEY).catch(() => {});
}

async function request(path, options = {}) {
  const cookie = await getSessionCookie();
  const headers = {
    'Content-Type': 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Capture new session cookie on login/register
  await storeSessionCookie(res.headers);

  if (res.status === 401) {
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
};

export default client;
