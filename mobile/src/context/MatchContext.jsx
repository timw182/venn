import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../api/client";
import { useAuth } from "./useAuth";

const MatchContext = createContext(null);

const WS_URL = "wss://kinklink.amoreapp.net/api/ws";
const RECONNECT_BASE = 2000;
const RECONNECT_MAX  = 30000;

export function MatchProvider({ children }) {
  const { user } = useAuth();
  const [matches, setMatches]           = useState([]);
  const [latestNewMatch, setLatestNewMatch] = useState(null);
  const [resetState, setResetState]     = useState("none");
  const [partnerMood, setPartnerMood]   = useState(null);
  const timerRef   = useRef(null);
  const wsRef      = useRef(null);
  const retryRef   = useRef(0);
  const retryTimer = useRef(null);
  const knownIds   = useRef(new Set());

  const fetchMatches = useCallback(async () => {
    if (!user) return [];
    try {
      const data = await client.get("/matches");
      setMatches(data);
      return data;
    } catch { return []; }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMatches().then((data) => {
      (data || []).forEach((m) => knownIds.current.add(m.id));
    });
    client.get("/reset/status").then((s) => {
      if (s.status === "pending") {
        setResetState(s.requested_by_me ? "pending_mine" : "pending_partner");
      }
    }).catch(() => {});
  }, [user]);

  const showMatch = useCallback((item) => {
    setLatestNewMatch(item);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLatestNewMatch(null), 4000);
  }, []);

  const connect = useCallback(() => {
    if (!user) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
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
          showMatch(msg.item);
        } else if (msg.type === "mood_update") {
          setPartnerMood(msg.mood || null);
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
      if (!user) return;
      const delay = Math.min(RECONNECT_BASE * 2 ** retryRef.current, RECONNECT_MAX);
      retryRef.current++;
      retryTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [user, fetchMatches, showMatch]);

  useEffect(() => {
    if (!user) return;
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      wsRef.current?.close();
    };
  }, [user, connect]);

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
    <MatchContext.Provider value={{ matches, setMatches, latestNewMatch, newMatchCount, dismissLatest, refetch, resetState, setResetState, partnerMood, setPartnerMood }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  return useContext(MatchContext);
}
