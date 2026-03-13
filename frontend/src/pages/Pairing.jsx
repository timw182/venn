import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import client from "../api/client";
import "./Pairing.css";
import FloatingHearts from "../components/shared/FloatingHearts";

export default function Pairing() {
  const { code: urlCode } = useParams();
  const [mode, setMode] = useState(urlCode ? "join" : "create");

  // Already paired — go to browse
  useEffect(() => {
    if (user?.coupleId) navigate(ROUTES.BROWSE);
  }, [user?.coupleId]);

  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState(urlCode || "");
  const [copied, setCopied] = useState(false);
  const { user, pair, createPairingCode, enterSolo, setUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "create" && !inviteCode) {
      createPairingCode()
        .then(setInviteCode)
        .catch(() => {});
    }
  }, [mode, inviteCode, createPairingCode]);


  // Poll for pairing when in create mode
  const pollRef = useRef(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (mode !== "create" || !inviteCode) return;

    pollRef.current = setInterval(async () => {
      if (navigatedRef.current) return;
      try {
        const raw = await client.get("/auth/me");
        if (raw.couple_id) {
          navigatedRef.current = true;
          clearInterval(pollRef.current);
          setUser({
            id: raw.id,
            username: raw.username,
            displayName: raw.display_name,
            avatarColor: raw.avatar_color,
            coupleId: raw.couple_id,
            partnerName: raw.partner_name ?? null,
          });
          navigate(ROUTES.CONNECTED);
        }
      } catch {}
    }, 5000);

    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [mode, inviteCode]);

  const [joinError, setJoinError] = useState("");

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError("");
    try {
      await pair(joinCode);
      navigate(ROUTES.CONNECTED);
    } catch (err) {
      setJoinError(err.message || "Invalid code");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pairing">
      <FloatingHearts />
      <motion.div
        className="pairing-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pairing-header">
          <span className="pairing-emoji">🔗</span>
          <h2 className="pairing-title serif">Find your person</h2>
          <p className="pairing-subtitle text-muted">
            {mode === "create"
              ? "Share this code with your partner to connect"
              : "Enter the code your partner shared with you"}
          </p>
        </div>

        {mode === "create" ? (
          <div className="pairing-create">
            <div className="pairing-code-display">
              {inviteCode.split("").map((char, i) => (
                <motion.span
                  key={i}
                  className="pairing-code-char"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.2 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            <Button variant="primary" size="md" fullWidth onClick={handleCopy}>
              {copied ? "Copied!" : "Copy code"}
            </Button>

            <div className="pairing-waiting">
              <span className="pairing-pulse" />
              <span className="text-muted">Waiting for your person...</span>
            </div>
          </div>
        ) : (
          <form className="pairing-join" onSubmit={handleJoin}>
            <input
              className="pairing-join-input"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              autoFocus
            />
            {joinError && <p className="pairing-error">{joinError}</p>}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={joinCode.length < 6}
            >
              Connect
            </Button>
          </form>
        )}

        <button className="pairing-mode-toggle" onClick={() => setMode(mode === "create" ? "join" : "create")}>
          {mode === "create" ? "I have a code from my partner" : "I need to create an invite"}
        </button>

        <button className="pairing-solo-skip" onClick={() => { enterSolo(); navigate(ROUTES.BROWSE); }}>
          Skip for now — explore solo
        </button>
      </motion.div>
    </div>
  );
}
