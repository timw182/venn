import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import "./Landing.css";

const features = [
  {
    icon: "/lock-key-duotone.svg",
    title: "No rejection",
    body: "Neither of you ever sees what the other said no to. Only matches surface.",
  },
  {
    icon: "/moon-stars-duotone.svg",
    title: "Blind matching",
    body: "Both swipe independently. A match only appears when you both say yes.",
  },
  {
    icon: "/users-duotone.svg",
    title: "Just you two",
    body: "Fully private. No ads, no strangers, no data harvesting.",
  },
];

export default function Landing() {
  const [mode, setMode] = useState(null); // null = hero, 'login' = form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading, logoutReason } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  }

  function openForm() {
    setMode("login");
    setError("");
    setUsername("");
    setPassword("");
  }

  return (
    <main className="landing">
      {/* Atmospheric orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {logoutReason === 'another_device' && (
        <motion.div
          className="landing-kicked-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          You were logged out because your account was signed in on another device.
        </motion.div>
      )}

      {/* ── BRAND — always visible, centered on top ── */}
      <div className="landing-brand">
        <img src="/venn_hori.png" alt="Venn" className="landing-logo-svg" />
        <p className="landing-tagline">Find your overlap.</p>
      </div>

      {/* ── CONTENT — animates between hero and form ── */}
      <AnimatePresence mode="wait">
        {mode === null ? (
          <motion.div
            key="hero"
            className="landing-below-brand"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="landing-features">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="landing-feature"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <img src={f.icon} alt={f.title} className="landing-feature-icon" />
                  <div>
                    <p className="landing-feature-title">{f.title}</p>
                    <p className="landing-feature-body">{f.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="landing-cta"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Button variant="primary" size="lg" fullWidth onClick={openForm}>
                Sign in
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="landing-below-brand landing-form-view"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 400) setMode(null);
            }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button className="landing-back" onClick={() => setMode(null)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              back
            </button>

            <h1 className="landing-heading">Log in to Venn</h1>
            <p className="landing-subtitle">Welcome back</p>

            <form className="landing-form" onSubmit={handleSubmit}>
                <div className="landing-field">
                  <label className="landing-label">Email</label>
                  <input
                    className="landing-input"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your@email.com..."
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="landing-field">
                  <label className="landing-label">Password</label>
                  <input
                    className="landing-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Keep it secret..."
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <motion.p className="landing-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {error}
                  </motion.p>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                  Sign in
                </Button>
            </form>

            <p className="landing-terms">
              By signing in, you agree to our{" "}
              <a href="/terms">Terms</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="landing-footer">
        <div className="landing-footer-links">
          <span>© 2026 Kern Studio</span>
          <span className="landing-footer-dot">·</span>
          <a href="/impressum" className="landing-footer-link">Impressum</a>
        </div>
        <div className="landing-footer-social">
          <a
            href="https://www.instagram.com/kernstudio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-footer-icon"
            aria-label="Instagram"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/kernstudio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-footer-icon"
            aria-label="Facebook"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="#" className="landing-footer-icon" aria-label="App Store">
            <svg width="20" height="20" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.4-105.6-207.8-105.6-328.6 0-193.1 125.3-295.6 248.7-295.6 65.5 0 120.1 43.1 161.2 43.1 39.2 0 100.2-45.7 174.5-45.7 28.2 0 129.6 2.6 196.8 99.7zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.9 32.4-54.4 83.7-54.4 135.5 0 7.8.6 15.7 1.3 18.2 2.6.6 6.4 1.3 10.8 1.3 45.3 0 102.5-30.4 138.2-71.4z" />
            </svg>
          </a>
          <a href="#" className="landing-footer-icon" aria-label="Google Play">
            <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
              <path d="M48 59.49v393a4.33 4.33 0 0 0 7.37 3.07L260 256 55.37 56.42A4.33 4.33 0 0 0 48 59.49zM345.8 174L89.22 32.64l-.16-.09c-4.42-2.4-8.62 3.58-5 7.06L285.19 231.93zm0 164L285.19 280.07 84.07 472.39c-3.64 3.48.56 9.46 5 7.06l.16-.09zM400.32 243.16L348.59 214l-56.51 42L348.59 298l51.73-29.16a16.42 16.42 0 0 0 0-25.68z" />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
