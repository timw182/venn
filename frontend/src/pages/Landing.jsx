import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [mode, setMode] = useState(null); // null = hero, 'login' | 'register' = form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        const user = await login(username, password);
        navigate(user.coupleId ? ROUTES.BROWSE : ROUTES.PAIR);
      } else {
        await register(username, password, displayName);
        navigate(ROUTES.PAIR);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  }

  function openForm(m) {
    setMode(m);
    setError("");
    setUsername("");
    setPassword("");
    setDisplayName("");
  }

  return (
    <main className="landing">
      {/* Atmospheric orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* ── BRAND — always visible, never moves ── */}
      <div className="landing-brand">
        <img src="/venn_hori.png" alt="Venn" className="landing-logo-svg" />
        <p className="landing-tagline">
          Find your overlap.
        </p>
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
              <Button variant="primary" size="lg" fullWidth onClick={() => openForm("register")}>
                Get started
              </Button>
              <div className="landing-toggle">
                <span className="text-muted">Already have an account?</span>
                <button className="landing-toggle-link" onClick={() => openForm("login")}>Sign in</button>
              </div>
            </motion.div>

            <footer className="landing-footer">
              <span>© 2026 KinkLink</span>
              <span className="landing-footer-dot">·</span>
              <a href="/impressum" className="landing-footer-link">Impressum</a>
              <span className="landing-footer-dot">·</span>
              <a href="https://instagram.com/kinklink" target="_blank" rel="noopener noreferrer" className="landing-footer-link">Instagram</a>
            </footer>
          </motion.div>

        ) : (
          <motion.div
            key="form"
            className="landing-below-brand"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="landing-subtitle">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </p>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                className="landing-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: mode === "login" ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 16 : -16 }}
                transition={{ duration: 0.22 }}
              >
                {mode === "register" && (
                  <div className="landing-field">
                    <label className="landing-label">Your name</label>
                    <input
                      className="landing-input"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="What should they call you?"
                      required
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="landing-field">
                  <label className="landing-label">Username</label>
                  <input
                    className="landing-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === "login" ? "Enter your username" : "Pick something just for you"}
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="landing-field">
                  <label className="landing-label">Password</label>
                  <input
                    className="landing-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Keep it secret"
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>

                {error && (
                  <motion.p className="landing-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {error}
                  </motion.p>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                  {mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </motion.form>
            </AnimatePresence>

            <div className="landing-toggle">
              <span className="text-muted">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button className="landing-toggle-link" onClick={() => openForm(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </div>

            <button className="landing-back" onClick={() => setMode(null)}>
              ← back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
