import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import CategoryPicker from "../components/catalog/CategoryPicker";
import CardStack from "../components/catalog/CardStack";
import { CATEGORIES } from "../lib/constants";
import client from "../api/client";
import "./Catalog.css";

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState("foreplay");
  const [catalog, setCatalog] = useState([]);
  const [responses, setResponses] = useState({});
  const [matchItem, setMatchItem] = useState(null);
  const [lastResponse, setLastResponse] = useState(null); // { item, response }

  useEffect(() => {
    Promise.all([client.get("/catalog"), client.get("/catalog/responses")])
      .then(([items, resps]) => {
        setCatalog(items);
        setResponses(resps);
      })
      .catch(() => {});
  }, []);

  const categoryItems = useMemo(() => {
    return catalog.filter((item) => item.category === activeCategory && !responses[String(item.id)]);
  }, [catalog, activeCategory, responses]);

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
      setResponses((prev) => ({ ...prev, [String(itemId)]: response }));
      client.post("/catalog/respond", { item_id: itemId, response }).catch(() => {});

      if (response === "yes") {
        client
          .get("/matches")
          .then((matches) => {
            const fresh = matches.find((m) => String(m.id) === String(itemId) && !m.seen);
            if (fresh) {
              const item = catalog.find((i) => i.id === itemId);
              if (item) {
                setTimeout(() => {
                  setMatchItem(item);
                  setTimeout(() => setMatchItem(null), 2500);
                }, 300);
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
        <CategoryPicker active={activeCategory} onChange={setActiveCategory} progress={progress} />
        <CardStack
          items={categoryItems}
          onRespond={handleRespond}
          matchItem={matchItem}
          onUndo={lastResponse ? handleUndo : null}
        />
      </div>
    </motion.div>
  );
}
