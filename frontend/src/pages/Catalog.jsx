import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CategoryPicker from "../components/catalog/CategoryPicker";
import CardStack from "../components/catalog/CardStack";
import { CATEGORIES } from "../lib/constants";
import client from "../api/client";
import { useMatches } from "../context/MatchContext";
import { useAuth } from "../context/useAuth";
import "./Catalog.css";

const LS_KEY = "kl_responses";
const MAX_PILE = 5;

function loadLocalResponses() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}

function saveLocalResponses(resps) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(resps)); } catch {}
}

const PILES_KEY = (cat) => `kl_piles_${cat}`;

function loadPiles(category) {
  try {
    const data = JSON.parse(localStorage.getItem(PILES_KEY(category)) || "null");
    return data || { yes: [], no: [] };
  } catch { return { yes: [], no: [] }; }
}

function savePiles(category, yes, no) {
  try {
    localStorage.setItem(PILES_KEY(category), JSON.stringify({ yes, no }));
  } catch {}
}

// ── Card pile ──────────────────────────────────────────────────────────────────
// depth 0 = top card (newest), depth 1 = one below, etc.
const PILE_OFFSETS = [
  { rotate: 1,  x: 0, y: 0 },  // top
  { rotate: -4, x: 1, y: 3 },  // one below
  { rotate: 3,  x:-1, y: 5 },  // two below
  { rotate: -5, x: 1, y: 7 },  // three below
  { rotate: 5,  x:-1, y: 9 },  // four below
];

