import { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { clearSession, storeToken } from '../api/client';

const SOLO_KEY = 'kl_solo';

export const AuthContext = createContext(null);

function toUser(raw) {
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.display_name,
    avatarColor: raw.avatar_color,
    coupleId: raw.couple_id ?? null,
    partnerName: raw.partner_name ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isSolo, setIsSolo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/auth/me').then((raw) => setUser(toUser(raw))).catch(() => {}),
      AsyncStorage.getItem(SOLO_KEY).then((v) => { if (v) setIsSolo(true); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const raw = await client.post('/auth/login', { username, password });
    if (raw.session_token) await storeToken(raw.session_token);
    const u = toUser(raw);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    const raw = await client.post('/auth/register', { username, password, display_name: displayName });
    if (raw.session_token) await storeToken(raw.session_token);
    const u = toUser(raw);
    setUser(u);
    return u;
  }, []);

  const enterSolo = useCallback(async () => {
    await AsyncStorage.setItem(SOLO_KEY, '1').catch(() => {});
    setIsSolo(true);
  }, []);

  const logout = useCallback(async () => {
    await client.post('/auth/logout').catch(() => {});
    await clearSession();
    await AsyncStorage.removeItem(SOLO_KEY).catch(() => {});
    setUser(null);
    setIsSolo(false);
  }, []);

  const pair = useCallback(async (code) => {
    setLoading(true);
    try {
      const raw = await client.post('/pairing/join', { code });
      await AsyncStorage.removeItem(SOLO_KEY).catch(() => {});
      setIsSolo(false);
      setUser(toUser(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const createPairingCode = useCallback(async () => {
    const data = await client.post('/pairing/create');
    return data.code;
  }, []);


  const updateProfile = useCallback(async (displayName) => {
    const raw = await client.patch('/auth/profile', { display_name: displayName });
    setUser(toUser(raw));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isSolo, loading, login, register, logout, pair, createPairingCode, enterSolo, setUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
