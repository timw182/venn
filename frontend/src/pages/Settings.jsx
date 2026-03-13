import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import "./Settings.css";

export default function Settings() {
  const { user, isSolo, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function handleSave() {
    setSaveError('');
    try {
      await updateProfile(displayName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || 'Could not save');
    }
  }

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN);
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
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Your Partner</h3>
          {user?.coupleId ? (
            <div className="settings-info-row">
              <span className="settings-info-label text-muted">Connected to</span>
              <span className="settings-info-value">{user.partnerName}</span>
            </div>
          ) : (
            <div className="settings-pair-prompt">
              <p className="settings-pair-text text-muted">You're exploring solo. Connect with a partner to see your matches.</p>
              <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.PAIR)}>
                Create or enter a code
              </Button>
            </div>
          )}
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">About</h3>
          <div className="settings-about">
            <p className="settings-about-name serif">kinklink</p>
            <p className="settings-about-desc text-muted">
              Discover what you both want — without the awkwardness. Your responses are never shared unless you both say
              yes.
            </p>
          </div>
        </section>

        <section className="settings-section settings-section-danger">
          <Button variant="ghost" fullWidth onClick={handleLogout}>
            Sign out
          </Button>
        </section>
      </div>
    </motion.div>
  );
}
