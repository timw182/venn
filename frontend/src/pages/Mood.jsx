import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOODS } from "../lib/constants";
import client from "../api/client";
import "./Mood.css";

export default function Mood() {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [matched, setMatched] = useState(null);
  const pollRef = useRef(null);

  // Restore existing mood on mount
  useEffect(() => {
    client
      .get("/mood")
      .then((data) => {
        if (data.mine) {
          setSelected(data.mine.mood);
          setSubmitted(true);
          if (data.partner) {
            setMatched(MOODS.find((m) => m.key === data.mine.mood) ?? null);
          } else {
            startPolling();
          }
        }
      })
      .catch(() => {});
    return () => stopPolling();
  }, []);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      client
        .get("/mood")
        .then((data) => {
          if (data.partner) {
            stopPolling();
            setMatched(MOODS.find((m) => m.key === data.mine?.mood) ?? null);
          }
        })
        .catch(() => {});
    }, 10000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handlePick(mood) {
    setSelected(mood.key);
    try {
      const data = await client.put("/mood", { mood: mood.key, expires_hours: 8 });
      setSubmitted(true);
      if (data.partner) {
        setMatched(MOODS.find((m) => m.key === mood.key) ?? null);
      } else {
        startPolling();
      }
    } catch {}
  }

  async function handleReset() {
    stopPolling();
    await client.delete("/mood").catch(() => {});
    setSelected(null);
    setSubmitted(false);
    setMatched(null);
  }

  return (
    <motion.div className="mood-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mood-header">
        <h2 className="mood-title serif">How are you feeling?</h2>
        <p className="mood-subtitle text-muted">
          {submitted
            ? "Your mood is set. You'll see if you match."
            : "What are you in the mood for? You'll only see theirs if it matches."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {matched ? (
          <motion.div
            key="matched"
            className="mood-matched"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <span className="mood-matched-emoji">{matched.emoji}</span>
            <h3 className="mood-matched-title serif">You're both feeling {matched.label.toLowerCase()}</h3>
            <p className="mood-matched-sub text-muted">Sounds like a plan</p>
            <button className="mood-reset" onClick={handleReset}>
              Set a new mood
            </button>
          </motion.div>
        ) : submitted ? (
          <motion.div
            key="submitted"
            className="mood-submitted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mood-submitted-badge">
              <span className="mood-submitted-emoji">{MOODS.find((m) => m.key === selected)?.emoji}</span>
              <span className="mood-submitted-label">{MOODS.find((m) => m.key === selected)?.label}</span>
            </div>
            <div className="mood-waiting">
              <span className="mood-pulse" />
              <span className="text-muted">Waiting for a match...</span>
            </div>
            <button className="mood-reset" onClick={handleReset}>
              Change mood
            </button>
          </motion.div>
        ) : (
          <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mood-grid">
              {MOODS.map((mood, i) => (
                <motion.button
                  key={mood.key}
                  className={`mood-option ${selected === mood.key ? "active" : ""}`}
                  onClick={() => handlePick(mood)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mood-option-emoji">{mood.emoji}</span>
                  <span className="mood-option-label">{mood.label}</span>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selected && (
                <motion.div
                  className="mood-submit-area"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <motion.button className="mood-submit-btn" onClick={handleSubmit} whileTap={{ scale: 0.96 }}>
                    Set my mood
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
