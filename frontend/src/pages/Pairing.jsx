import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { ROUTES } from "../lib/constants";
import client from "../api/client";
import "./Pairing.css";
import FloatingHearts from "../components/shared/FloatingHearts";

export default function Pairing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Already paired — go to browse
  useEffect(() => {
    if (user?.coupleId) navigate(ROUTES.BROWSE);
  }, [user?.coupleId]);

  return (
    <div className="pairing">
      <FloatingHearts />
      <button className="pairing-back" onClick={async () => { await client.post('/auth/logout').catch(() => {}); window.location.href = ROUTES.LOGIN; }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Log out
      </button>
      <motion.div
        className="pairing-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pairing-header">
          <span className="pairing-emoji">📱</span>
          <h2 className="pairing-title serif">Pair in the app first</h2>
          <p className="pairing-subtitle text-muted">
            To use Venn on desktop, connect with your partner in the mobile app.
            Once paired, log in here to access your matches, mood, and more.
          </p>
        </div>

        <div className="pairing-download">
          <a href="https://apps.apple.com/app/venn-couples/id6744244553" target="_blank" rel="noopener noreferrer" className="pairing-store-link">
            <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.4-105.6-207.8-105.6-328.6 0-193.1 125.3-295.6 248.7-295.6 65.5 0 120.1 43.1 161.2 43.1 39.2 0 100.2-45.7 174.5-45.7 28.2 0 129.6 2.6 196.8 99.7zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.9 32.4-54.4 83.7-54.4 135.5 0 7.8.6 15.7 1.3 18.2 2.6.6 6.4 1.3 10.8 1.3 45.3 0 102.5-30.4 138.2-71.4z"/>
            </svg>
            App Store
          </a>
          <a href="#" className="pairing-store-link pairing-store-soon">
            Google Play — coming soon
          </a>
        </div>
      </motion.div>
    </div>
  );
}
