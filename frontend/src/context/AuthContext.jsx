import { createContext, useState, useCallback, useEffect } from 'react';
import client from '../api/client';
import { setOnUnauthorized } from '../api/client';
import { STORAGE_KEYS } from '../lib/constants';

export const AuthContext = createContext(null);

function toUser(raw) {
  return {
    id:           raw.id,
    username:     raw.username,
    displayName:  raw.display_name,
    avatarColor:  raw.avatar_color,
    coupleId:     raw.couple_id ?? null,
    partnerName:  raw.partner_name ?? null,
    isAdmin:      Boolean(raw.is_admin),
    isSuperadmin: Boolean(raw.is_superadmin),
  };
}

function clearLocalUserData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('vn_'))
    .forEach((k) => localStorage.removeItem(k));
}

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [isSolo, setIsSolo] = useState(() => localStorage.getItem(STORAGE_KEYS.SOLO) === '1');
  const [loading, setLoading] = useState(true);
  const [logoutReason, setLogoutReason] = useState(null);

  // Register 401 handler so API client clears user without hard redirect
  useEffect(() => {
    setOnUnauthorized(() => {
      clearLocalUserData();
      setUser(null);
      setLogoutReason('another_device');
    });
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    client.get('/auth/me')
      .then((raw) => { if (raw) setUser(toUser(raw)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setLogoutReason(null);
    try {
      const raw = await client.post('/auth/login', { username, password });
      clearLocalUserData();
      const u = toUser(raw);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    setLoading(true);
    try {
      const raw = await client.post('/auth/register', { username, password, display_name: displayName });
      const u = toUser(raw);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const socialLogin = useCallback(async (provider, idToken, displayName = '') => {
    setLoading(true);
    setLogoutReason(null);
    try {
      const raw = await client.post('/auth/social-web', {
        provider,
        id_token: idToken,
        display_name: displayName,
      });
      clearLocalUserData();
      const u = toUser(raw);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await client.post('/auth/logout').catch(() => {});
    clearLocalUserData();
    setUser(null);
  }, []);

  const pair = useCallback(async (code) => {
    setLoading(true);
    try {
      const raw = await client.post('/pairing/join', { code });
      setUser(toUser(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const createPairingCode = useCallback(async () => {
    const data = await client.post('/pairing/create');
    return data.code;
  }, []);

  const enterSolo = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.SOLO, '1');
    setIsSolo(true);
  }, []);

  const updateUserFromRaw = useCallback((raw) => setUser(toUser(raw)), []);

  const updateProfile = useCallback(async (displayName) => {
    const raw = await client.patch('/auth/profile', { display_name: displayName });
    setUser(toUser(raw));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isSolo, loading, logoutReason,
      login, register, socialLogin, logout,
      pair, createPairingCode, enterSolo,
      updateUserFromRaw, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
