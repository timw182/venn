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
  const [resetState, setResetState]       = useState("none"); // none | pending_mine | pending_partner
  const [partnerMood, setPartnerMood]       = useState(null);
  const timerRef    = useRef(null);
  const wsRef       = useRef(null);
  const retryRef    = useRef(0);
  const retryTimer  = useRef(null);
  const knownIds    = useRef(new Set());
  const userRef     = useRef(user);

  // Keep userRef in sync so stable callbacks always see the latest user
  useEffect(() => { userRef.current = user; });

  // fetchMatches is stable (no user dep) — reads userRef at call time
  const fetchMatches = useCallback(async () => {
    if (!userRef.current?.coupleId) return;
    try {
      const data = await client.get("/matches");
      setMatches(data);
      return data;
    } catch { return []; }
  }, []);

  // Initial fetch + reset status — re-runs when user changes (e.g. after pairing)
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
  }, [user]);

  // showMatch is stable
  const showMatch = useCallback((item) => {
    setLatestNewMatch(item);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLatestNewMatch(null), 4000);
  }, []);

  // connect is stable — uses refs so it never needs to be recreated
  const connect = useCallback(() => {
    if (!userRef.current?.coupleId) return;
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

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
          try { localStorage.removeItem("kl_responses"); } catch {}
          window.location.reload();
        }
      } catch {}
    };

    ws.onclose = () => {
      // If wsRef was replaced/cleared (intentional cleanup), don't reconnect
      if (wsRef.current !== ws) return;
      if (!userRef.current?.coupleId) return;
      // Exponential backoff reconnect
      const delay = Math.min(RECONNECT_BASE * 2 ** retryRef.current, RECONNECT_MAX);
      retryRef.current++;
      retryTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []); // stable — no deps, reads everything via refs

  // Only fires when paired status changes (unpaired→paired or paired→unpaired/logout)
  const paired = !!user?.coupleId;
  useEffect(() => {
    if (!paired) return;
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      // Disown before closing so stale onclose handlers skip reconnect
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [paired]);

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
    <MatchContext.Provider value={{ matches, setMatches, latestNewMatch, newMatchCount, dismissLatest, refetch, resetState, setResetState, partnerMood, setPartnerMood }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  return useContext(MatchContext);
}
