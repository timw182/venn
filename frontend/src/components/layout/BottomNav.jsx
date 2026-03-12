import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../../lib/constants';
import './BottomNav.css';

const tabs = [
  {
    to: ROUTES.BROWSE,
    label: 'Browse',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: ROUTES.MATCHES,
    label: 'Matches',
    badge: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
      </svg>
    ),
  },
  {
    to: ROUTES.MOOD,
    label: 'Mood',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    to: ROUTES.SETTINGS,
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

export default function BottomNav({ matchCount = 0 }) {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`bottom-nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="bottom-nav-icon">
                {tab.icon}
                {tab.badge && matchCount > 0 && (
                  <span className="bottom-nav-badge">{matchCount > 9 ? '9+' : matchCount}</span>
                )}
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
              {isActive && (
                <motion.span
                  className="bottom-nav-dot"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
