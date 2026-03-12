import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import './Shell.css';

export default function Shell() {
  return (
    <div className="shell">
      <header className="shell-header">
        <h1 className="shell-wordmark serif">kinklink</h1>
      </header>
      <main className="shell-content">
        <Outlet />
      </main>
      <BottomNav matchCount={2} />
    </div>
  );
}
