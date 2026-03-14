import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "./useAuth";

const MatchContext = createContext(null);

const WS_URL = `wss://${window.location.host}/api/ws`;
const RECONNECT_BASE = 2000;
const RECONNECT_MAX  = 30000;

export function MatchProvider({ children }) {
  const { user } = useAuth();
  const [matches, setMatches]           = useState([]);
  const [latestNewMatch, setLatestNewMatch] = useState(null);
  const timerRef    = useRef(null);
  const wsRef       = useRef(null);
  const retryRef    = useRef(0);
  const retryTimer  = useRef(null);
  const knownIds    = useRef(new Set());

  // Initial fetch — populates matches list and seeds known IDs (no false positives)
  const fetchMatches = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  // Show match popup
  const showMatch = useCallback((item) => {
    setLatestNewMatch(item);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLatestNewMatch(null), 4000);
  }, []);

  // WebSocket connection
  const connect = useCallback(() => {
    if (!user) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
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
          // Refresh matches list
          fetchMatches().then((data) => {
            if (data) data.forEach((m) => knownIds.current.add(m.id));
          });
          // Show popup
          showMatch(msg.item);
        }
      } catch {}
    };

    ws.onclose = () => {
      if (!user) return;
      // Exponential backoff reconnect
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

  // Expose refetch so Catalog can refresh immediately after own swipe
  const refetch = useCallback(() => {
    fetchMatches().then((data) => {
      if (data) data.forEach((m) => knownIds.current.add(m.id));
    });
  }, [fetchMatches]);

  const newMatchCount = matches.filter((m) => !m.seen).length;

  return (
    <MatchContext.Provider value={{ matches, latestNewMatch, newMatchCount, dismissLatest, refetch }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  return useContext(MatchContext);
}
