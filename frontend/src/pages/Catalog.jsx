import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import CategoryPicker from "../components/catalog/CategoryPicker";
import CardStack from "../components/catalog/CardStack";
import { CATEGORIES } from "../lib/constants";
import client from "../api/client";
import "./Catalog.css";

const LS_KEY = "kl_responses";

function loadLocalResponses() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalResponses(resps) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(resps));
  } catch {}
}

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState("foreplay");
  const [catalog, setCatalog] = useState([]);
  const [responses, setResponses] = useState(loadLocalResponses);
  const [matchItem, setMatchItem] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const shownMatchIds = useRef(new Set());
  const matchTimerRef = useRef(null); // { item, response }

  useEffect(() => {
    Promise.all([client.get("/catalog"), client.get("/catalog/responses")])
      .then(([items, resps]) => {
        setCatalog(items);
        // Merge: server wins, but keep any locally cached votes not yet on server
        setResponses((local) => {
          const merged = { ...local, ...resps };
          saveLocalResponses(merged);
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  const categoryItems = useMemo(() => {
    return catalog.filter((item) => item.category === activeCategory && !responses[String(item.id)]);
  }, [catalog, activeCategory, responses]);

  const yesCount = useMemo(() =>
    catalog.filter((i) => i.category === activeCategory && responses[String(i.id)] === "yes").length,
    [catalog, activeCategory, responses]
  );

  const noCount = useMemo(() =>
    catalog.filter((i) => i.category === activeCategory && responses[String(i.id)] === "no").length,
    [catalog, activeCategory, responses]
  );

  const progress = useMemo(() => {
    const prog = {};
    for (const cat of CATEGORIES) {
      const total = catalog.filter((i) => i.category === cat.key).length;
      const done = catalog.filter((i) => i.category === cat.key && responses[String(i.id)]).length;
      prog[cat.key] = { total, done };
    }
    return prog;
  }, [catalog, responses]);

  const handleUndo = useCallback(() => {
    if (!lastResponse) return;
    const { item, response } = lastResponse;
    setLastResponse(null);
    setResponses((prev) => {
      const next = { ...prev };
      delete next[String(item.id)];
      saveLocalResponses(next);
      return next;
    });
    // Remove the response on the server by sending 'undo' — backend ignores unknown,
    // simplest is just deleting it; we re-use the respond endpoint with a no-op trick:
    // actually just fire-and-forget delete via a fresh no-response isn't possible without
    // a dedicated endpoint, so we skip the API call — the item reappears locally and the
    // next real swipe will overwrite it on the server.
  }, [lastResponse]);

  const handleRespond = useCallback(
    (itemId, response) => {
      const item = catalog.find((i) => i.id === itemId);
      if (item) setLastResponse({ item, response });
      setResponses((prev) => {
        const next = { ...prev, [String(itemId)]: response };
        saveLocalResponses(next);
        return next;
      });
      client.post("/catalog/respond", { item_id: itemId, response }).catch(() => {});

      if (response === "yes") {
        client
          .get("/matches")
          .then((matches) => {
            const isNewMatch = matches.some(
              (m) => String(m.id) === String(itemId) && !shownMatchIds.current.has(itemId)
            );
            if (isNewMatch) {
              shownMatchIds.current.add(itemId);
              const item = catalog.find((i) => i.id === itemId);
              if (item) {
                clearTimeout(matchTimerRef.current);
                setTimeout(() => {
                  setMatchItem(item);
                  matchTimerRef.current = setTimeout(() => setMatchItem(null), 3000);
                }, 400);
              }
            }
          })
          .catch(() => {});
      }
    },
    [catalog],
  );

  return (
    <motion.div className="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="catalog-inner">
        <div className="catalog-header">
          <h2 className="catalog-title serif">Browse...</h2>
          <p className="catalog-subtitle text-muted">Over 200 Kinks in 6 Categories. (Every stack is randomized)</p>
        </div>
        <CategoryPicker active={activeCategory} onChange={setActiveCategory} progress={progress} />
        <div className="catalog-desktop-layout">
          <div className="catalog-pile catalog-pile-no">
            <div className="catalog-pile-stack">
              {Array.from({ length: Math.min(noCount, 4) }).map((_, i) => (
                <div key={i} className="catalog-pile-card" style={{ transform: `rotate(${(i - 1.5) * 4}deg) translateY(${i * -2}px)` }} />
              ))}
            </div>
            <span className="catalog-pile-label">✕ {noCount}</span>
          </div>

          <CardStack
            items={categoryItems}
            onRespond={handleRespond}
            matchItem={matchItem}
            onMatchDismiss={() => { clearTimeout(matchTimerRef.current); setMatchItem(null); }}
            onUndo={lastResponse ? handleUndo : null}
          />

          <div className="catalog-pile catalog-pile-yes">
            <div className="catalog-pile-stack">
              {Array.from({ length: Math.min(yesCount, 4) }).map((_, i) => (
                <div key={i} className="catalog-pile-card" style={{ transform: `rotate(${(i - 1.5) * -4}deg) translateY(${i * -2}px)` }} />
              ))}
            </div>
            <span className="catalog-pile-label">✓ {yesCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
