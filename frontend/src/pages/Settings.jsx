import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useMatches } from "../context/MatchContext";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import client from "../api/client";
import "./Settings.css";

export default function Settings() {
  const { user, isSolo, logout, updateProfile } = useAuth();
  const { resetState, setResetState } = useMatches();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState(null);

  async function handleSave() {
    setSaveError("");
    try {
      await updateProfile(displayName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || "Could not save");
    }
  }

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN);
  }

  async function handleRequestReset() {
    await client.post("/reset/request");
    setResetState("pending_mine");
    setResetConfirm(false);
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect from your partner? You can reconnect with a new pairing code.")) return;
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      await client.post("/auth/disconnect");
      window.location.reload();
    } catch (e) {
      setDisconnectError(e?.message || "Couldn't disconnect. Try again.");
    }
    setDisconnecting(false);
  }

  async function handleConfirmReset() {
    await client.post("/reset/confirm");
  }

  async function handleDeclineReset() {
    await client.post("/reset/decline");
    setResetState("none");
  }

  async function handleCancelReset() {
    await client.post("/reset/cancel");
    setResetState("none");
  }

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="settings-header">
        <h2 className="settings-title serif">Settings</h2>
        <button className="settings-signout-btn" onClick={handleLogout}>Sign out</button>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h3 className="settings-section-title">Your Profile</h3>
          <div className="settings-field">
            <label className="settings-label">Display Name</label>
            <div className="settings-input-row">
              <input
                className="settings-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={handleSave}>
                {saved ? "Saved!" : "Save"}
              </Button>
            </div>
            {saveError && <p className="settings-error">{saveError}</p>}
          </div>
          {user?.coupleId && (
            <div className="settings-field" style={{ marginTop: "var(--space-3)" }}>
              <label className="settings-label">Connected to</label>
              <div className="settings-input-row">
                <div className="settings-input settings-input-readonly" style={{ flex: 1 }}>{user.partnerName}</div>
                <Button variant="secondary" size="sm" onClick={handleDisconnect} disabled={disconnecting}>{disconnecting ? "…" : "Disconnect"}</Button>
              </div>
              {disconnectError && <p className="settings-error">{disconnectError}</p>}
            </div>
          )}
          {!user?.coupleId && (
            <div className="settings-pair-prompt" style={{ marginTop: "var(--space-3)" }}>
              <p className="settings-pair-text text-muted">You're exploring solo. Connect with a partner to see your matches.</p>
              <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.PAIR)}>
                Create or enter a code
              </Button>
            </div>
          )}

          {user?.coupleId && (
            <div className="settings-field" style={{ marginTop: "var(--space-4)" }}>
              <label className="settings-label">Reset</label>

              {resetState === "none" && !resetConfirm && (
                <div className="settings-reset-trigger">
                  <Button variant="secondary" size="sm" onClick={() => setResetConfirm(true)}>
                    Request reset
                  </Button>
                  <span className="settings-info-icon" role="img" aria-label="About reset">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5"/>
                      <line x1="12" y1="12" x2="12" y2="16"/>
                    </svg>
                    <span className="settings-info-tooltip">
                      Clears all swipes and matches for both of you. Both partners must confirm before anything is deleted.
                    </span>
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => alert("Account deletion coming soon.")} style={{ marginLeft: "auto", color: "var(--color-no)" }}>
                    Delete account
                  </Button>
                </div>
              )}

              {resetState === "none" && resetConfirm && (
                <div>
                  <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)", color: "var(--color-no)" }}>
                    Are you sure? Your partner will also need to confirm before anything is deleted.
                  </p>
                  <div className="settings-reset-actions">
                    <Button variant="danger" size="sm" onClick={handleRequestReset}>Yes, send request</Button>
                    <Button variant="ghost" size="sm" onClick={() => setResetConfirm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {resetState === "pending_mine" && (
                <div>
                  <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)", color: "var(--color-text-muted)" }}>
                    ⏳ Waiting for your partner to confirm…
                  </p>
                  <Button variant="ghost" size="sm" onClick={handleCancelReset}>Cancel request</Button>
                </div>
              )}

              {resetState === "pending_partner" && (
                <div>
                  <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)", color: "var(--color-no)" }}>
                    ⚠️ Your partner wants to reset all swipes and matches.
                  </p>
                  <div className="settings-reset-actions">
                    <Button variant="danger" size="sm" onClick={handleConfirmReset}>Confirm reset</Button>
                    <Button variant="ghost" size="sm" onClick={handleDeclineReset}>Decline</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>



        <section className="settings-section">
          <h3 className="settings-section-title">About Kinklink</h3>
          <div className="settings-about">
            <p className="settings-about-desc text-muted">
              Discover what you both want — without the awkwardness. Your responses are never shared unless you both say yes.
            </p>
            <p className="settings-about-desc text-muted" style={{ marginTop: "var(--space-3)" }}>
              Learn more about our motivations and expert opinions here:
            </p>
            <div className="settings-about-links">
              <a href="/privacy" className="btn btn-secondary btn-sm">Privacy Policy</a>
              <a href="/experts" className="btn btn-secondary btn-sm">What Experts say</a>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
