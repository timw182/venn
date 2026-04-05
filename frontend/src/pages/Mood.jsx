import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MOODS } from "../lib/constants";
import { useAuth } from "../context/useAuth";
import { useMatches } from "../context/MatchContext";
import client from "../api/client";
import haptic from "../lib/haptics";
import "./Mood.css";

export default function Mood() {
  const { user } = useAuth();
  const { partnerMood: wsMood, setPartnerMood, partnerMessage } = useMatches();

  const [myMood, setMyMood]               = useState(null);
  const [partnerMood, setPartnerMoodLocal] = useState(null);
  const [picking, setPicking]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]               = useState(null);
  const [toast, setToast]                 = useState(null);
  const toastRef                          = useRef(null);
  const partnerName    = user?.partnerName || "Partner";

  useEffect(() => {
    client.get("/mood")
      .then((data) => {
        setMyMood(data.mine || null);
        setPartnerMoodLocal(data.partner || null);
      })
      .catch(() => {});
  }, []);

  // Real-time custom message push
  useEffect(() => {
    if (!partnerMessage) return;
    clearTimeout(toastRef.current);
    setToast(`💬 ${partnerName}: "${partnerMessage}"`);
    toastRef.current = setTimeout(() => setToast(null), 5000);
  }, [partnerMessage]);

  // Real-time WS push from partner
  useEffect(() => {
    if (!wsMood) return;
    haptic.heavy();
    const moodKey = typeof wsMood === "object" ? wsMood.mood : wsMood;
    const senderName = (typeof wsMood === "object" ? wsMood.name : null) || user?.partnerName || "Partner";
    const moodObj = MOODS.find((m) => m.key === moodKey);
    setPartnerMoodLocal(moodKey);
    clearTimeout(toastRef.current);
    setToast(moodObj ? `${moodObj.emoji} ${senderName} is feeling ${moodObj.label}` : null);
    toastRef.current = setTimeout(() => { setToast(null); setPartnerMood(null); }, 4000);
  }, [wsMood]);

  async function handleSet() {
    if (!picking || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.put("/mood", { mood: picking, expires_hours: 24 });
      setMyMood(data.mine || null);
      setPartnerMoodLocal(data.partner || null);
      const moodObj = MOODS.find((m) => m.key === picking);
      clearTimeout(toastRef.current);
      setToast(moodObj ? `${moodObj.emoji} Mood set to ${moodObj.label}` : "Mood updated");
      toastRef.current = setTimeout(() => setToast(null), 3000);
      setPicking(null);
    } catch (e) {
      const msg = e?.message || "";
      if (msg.includes("Wait") || msg.includes("wait") || msg.includes("429")) {
        setError(msg);
      } else {
        setError("Couldn't update mood. Try again.");
      }
    }
    setLoading(false);
  }

  async function handleClear() {
    await client.delete("/mood").catch(() => {});
    setMyMood(null);
    setPicking(null);
  }

  const myMoodObj      = MOODS.find((m) => m.key === myMood);
  const partnerMoodObj = MOODS.find((m) => m.key === partnerMood);

  return (
    <motion.div className="mood-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {createPortal(
        <AnimatePresence>
          {toast && (
            <motion.div className="mood-toast"
              initial={{ opacity: 0, y: -8, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -8, x: "-50%" }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="mood-header">
        <h2 className="mood-title serif">Mood</h2>
        <p className="mood-subtitle text-muted">Let your partner know how you're feeling right now.</p>
      </div>

      <div className="mood-sections">

        {/* ── Your mood ─────────────────────────────────── */}
        <section className="mood-section">
          <p className="mood-section-title">Your mood</p>

          {myMood && !picking ? (
            <button className="mood-current-card" onClick={() => setPicking(myMood)}>
              <span className="mood-current-card-emoji">{myMoodObj?.emoji}</span>
              <span className="mood-current-card-label">{myMoodObj?.label}</span>
              <span className="mood-tap-hint">Tap to change</span>
            </button>
          ) : (
            <>
              <div className="mood-grid">
                {MOODS.map((m) => (
                  <motion.button
                    key={m.key}
                    className={`mood-tile${picking === m.key ? " active" : ""}`}
                    onClick={() => { haptic.light(); setPicking(m.key); }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <span className="mood-tile-emoji">{m.emoji}</span>
                    <span className="mood-tile-label">{m.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {picking && (
                  <motion.div className="mood-confirm-col"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                    <button className="mood-set-btn" onClick={() => { haptic.medium(); handleSet(); }} disabled={loading}>
                      {loading ? "Sending…" : "Send to partner"}
                    </button>
                    {myMood && (
                      <button className="mood-cancel-btn" onClick={() => setPicking(null)}>Cancel</button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="mood-error text-muted">{error}</p>}
            </>
          )}

        </section>

        {/* ── Partner's mood ────────────────────────────── */}
        <section className="mood-section">
          <p className="mood-section-title">{partnerName}'s mood</p>
          {partnerMoodObj ? (
            <div className="mood-current-badge">
              <span className="mood-current-emoji">{partnerMoodObj.emoji}</span>
              <span className="mood-current-label">{partnerMoodObj.label}</span>
            </div>
          ) : (
            <p className="mood-partner-empty text-muted">Nothing set yet</p>
          )}
        </section>

      </div>
    </motion.div>
  );
}
