import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "../lib/constants";
import client from "../api/client";
import { useMatches } from "../context/MatchContext";
import haptic from "../lib/haptics";
import "./Matches.css";

function FilterCarousel({ options, active, onChange }) {
  const idx = options.findIndex((o) => o.key === active);

  function go(dir) {
    const next = (idx + dir + options.length) % options.length;
    haptic.light();
    onChange(options[next].key);
  }

  const current = options[idx] || options[0];

  return (
    <div className="matches-carousel" data-category={active === 'all' ? '' : active}>
      <button className="carousel-arrow carousel-arrow-left" onClick={() => go(-1)} aria-label="Previous filter">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div className="carousel-slide-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="carousel-slide"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
          >
            {current.emoji && <span className="carousel-emoji">{current.emoji}</span>}
            <span className="carousel-label">{current.label}</span>
            <span className="carousel-count">{current.count}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="carousel-arrow carousel-arrow-right" onClick={() => go(1)} aria-label="Next filter">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <div className="carousel-dots">
        {options.map((opt, i) => (
          <span
            key={opt.key}
            className={`carousel-dot${i === idx ? " active" : ""}`}
            onClick={() => { haptic.light(); onChange(opt.key); }}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, index, onSeen, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  function handleExpand() {
    setExpanded(true);
    if (!match.seen) onSeen(match.id);
  }

  return (
    <>
      <motion.button
        className={`match-card ${!match.seen ? "match-new" : ""}`}
        data-category={match.category}
        onClick={handleExpand}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileTap={{ scale: 0.97 }}
        layout
      >
        {!match.seen && <span className="match-new-dot" />}
        <span className="match-card-emoji">{match.emoji}</span>
        <h4 className="match-card-title">{match.title}</h4>
        <span className="match-card-category">{CATEGORIES.find((c) => c.key === match.category)?.label}</span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="match-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              className="match-detail"
              data-category={match.category}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="match-detail-emoji">{match.emoji}</span>
              <h3 className="match-detail-title serif">{match.title}</h3>
              <p className="match-detail-desc">{match.description}</p>
              <div className="match-detail-meta">
                <span className="match-detail-category">
                  {CATEGORIES.find((c) => c.key === match.category)?.emoji}{" "}
                  {CATEGORIES.find((c) => c.key === match.category)?.label}
                </span>
                <span className="match-detail-date">
                  Matched {new Date(match.matched_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="match-detail-actions">
                <button className="match-detail-close" onClick={() => setExpanded(false)}>
                  Close
                </button>
                <button
                  className="match-detail-remove"
                  onClick={() => {
                    setExpanded(false);
                    onRemove(match.id);
                  }}
                >
                  Remove match
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Matches() {
  useEffect(() => {
    document.body.classList.add("matches-active");
    return () => document.body.classList.remove("matches-active");
  }, []);
  const { matches: allMatches, setMatches, refetch } = useMatches();
  const [filter, setFilter] = useState("all");

  // Build carousel options: All + categories that have matches
  const filterOptions = [
    { key: "all", label: "All", emoji: null, count: allMatches.length },
    ...CATEGORIES
      .map((cat) => ({ ...cat, count: allMatches.filter((m) => m.category === cat.key).length }))
      .filter((cat) => cat.count > 0),
  ];

  // If current filter has no matches anymore, reset to all
  useEffect(() => {
    if (filter !== "all" && !filterOptions.find((o) => o.key === filter)) {
      setFilter("all");
    }
  }, [allMatches]);

  function handleSeen(itemId) {
    client.post(`/matches/${itemId}/seen`).catch(() => {});
    setMatches((prev) => prev.map((m) => (m.id === itemId ? { ...m, seen: true } : m)));
  }

  function handleRemove(itemId) {
    setMatches((prev) => prev.filter((m) => m.id !== itemId));
    client.delete(`/matches/${itemId}`).catch(() => refetch());
  }

  const matches = filter === "all" ? allMatches : allMatches.filter((m) => m.category === filter);

  return (
    <motion.div
      className="matches-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="matches-header">
        <h2 className="matches-title serif">Your Matches</h2>
        <p className="matches-subtitle text-muted">
          {allMatches.length} thing{allMatches.length !== 1 ? "s" : ""} you both want
        </p>
      </div>

      <FilterCarousel options={filterOptions} active={filter} onChange={setFilter} />

      {matches.length > 0 ? (
        <div className="matches-grid">
          {matches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} onSeen={handleSeen} onRemove={handleRemove} />
          ))}
        </div>
      ) : (
        <div className="matches-empty">
          <span className="matches-empty-icon">🤞</span>
          <p className="matches-empty-text serif">No matches yet</p>
          <p className="matches-empty-sub text-muted">Keep browsing — when you both say yes, it'll show up here</p>
        </div>
      )}
    </motion.div>
  );
}
