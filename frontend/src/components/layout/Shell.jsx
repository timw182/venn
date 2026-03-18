import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { useMatches } from "../../context/MatchContext";
import client from "../../api/client";
import { ROUTES } from "../../lib/constants";
import useSwipeNav from "../../hooks/useSwipeNav";
import "./Shell.css";

const SHELL_TABS = [ROUTES.BROWSE, ROUTES.MATCHES, ROUTES.MOOD, ROUTES.SETTINGS];

export default function Shell() {
  const { newMatchCount, resetState, setResetState } = useMatches();
  const navigate  = useNavigate();
  const location  = useLocation();
  const timerRef  = useRef(null);
  const contentRef = useRef(null);

  const activeTab = SHELL_TABS.findIndex(r => location.pathname.startsWith(r));
  const isBrowse  = location.pathname.startsWith(ROUTES.BROWSE);

  useSwipeNav(
    contentRef,
    () => { if (activeTab < SHELL_TABS.length - 1) navigate(SHELL_TABS[activeTab + 1]); },
    () => { if (activeTab > 0) navigate(SHELL_TABS[activeTab - 1]); },
    isBrowse ? { excludeSelector: '.card-stack-draggable' } : {},
  );

  // Auto-logout after 5 minutes of inactivity
  useEffect(() => {
    const TIMEOUT = 5 * 60 * 1000;

    function reset() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await client.post("/auth/logout").catch(() => {});
        navigate(ROUTES.LOGIN);
      }, TIMEOUT);
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset(); // start timer

    return () => {
      clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  async function handleConfirmReset() {
    await client.post("/reset/confirm");
  }

  async function handleDeclineReset() {
    await client.post("/reset/decline");
    setResetState("none");
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <img src="/venn_hori.png" alt="Venn" className="shell-logo" />
      </header>

      {resetState === "pending_partner" && (
        <div className="reset-banner">
          <span className="reset-banner-text">⚠️ Your partner wants to reset all swipes &amp; matches</span>
          <div className="reset-banner-actions">
            <button className="reset-banner-btn reset-banner-confirm" onClick={handleConfirmReset}>Confirm</button>
            <button className="reset-banner-btn reset-banner-decline" onClick={handleDeclineReset}>Decline</button>
          </div>
        </div>
      )}

      {resetState === "pending_mine" && (
        <div className="reset-banner reset-banner-waiting">
          <span className="reset-banner-text">⏳ Reset requested — waiting for partner to confirm</span>
          <button className="reset-banner-btn reset-banner-decline" onClick={async () => {
            await client.post("/reset/cancel");
            setResetState("none");
          }}>Cancel</button>
        </div>
      )}

      <main className="shell-content" ref={contentRef}>
        <Outlet />
      </main>
      <BottomNav matchCount={newMatchCount} />
    </div>
  );
}
