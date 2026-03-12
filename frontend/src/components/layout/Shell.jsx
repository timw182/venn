import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import client from "../../api/client";
import "./Shell.css";

const HEART_COUNT = 12;
const HEART_COLORS = ["#ff6a2f", "#ff3c6e", "#e8002a"];

function FloatingHearts() {
  const hearts = useRef(
    Array.from({ length: HEART_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 40 + Math.random() * 60,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 120,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    })),
  ).current;

  return (
    <div className="hearts-bg" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="heart-float"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            "--drift": `${h.drift}px`,
            color: h.color,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

export default function Shell() {
  const [newMatchCount, setNewMatchCount] = useState(0);

  useEffect(() => {
    client
      .get("/matches")
      .then((matches) => setNewMatchCount(matches.filter((m) => !m.seen).length))
      .catch(() => {});
  }, []);

  return (
    <div className="shell">
      <FloatingHearts />
      <header className="shell-header">
        <img src="/kinklink_logo.svg" alt="kinklink" className="shell-logo" />
      </header>
      <main className="shell-content">
        <Outlet />
      </main>
      <BottomNav matchCount={newMatchCount} />
    </div>
  );
}
