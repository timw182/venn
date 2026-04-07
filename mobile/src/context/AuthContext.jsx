import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import client, { clearSession, storeTokens, setOnUnauthorized } from '../api/client';

const SOLO_KEY = 'vn_solo';

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
  const [isPendingPair, setIsPendingPair] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutReason, setLogoutReason] = useState(null);

  useEffect(() => {
    Promise.all([
      client.get('/auth/me').then((raw) => {
        const u = toUser(raw);
        setUser(u);
        Purchases.logIn(String(u.id)).catch(() => {});
      }).catch(() => {}),
      AsyncStorage.getItem(SOLO_KEY).then((v) => { if (v) setIsSolo(true); }).catch(() => {}),
    ]).finally(() => setLoading(false));

    // Force logout on any 401 from API calls
    setOnUnauthorized(() => {
      setUser(null);
      setIsSolo(false);
      setLogoutReason('another_device');
    });
  }, []);

  // Revalidate session when app comes to foreground
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        client.get('/auth/me')
          .then((raw) => setUser(toUser(raw)))
          .catch(() => { setUser(null); });
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  const login = useCallback(async (username, password) => {
    setLogoutReason(null);
    const raw = await client.post('/auth/token', { username, password });
    await storeTokens(raw.access_token, raw.refresh_token);
    const u = toUser(raw.user);
    setUser(u);
    Purchases.logIn(String(u.id)).catch(() => {});
    return u;
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    // Register first, then exchange credentials for JWT tokens
    await client.post('/auth/register', { username, password, display_name: displayName });
    const raw = await client.post('/auth/token', { username, password });
    await storeTokens(raw.access_token, raw.refresh_token);
    const u = toUser(raw.user);
    setUser(u);
    Purchases.logIn(String(u.id)).catch(() => {});
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

  const enterPendingPair = useCallback(() => {
    setIsPendingPair(true);
  }, []);


  const updateProfile = useCallback(async (displayName) => {
    const raw = await client.patch('/auth/profile', { display_name: displayName });
    setUser(toUser(raw));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isSolo, isPendingPair, loading, logoutReason, login, register, logout, pair, createPairingCode, enterSolo, enterPendingPair, setUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
