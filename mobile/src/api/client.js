import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://venn-api.amoreapp.net/api';
const COOKIE_KEY = 'kl_session';

// Extract just the cookie name=value from a Set-Cookie header string
function parseCookieValue(setCookieHeader) {
  if (!setCookieHeader) return null;
  // Set-Cookie: kl_session=abc123; Path=/; HttpOnly; ...
  // We only want "kl_session=abc123"
  const first = setCookieHeader.split(';')[0].trim();
  return first || null;
}

// Store cookie from Set-Cookie header
async function storeSessionCookie(headers) {
  // Try direct get first (both casings — RN fetch varies by platform)
  let setCookie = headers.get('set-cookie') || headers.get('Set-Cookie');

  // Fallback: iterate headers to find set-cookie (some RN builds hide it from .get())
  if (!setCookie && typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie' && value.includes(COOKIE_KEY)) {
        setCookie = value;
      }
    });
  }

  const cookieVal = parseCookieValue(setCookie);
  if (cookieVal) {
    await AsyncStorage.setItem(COOKIE_KEY, cookieVal).catch(() => {});
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
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
};

export default client;
