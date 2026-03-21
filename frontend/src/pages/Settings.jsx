import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useMatches } from "../context/MatchContext";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import client from "../api/client";
import haptic from "../lib/haptics";
import "./Settings.css";

const tiles = [
  { id: "profile", label: "Profile", icon: "/user-duotone.svg" },
  { id: "data",    label: "Data",    icon: "/arrows-clockwise-duotone.svg" },
  { id: "support", label: "Support", icon: "/chat-circle-duotone.svg" },
  { id: "about",   label: "About",   icon: "/info-duotone.svg" },
];

/* ── Bottom sheet wrapper ────────────────────────────────────────────── */
function Sheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="sheet-header">
              <h3 className="sheet-title">{title}</h3>
              <button className="sheet-close" onClick={onClose} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="sheet-body">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function Settings() {
  const { user, isSolo, logout, updateProfile } = useAuth();
  const { resetState, setResetState } = useMatches();
  const navigate = useNavigate();

  const [activeSheet, setActiveSheet] = useState(null);

  // Profile
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState(null);

  // Data
  const [resetConfirm, setResetConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(false);

  // Support
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketSending, setTicketSending] = useState(false);

  function openSheet(id) { setActiveSheet(id); }
  function closeSheet() {
    setActiveSheet(null);
    setDisconnectConfirm(false);
    setResetConfirm(false);
  }

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

  async function handleDisconnect() {
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      await client.post("/auth/disconnect");
      window.location.reload();
    } catch (e) {
      setDisconnectError(e?.message || "Couldn't disconnect. Try again.");
      setDisconnecting(false);
    }
  }

  async function handleRequestReset() {
    await client.post("/reset/request");
    setResetState("pending_mine");
    setResetConfirm(false);
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

  async function handleTicketSubmit() {
    if (!ticketMsg.trim()) return;
    setTicketSending(true);
    setTicketError("");
    try {
      await client.post("/tickets", { message: ticketMsg.trim() });
      setTicketSent(true);
      setTicketMsg("");
      setTimeout(() => setTicketSent(false), 4000);
    } catch (err) {
      setTicketError(err.message || "Could not send. Try again.");
    } finally {
      setTicketSending(false);
    }
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
        <div className="settings-header-actions">
          {user?.isAdmin && (
            <button className="settings-admin-btn" onClick={() => navigate(ROUTES.ADMIN)}>
              Admin
            </button>
          )}
          <button className="settings-signout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {/* ── 2×2 tile grid ── */}
      <div className="settings-grid">
        {tiles.map((tile, i) => (
          <motion.button
            key={tile.id}
            className="settings-tile"
            onClick={() => { haptic.light(); openSheet(tile.id); }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileTap={{ scale: 0.96 }}
          >
            <img src={tile.icon} alt={tile.label} className="settings-tile-icon" />
            <span className="settings-tile-label">{tile.label}</span>
          </motion.button>
        ))}
      </div>

      <p className="settings-version">v0.1 · Venn</p>

      {/* ── Profile sheet ── */}
      <Sheet open={activeSheet === "profile"} onClose={closeSheet} title="Profile">
        <div className="sheet-field">
          <label className="sheet-label">Display Name</label>
          <div className="sheet-input-row">
            <input
              className="sheet-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={handleSave}>
              {saved ? "Saved!" : "Save"}
            </Button>
          </div>
          {saveError && <p className="sheet-error">{saveError}</p>}
        </div>

        {user?.coupleId && (
          <div className="sheet-field">
            <label className="sheet-label">Connected to</label>
            <div className="sheet-input-row">
              <div className="sheet-input sheet-input-readonly">{user.partnerName}</div>
              {disconnectConfirm ? (
                <div className="sheet-inline-actions">
                  <Button variant="danger" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
                    {disconnecting ? "…" : "Yes"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDisconnectConfirm(false)}>No</Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setDisconnectConfirm(true)}>Disconnect</Button>
              )}
            </div>
            {disconnectError && <p className="sheet-error">{disconnectError}</p>}
          </div>
        )}

        {!user?.coupleId && (
          <div className="sheet-field">
            <p className="sheet-muted">You're exploring solo. Connect with a partner to see your matches.</p>
            <Button variant="primary" size="sm" onClick={() => { closeSheet(); navigate(ROUTES.PAIR); }}>
              Create or enter a code
            </Button>
          </div>
        )}
      </Sheet>

      {/* ── Data sheet ── */}
      <Sheet open={activeSheet === "data"} onClose={closeSheet} title="Data">
        {user?.coupleId && (
          <>
            <div className="sheet-field">
              <label className="sheet-label">Reset swipes & matches</label>
              <p className="sheet-muted">Clears all swipes and matches for both of you. Both partners must confirm.</p>

              {resetState === "none" && !resetConfirm && (
                <Button variant="secondary" size="sm" onClick={() => setResetConfirm(true)}>
                  Request reset
                </Button>
              )}

              {resetState === "none" && resetConfirm && (
                <div>
                  <p className="sheet-warning">Are you sure? Your partner will also need to confirm.</p>
                  <div className="sheet-actions">
                    <Button variant="danger" size="sm" onClick={handleRequestReset}>Yes, send request</Button>
                    <Button variant="ghost" size="sm" onClick={() => setResetConfirm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {resetState === "pending_mine" && (
                <div>
                  <p className="sheet-muted">Waiting for your partner to confirm…</p>
                  <Button variant="ghost" size="sm" onClick={handleCancelReset}>Cancel request</Button>
                </div>
              )}

              {resetState === "pending_partner" && (
                <div>
                  <p className="sheet-warning">Your partner wants to reset all swipes and matches.</p>
                  <div className="sheet-actions">
                    <Button variant="danger" size="sm" onClick={handleConfirmReset}>Confirm reset</Button>
                    <Button variant="ghost" size="sm" onClick={handleDeclineReset}>Decline</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="sheet-field">
              <label className="sheet-label">Delete account</label>
              {deleteMsg ? (
                <p className="sheet-muted">Account deletion coming soon.</p>
              ) : (
                <Button variant="secondary" size="sm" className="sheet-btn-danger" onClick={() => setDeleteMsg(true)}>
                  Delete account
                </Button>
              )}
            </div>
          </>
        )}

        {!user?.coupleId && (
          <div className="sheet-field">
            <label className="sheet-label">Delete account</label>
            {deleteMsg ? (
              <p className="sheet-muted">Account deletion coming soon.</p>
            ) : (
              <Button variant="secondary" size="sm" className="sheet-btn-danger" onClick={() => setDeleteMsg(true)}>
                Delete account
              </Button>
            )}
          </div>
        )}
      </Sheet>

      {/* ── Support sheet ── */}
      <Sheet open={activeSheet === "support"} onClose={closeSheet} title="Support">
        <div className="sheet-field">
          <label className="sheet-label">Send us a message</label>
          <textarea
            className="sheet-input sheet-textarea"
            placeholder="Describe your issue or feedback…"
            value={ticketMsg}
            onChange={(e) => setTicketMsg(e.target.value)}
            rows={4}
          />
          {ticketError && <p className="sheet-error">{ticketError}</p>}
          {ticketSent && <p className="sheet-success">Message sent! We'll look into it.</p>}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTicketSubmit}
            disabled={ticketSending || !ticketMsg.trim()}
          >
            {ticketSending ? "Sending…" : "Send"}
          </Button>
        </div>
      </Sheet>

      {/* ── About sheet ── */}
      <Sheet open={activeSheet === "about"} onClose={closeSheet} title="About Venn">
        <div className="sheet-field sheet-about">
          <p className="sheet-muted">
            Discover what you both want — without the awkwardness. Your responses are never shared unless you both say yes.
          </p>
          <div className="sheet-about-links">
            <a href="/privacy" className="btn btn-secondary btn-sm" onClick={closeSheet}>Privacy Policy</a>
            <a href="/impressum" className="btn btn-secondary btn-sm" onClick={closeSheet}>Impressum</a>
            <a href="/experts" className="btn btn-secondary btn-sm" onClick={closeSheet}>What Experts say</a>
          </div>
        </div>
      </Sheet>
    </motion.div>
  );
}