function CardPile({ items, side, totalCount }) {
  // Always render container to prevent layout shift when first card is swiped
  const capped = items.slice(0, 5);
  return (
    <div className={`catalog-pile catalog-pile-${side}`}>
      <div className="catalog-pile-stack">
        {[...capped].reverse().map((item, revI) => {
          const depth = capped.length - 1 - revI; // 0 = top
          const isTop = depth === 0;
          const off = PILE_OFFSETS[depth] || PILE_OFFSETS[PILE_OFFSETS.length - 1];
          return (
            <div
              key={item.id}
              className={`catalog-pile-card-wrap pile-${side}`}
              style={{
                transform: `rotate(${off.rotate}deg) translate(${off.x}px, ${off.y}px) translateZ(0)`,
                boxShadow: isTop ? "0 2px 10px rgba(0,0,0,0.12)" : "none",
                zIndex: capped.length - depth,
                isolation: "isolate",
              }}
            >
              {isTop && (
                <>
                  <span className="catalog-pile-emoji">{item.emoji}</span>
                  <p className="catalog-pile-title">{item.title}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
      {(totalCount ?? items.length) > 0 && (
        <span className="catalog-pile-count">
          {side === "yes" ? "✓" : "✕"} {totalCount ?? items.length}
        </span>
      )}
    </div>
  );
}

// ── Catalog ────────────────────────────────────────────────────────────────────
export default function Catalog() {
  const { user } = useAuth();
  const isLocked = !user?.coupleId;
  const [activeCategory, setActiveCategory] = useState("foreplay");
  const [catalog, setCatalog] = useState([]);
  const [responses, setResponses] = useState(loadLocalResponses);
  const [matchItem, setMatchItem] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  // Confetti
  const [confetti, setConfetti] = useState([]);
  const burstConfetti = useCallback(() => {
    const pieces = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      color: ["#F07A6A","#9B80D4","#C4547A","#fa8e9e","#f3c6d0","#d4b8f0"][i % 6],
      size: 7 + Math.random() * 8,
      angle: Math.random() * 360,
      delay: Math.random() * 0.25,
      duration: 1.0 + Math.random() * 0.7,
      drift: (Math.random() - 0.5) * 200,
      drop: 220 + Math.random() * 160,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2200);
  }, []);
  const [recentYes, setRecentYes] = useState(() => loadPiles("foreplay").yes);
  const [recentNo, setRecentNo]   = useState(() => loadPiles("foreplay").no);
  const shownMatchIds = useRef(new Set());
  const matchTimerRef = useRef(null);
  const { latestNewMatch, dismissLatest, refetch } = useMatches();

  // React to partner-triggered matches
  useEffect(() => {
    if (!latestNewMatch) return;
    setTimeout(burstConfetti, 650);
    const item = catalog.find((i) => i.id === latestNewMatch.id);
    if (item) {
      clearTimeout(matchTimerRef.current);
      setTimeout(() => {
        setMatchItem(item);
        matchTimerRef.current = setTimeout(() => { setMatchItem(null); dismissLatest(); }, 4000);
      }, 200);
    }
  }, [latestNewMatch, burstConfetti]);

  useEffect(() => {
    Promise.all([client.get("/catalog"), client.get("/catalog/responses")])
      .then(([items, resps]) => {
        setCatalog(items);
        setResponses((local) => {
          const merged = { ...local, ...resps };
          saveLocalResponses(merged);
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  const categoryItems = useMemo(() =>
    catalog.filter((item) => item.category === activeCategory && !responses[String(item.id)]),
    [catalog, activeCategory, responses]
  );

  const progress = useMemo(() => {
    const prog = {};
    for (const cat of CATEGORIES) {
      const total = catalog.filter((i) => i.category === cat.key).length;
      const done  = catalog.filter((i) => i.category === cat.key && responses[String(i.id)]).length;
      prog[cat.key] = { total, done };
    }
    return prog;
  }, [catalog, responses]);

  const handleUndo = useCallback(() => {
    if (!lastResponse) return;
    const { item, response } = lastResponse;
    setLastResponse(null);
    if (response === "yes") setRecentYes((prev) => prev.filter((i) => i.id !== item.id));
    if (response === "no")  setRecentNo((prev)  => prev.filter((i) => i.id !== item.id));
    setResponses((prev) => {
      const next = { ...prev };
      delete next[String(item.id)];
      saveLocalResponses(next);
      return next;
    });
  }, [lastResponse]);

  const handleRespond = useCallback(
    (itemId, response) => {
      const item = catalog.find((i) => i.id === itemId);
      if (item) {
        setLastResponse({ item, response });
        if (response === "yes") setRecentYes((prev) => [item, ...prev].slice(0, MAX_PILE));
        if (response === "no")  setRecentNo((prev)  => [item, ...prev].slice(0, MAX_PILE));
      }
      setResponses((prev) => {
        const next = { ...prev, [String(itemId)]: response };
        saveLocalResponses(next);
        return next;
      });
      client.post("/catalog/respond", { item_id: itemId, response })
        .then(() => { if (response === "yes") refetch(); })
        .catch(() => {});
    },
    [catalog, refetch],
  );

  const showPiles = categoryItems.length > 0;

  return (
    <motion.div className="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {confetti.length > 0 && createPortal(
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999 }}>
          {confetti.map((p) => (
            <motion.div
              key={p.id}
              style={{ position: 'absolute', left: p.x + '%', top: '35%', width: p.size, height: p.size * 0.55, borderRadius: 2, backgroundColor: p.color }}
              initial={{ y: 0, x: 0, opacity: 1, rotate: p.angle, scale: 1 }}
              animate={{ y: p.drop, x: p.drift, opacity: 0, rotate: p.angle + 540, scale: 0.3 }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </div>,
        document.body
      )}
      <div className="catalog-inner">
        <div className="catalog-header">
          <h2 className="catalog-title serif">Browse...</h2>
          <p className="catalog-subtitle text-muted">Over 200 Kinks in 6 Categories. (Every stack is randomized)</p>
        </div>
        <CategoryPicker active={activeCategory} onChange={setActiveCategory} progress={progress} />
        <div className="catalog-desktop-layout">
          {showPiles && <CardPile items={recentNo}  side="no"  totalCount={catalog.filter(i => i.category === activeCategory && responses[String(i.id)] === "no").length} />}

          <CardStack
            locked={isLocked}
            items={categoryItems}
            onRespond={handleRespond}
            matchItem={matchItem}
            onMatchDismiss={() => { clearTimeout(matchTimerRef.current); setMatchItem(null); }}
            onUndo={lastResponse ? handleUndo : null}
          />

          {showPiles && <CardPile items={recentYes} side="yes" totalCount={catalog.filter(i => i.category === activeCategory && responses[String(i.id)] === "yes").length} />}
        </div>
      </div>
    </motion.div>
  );
}
