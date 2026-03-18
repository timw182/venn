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
  const [customMsg, setCustomMsg]           = useState('');
  const [customError, setCustomError]       = useState('');
  const toastRef                          = useRef(null);

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

  const BLOCKED = new Set([
    "minor","minors","child","children","underage","teen","teenager",
    "rape","snuff","necro","murder","torture","gore","loli","shota",
  ]);

  function filterText(text) {
    const words = text.toLowerCase().split(/\s+/);
    return words.some((w) => BLOCKED.has(w)) ? "That content isn't allowed" : null;
  }

  async function handleCustomSend() {
    const msg = customMsg.trim();
    if (!msg) return;
    if (msg.length > 30) { setCustomError("Max 30 characters"); return; }
    const err = filterText(msg);
    if (err) { setCustomError(err); return; }
    setCustomError('');
    setLoading(true);
    try {
      await client.put("/mood/message", { message: msg });
      setCustomMsg('');
    } catch (e) {
      setCustomError(e?.message || "Couldn't send");
    }
    setLoading(false);
  }

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
                    onClick={() => { haptic.light(); setPicking(m.key); }}
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

              {/* Custom word input */}
              <form className="mood-custom-row" onSubmit={(e) => { e.preventDefault(); handleCustomSend(); }}>
                <input
                  className="mood-custom-input"
                  type="text"
                  maxLength={30}
                  placeholder="Or type your own…"
                  value={customMsg}
                  onChange={(e) => { setCustomMsg(e.target.value); setCustomError(''); }}
                />
                <button
                  type="submit"
                  className="mood-custom-btn"
                  disabled={loading || !customMsg.trim()}
                >
                  Send
                </button>
              </form>
              {customError && <p className="mood-error text-muted">{customError}</p>}
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
