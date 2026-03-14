import { Outlet } from "react-router-dom";
import FloatingHearts from "../shared/FloatingHearts";
import BottomNav from "./BottomNav";
import { useMatches } from "../../context/MatchContext";
import "./Shell.css";

export default function Shell() {
  const { newMatchCount } = useMatches();

  return (
    <div className="shell">
      <FloatingHearts />
      <header className="shell-header">
        <img src="/logo800.svg" alt="kinklink" className="shell-logo" />
      </header>
      <main className="shell-content">
        <Outlet />
      </main>
      <BottomNav matchCount={newMatchCount} />
    </div>
  );
}
