import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOODS } from "../lib/constants";
import { useAuth } from "../context/useAuth";
import { useMatches } from "../context/MatchContext";
import client from "../api/client";
import "./Mood.css";

export default function Mood() {
  const { user } = useAuth();
  const { partnerMood: wsMood, setPartnerMood } = useMatches();

  const [myMood, setMyMood]               = useState(null);
  const [partnerMood, setPartnerMoodLocal] = useState(null);
  const [picking, setPicking]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]               = useState(null);
  const [toast, setToast]                 = useState(null);
  const toastRef                          = useRef(null);

  useEffect(() => {
    client.get("/mood")
      .then((data) => {
        setMyMood(data.mine || null);
        setPartnerMoodLocal(data.partner || null);
      })
      .catch(() => {});
  }, []);

  // Real-time WS push from partner
  useEffect(() => {
    if (!wsMood) return;
    const moodObj = MOODS.find((m) => m.key === wsMood);
    setPartnerMoodLocal(wsMood);
    clearTimeout(toastRef.current);
    setToast(moodObj ? `${moodObj.emoji} ${user?.partnerName || "Partner"} is feeling ${moodObj.label}` : null);
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
      setPicking(null);
    } catch (e) {
      const msg = e?.detail || e?.message || "";
      setError(msg.includes("Wait") ? msg : "Couldn\'t update mood. Try again.");
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
  const partnerName    = user?.partnerName || "Partner";

  return (
    <motion.div className="mood-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      <AnimatePresence>
        {toast && (
          <motion.div className="mood-toast"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mood-header">
        <h2 className="mood-title serif">Mood</h2>
        <p className="mood-subtitle text-muted">Let your partner know how you're feeling right now.</p>
      </div>

      <div className="mood-sections">

        {/* ── Your mood ─────────────────────────────────── */}
        <section className="mood-section">
          <p className="mood-section-title">Your mood</p>

          {myMood && !picking ? (
            <div className="mood-current">
              <div className="mood-current-badge">
                <span className="mood-current-emoji">{myMoodObj?.emoji}</span>
                <span className="mood-current-label">{myMoodObj?.label}</span>
              </div>
              <button className="mood-change-btn" onClick={() => setPicking(myMood)}>Change</button>
            </div>
          ) : (
            <>
              <div className="mood-buttons">
                {MOODS.map((m) => (
                  <motion.button
                    key={m.key}
                    className={`mood-btn${picking === m.key ? " active" : ""}`}
                    onClick={() => setPicking(m.key)}
                    whileTap={{ scale: 0.93 }}
                  >
                    <span className="mood-btn-emoji">{m.emoji}</span>
                    <span className="mood-btn-label">{m.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {picking && (
                  <motion.div className="mood-confirm-row"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                    <button className="mood-set-btn" onClick={handleSet} disabled={loading}>
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
