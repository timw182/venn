import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "../lib/constants";
import client from "../api/client";
import { useMatches } from "../context/MatchContext";
import "./Matches.css";

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
  const { matches: allMatches, refetch } = useMatches();
  const [filter, setFilter] = useState("all");


  function handleSeen(itemId) {
    client.post(`/matches/${itemId}/seen`).catch(() => {});
    setAllMatches((prev) => prev.map((m) => (m.id === itemId ? { ...m, seen: true } : m)));
  }

  function handleRemove(itemId) {
    setAllMatches((prev) => prev.filter((m) => m.id !== itemId));
    client.delete(`/matches/${itemId}`).catch(() => {});
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

      {/* Dropdown — shown below 375px */}
      <div className="matches-filter-dropdown-wrap">
        <select
          className="matches-filter-dropdown"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All ({allMatches.length})</option>
          {CATEGORIES.map((cat) => {
            const count = allMatches.filter((m) => m.category === cat.key).length;
            if (count === 0) return null;
            return (
              <option key={cat.key} value={cat.key}>
                {cat.emoji} {cat.label} ({count})
              </option>
            );
          })}
        </select>
        <span className="matches-filter-dropdown-arrow">▾</span>
      </div>

      {/* Chips — shown above 375px */}
      <div className="matches-filters hide-scrollbar">
        <button className={`matches-filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        {CATEGORIES.map((cat) => {
          const count = allMatches.filter((m) => m.category === cat.key).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.key}
              className={`matches-filter ${filter === cat.key ? "active" : ""}`}
              onClick={() => setFilter(cat.key)}
            >
              {cat.emoji} {cat.label}
            </button>
          );
        })}
      </div>

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
