import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Button from "../components/shared/Button";
import { ROUTES } from "../lib/constants";
import "./Landing.css";

const features = [
  {
    icon: "🔒",
    title: "No rejection",
    body: "Neither of you ever sees what the other said no to. Only matches surface.",
  },
  {
    icon: "✨",
    title: "Blind matching",
    body: "Both swipe independently. A match only appears when you both say yes.",
  },
  {
    icon: "🫂",
    title: "Just you two",
    body: "Fully private, self-hosted. No ads, no strangers, no data harvesting.",
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
    <div className="landing">
      {/* Atmospheric orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      <AnimatePresence mode="wait">
        {mode === null ? (
          /* ── HERO ── */
          <motion.div
            key="hero"
            className="landing-hero"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="landing-brand">
              <img src="/kinklink_logo.svg" alt="kinklink" className="landing-logo" />
              <p className="landing-tagline">
                discover what you <em>both</em> want
              </p>
            </div>

            <div className="landing-features">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="landing-feature"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="landing-feature-icon">{f.icon}</span>
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
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Button variant="primary" size="lg" fullWidth onClick={() => openForm("register")}>
                Get started
              </Button>
              <button className="landing-toggle" onClick={() => openForm("login")}>
                Already have an account? Sign in
              </button>
            </motion.div>

            <p className="landing-footer text-light">Private &middot; Self-hosted &middot; Just you two</p>
          </motion.div>
        ) : (
          /* ── AUTH FORM ── */
          <motion.div
            key="form"
            className="landing-form-wrap"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <button className="landing-back" onClick={() => setMode(null)}>
              ← back
            </button>

            <div className="landing-brand landing-brand-sm">
              <img src="/kinklink_logo.svg" alt="kinklink" className="landing-logo landing-logo-sm" />
              <p className="landing-subtitle">{mode === "login" ? "Welcome back" : "Create your account"}</p>
            </div>

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
                    placeholder="Pick something just for you"
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

            <button className="landing-toggle" onClick={() => openForm(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
