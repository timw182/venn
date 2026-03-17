const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 401) {
    const isAuthPath = path.startsWith('/auth/');
    if (!isAuthPath && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const { detail } = body;
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
  get:    (path)        => request(path),
  post:   (path, data)  => request(path, { method: 'POST',   body: JSON.stringify(data) }),
  put:    (path, data)  => request(path, { method: 'PUT',    body: JSON.stringify(data) }),
  patch:  (path, data)  => request(path, { method: 'PATCH',  body: JSON.stringify(data) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
};

export default client;
