import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../api/client";
import { useAuth } from "./useAuth";

const MatchContext = createContext(null);

const WS_URL = "wss://api.venn.lu/api/ws";
const RECONNECT_BASE = 2000;
const RECONNECT_MAX  = 30000;

export function MatchProvider({ children }) {
  const { user } = useAuth();
  const [matches, setMatches]           = useState([]);
  const [latestNewMatch, setLatestNewMatch] = useState(null);
  const [resetState, setResetState]     = useState("none");
  const [partnerMood, setPartnerMood]   = useState(null);
  const [swipeAlert, setSwipeAlert]     = useState(null);
  const timerRef   = useRef(null);
  const wsRef      = useRef(null);
  const retryRef   = useRef(0);
  const retryTimer = useRef(null);
  const knownIds   = useRef(new Set());
  const userRef    = useRef(user);

  // Keep userRef in sync so stable callbacks see latest user
  useEffect(() => { userRef.current = user; });

  // Debounced fetchMatches — collapses rapid calls into one
  const fetchTimer = useRef(null);
  const fetchMatches = useCallback(async () => {
    if (!userRef.current?.coupleId) return [];
    if (fetchTimer.current) return [];
    fetchTimer.current = setTimeout(() => { fetchTimer.current = null; }, 500);
    try {
      const data = await client.get("/matches");
      setMatches(data);
      return data;
    } catch { return []; }
  }, []);

  const fetchMood = useCallback(async () => {
    try {
      const data = await client.get('/mood');
      setPartnerMood(data.partner || null);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.coupleId) return;
    fetchMatches().then((data) => {
      (data || []).forEach((m) => knownIds.current.add(m.id));
    });
    client.get("/reset/status").then((s) => {
      if (s.status === "pending") {
        setResetState(s.requested_by_me ? "pending_mine" : "pending_partner");
      }
    }).catch(() => {});
    // Fetch any pending swipe-pattern alert
    client.get("/catalog/swipe-alerts").then((alert) => {
      if (alert && alert.id) setSwipeAlert(alert);
    }).catch(() => {});
  }, [user]);

  // showMatch — no auto-dismiss timer; screen owns display lifecycle
  const showMatch = useCallback((item) => {
    setLatestNewMatch(item);
  }, []);

  const connect = useCallback(async () => {
    if (!userRef.current?.coupleId) return;
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    let url;
    try {
      const data = await client.get('/ws/ticket');
      if (typeof data.ticket === 'string' && data.ticket.length > 0) {
        url = `${WS_URL}?ticket=${data.ticket}`;
      }
    } catch {}
    if (!url) {
      // Ticket fetch failed; schedule retry via reconnect logic
      const delay = Math.min(RECONNECT_BASE * 2 ** retryRef.current, RECONNECT_MAX);
      retryRef.current++;
      retryTimer.current = setTimeout(connect, delay);
      return;
    }
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      const isReconnect = retryRef.current > 0;
      retryRef.current = 0;
      // Catch up on missed matches/mood (reconnects only)
      if (isReconnect) {
        Promise.all([
          fetchMatches().then((data) => {
            if (data) data.forEach((m) => knownIds.current.add(m.id));
          }),
          fetchMood(),
        ]);
      }
      // Keepalive ping every 25s
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        else clearInterval(ping);
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "match" && msg.item) {
          fetchMatches().then((data) => {
            if (data) data.forEach((m) => knownIds.current.add(m.id));
          });
          // Triggerer sees the effect via HTTP response; no WS animation needed
        } else if (msg.type === "mood_update" || msg.type === "mood_cleared") {
          if (msg.from_user_id !== userRef.current?.id) {
            setPartnerMood(msg.mood || null);
          }
        } else if (msg.type === "swipe_pattern_alert") {
          if (msg.about_user_id !== userRef.current?.id) {
            setSwipeAlert(msg);
          }
        } else if (msg.type === "reset_requested") {
          setResetState("pending_partner");
        } else if (msg.type === "reset_cancelled" || msg.type === "reset_declined") {
          setResetState("none");
        } else if (msg.type === "reset_done") {
          setResetState("none");
          AsyncStorage.multiRemove(["kl_responses"]).catch(() => {});
        }
      } catch {}
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      if (!userRef.current?.coupleId) return;
      const delay = Math.min(RECONNECT_BASE * 2 ** retryRef.current, RECONNECT_MAX);
      retryRef.current++;
      retryTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  const paired = !!user?.coupleId;
  useEffect(() => {
    if (!paired) return;
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [paired]);

  const dismissLatest = useCallback(() => {
    clearTimeout(timerRef.current);
    setLatestNewMatch(null);
  }, []);

  const refetch = useCallback(() => {
    fetchMatches().then((data) => {
      if (data) data.forEach((m) => knownIds.current.add(m.id));
    });
  }, [fetchMatches]);

  const newMatchCount = matches.filter((m) => !m.seen).length;

  return (
    <MatchContext.Provider value={{ matches, setMatches, latestNewMatch, newMatchCount, dismissLatest, refetch, resetState, setResetState, partnerMood, setPartnerMood, swipeAlert, setSwipeAlert }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  return useContext(MatchContext);
}
