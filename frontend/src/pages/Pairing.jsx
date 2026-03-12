import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import "./Pairing.css";

export default function Pairing() {
  const { code: urlCode } = useParams();
  const [mode, setMode] = useState(urlCode ? "join" : "create");
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState(urlCode || "");
  const [copied, setCopied] = useState(false);
  const { pair, createPairingCode, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "create" && !inviteCode) {
      createPairingCode()
        .then(setInviteCode)
        .catch(() => {});
    }
  }, [mode, inviteCode, createPairingCode]);

  async function handleJoin(e) {
    e.preventDefault();
    await pair(joinCode);
    navigate(ROUTES.CONNECTED);
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pairing">
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
      </motion.div>
    </div>
  );
}
