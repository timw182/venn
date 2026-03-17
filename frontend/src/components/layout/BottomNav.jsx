import { NavLink, useLocation } from 'react-router-dom';
import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { ROUTES } from '../../lib/constants';
import haptic from '../../lib/haptics';
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

// Tab 0 & 2 = juicy orange-amber, Tab 1 & 3 = deep slime-lavender
const TAB_COLORS = ['#FF6B35', '#7C5CBF', '#FF6B35', '#7C5CBF'];
const BLOB_R = 26;
const DURATION = 500;

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Elastic spring that overshoots slightly on arrival
function springOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = (2 * Math.PI) / 2.8;
  return Math.pow(2, -9 * t) * Math.sin((t * 9 - 0.6) * c) + 1;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function lerpColor(c1, c2, t) {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return `rgb(${~~lerp(r1, r2, t)},${~~lerp(g1, g2, t)},${~~lerp(b1, b2, t)})`;
}

// ── SlimeBlob ────────────────────────────────────────────────────────────────
function SlimeBlob({ innerRef, activeIndex }) {
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const anim = useRef({ from: activeIndex, to: activeIndex, t: 1, startAt: 0 });

  // Compute the center-x of a tab by measuring from the inner div
  const getX = useCallback((idx) => {
    const inner = innerRef.current;
    if (!inner) return 0;
    const rect = inner.getBoundingClientRect();
    const tabW = rect.width / tabs.length;
    return tabW * idx + tabW / 2;
  }, [innerRef]);

  // Compute the center-y of the icon by measuring the actual icon element
  const getY = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return 36;
    const icon = inner.querySelector('.bottom-nav-icon');
    if (!icon) return 36;
    const innerRect = inner.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    return iconRect.top - innerRect.top + iconRect.height / 2;
  }, [innerRef]);

  const paint = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { from, to, t } = anim.current;

    const et = easeInOut(Math.min(t, 1));
    const color = t >= 1
      ? TAB_COLORS[to]
      : lerpColor(TAB_COLORS[from], TAB_COLORS[to], et);

    const xA = getX(from);
    const xB = getX(to);
    const BLOB_Y = getY();

    const eFrom = svg.getElementById('sbl-from');
    const eTo   = svg.getElementById('sbl-to');
    const eBr   = svg.getElementById('sbl-bridge');
    if (!eFrom || !eTo || !eBr) return;

    if (t >= 1 || from === to) {
      // Steady state: single circle at active tab
      eFrom.setAttribute('cx', xB); eFrom.setAttribute('cy', BLOB_Y);
      eFrom.setAttribute('r', BLOB_R); eFrom.setAttribute('fill', TAB_COLORS[to]);
      eTo.setAttribute('r', 0);
      eBr.setAttribute('rx', 0); eBr.setAttribute('ry', 0);
      return;
    }

    // ── source circle: lingers then dissolves into the bridge ───────────────
    const r1 = BLOB_R * Math.max(0, 1 - et / 0.65);

    // ── dest circle: springs in with elastic overshoot ──────────────────────
    const dp = Math.max(0, Math.min(1, (et - 0.22) / 0.78));
    const r2 = BLOB_R * springOut(dp);

    // ── bridge: fat drooping ellipse that sags at mid-travel ────────────────
    const bPhase = Math.sin(et * Math.PI);
    const bRy = BLOB_R * 0.58 * bPhase;                    // fatter bridge
    const bRx = Math.abs(xB - xA) / 2 + BLOB_R * 0.22;
    const bX  = (xA + xB) / 2;
    const bY  = BLOB_Y + BLOB_R * 0.18 * bPhase;           // sag downward

    const setCirc = (el, cx, r) => {
      el.setAttribute('cx', cx);   el.setAttribute('cy', BLOB_Y);
      el.setAttribute('r', Math.max(0, r)); el.setAttribute('fill', color);
    };
    const setEll = (el, cx, cy, rx, ry) => {
      el.setAttribute('cx', cx);   el.setAttribute('cy', cy);
      el.setAttribute('rx', Math.max(0, rx));
      el.setAttribute('ry', Math.max(0, ry));
      el.setAttribute('fill', color);
    };

    setCirc(eFrom, xA, r1);
    setCirc(eTo,   xB, r2);
    setEll(eBr, bX, bY, bRx, bRy);
  }, [getX, getY]);

  // rAF loop — only draws when animating, idles otherwise
  useEffect(() => {
    function frame(ts) {
      const a = anim.current;
      if (a.t < 1) {
        a.t = Math.min(1, (ts - a.startAt) / DURATION);
        paint();
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paint]);

  // Trigger new animation when active tab changes
  useEffect(() => {
    const a = anim.current;
    if (a.to !== activeIndex) {
      a.from = a.to;
      a.to   = activeIndex;
      a.t    = 0;
      a.startAt = performance.now();
    }
  }, [activeIndex]);

  // First paint (after layout so positions are available)
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => paint());
    return () => cancelAnimationFrame(id);
  }, [paint]);

  return (
    <svg ref={svgRef} className="bottom-nav-slime" aria-hidden="true">
      <defs>
        {/*
          Gooey filter: gaussian blur + alpha threshold = organic metaball merge.
          filterUnits="userSpaceOnUse" lets us use absolute px values that cover
          the full nav width without clipping.
        */}
        <filter id="bnav-goo" filterUnits="userSpaceOnUse" x="-60" y="-12" width="700" height="80">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feColorMatrix
            in="blur" mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
        </filter>
      </defs>
      <g filter="url(#bnav-goo)">
        <circle id="sbl-from" cx="0"  cy="0" r="0" />
        <circle id="sbl-to"   cx="0"  cy="0" r="0" />
        <ellipse id="sbl-bridge" cx="0" cy="0" rx="0" ry="0" />
      </g>
    </svg>
  );
}

// ── BottomNav ────────────────────────────────────────────────────────────────
export default function BottomNav({ matchCount = 0 }) {
  const location  = useLocation();
  const innerRef  = useRef(null);
  const activeIdx = Math.max(0, tabs.findIndex(t => location.pathname.startsWith(t.to)));

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner" ref={innerRef}>
        <SlimeBlob innerRef={innerRef} activeIndex={activeIdx} />
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`bottom-nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => haptic.light()}
            >
              <span className="bottom-nav-icon">
                {tab.icon}
                {tab.badge && matchCount > 0 && (
                  <span className="bottom-nav-badge">{matchCount > 9 ? '9+' : matchCount}</span>
                )}
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
