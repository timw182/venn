import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import FloatingHearts from "../shared/FloatingHearts";
import BottomNav from "./BottomNav";
import client from "../../api/client";
import "./Shell.css";

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
        <span className="shell-wordmark">kinklink</span>
      </header>
      <main className="shell-content">
        <Outlet />
      </main>
      <BottomNav matchCount={newMatchCount} />
    </div>
  );
}
