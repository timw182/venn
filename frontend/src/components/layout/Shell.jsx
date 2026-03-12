import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
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
      <header className="shell-header">
        <h1 className="shell-wordmark serif">kinklink</h1>
      </header>
      <main className="shell-content">
        <Outlet />
      </main>
      <BottomNav matchCount={newMatchCount} />
    </div>
  );
}
