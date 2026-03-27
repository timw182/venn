import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { ROUTES } from './lib/constants';
import FloatingHearts from './components/shared/FloatingHearts';
import CookieBanner from './components/shared/CookieBanner';
import Shell from './components/layout/Shell';
import Landing from './pages/Landing';
import Pairing from './pages/Pairing';
import Connected from './pages/Connected';
import Catalog from './pages/Catalog';
import Matches from './pages/Matches';
import Mood from './pages/Mood';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Impressum from './pages/Impressum';
import Admin from './pages/Admin';
import Experts from './pages/Experts';

// ── Route guards ──────────────────────────────────────────────────────────────

/** Shows Landing when logged out; redirects based on pairing status when logged in */
function LandingRedirect() {
  const { user, isSolo, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  if (user.coupleId || isSolo) return <Navigate to={ROUTES.BROWSE} replace />;
  return <Navigate to={ROUTES.PAIR} replace />;
}

/** Requires an authenticated session */
function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Outlet />;
}

/** Requires active pairing or solo mode */
function PairGuard() {
  const { user, isSolo, loading } = useAuth();
  if (loading) return null;
  if (!user?.coupleId && !isSolo) return <Navigate to={ROUTES.PAIR} replace />;
  return <Outlet />;
}

/** Requires admin role */
function AdminGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.isAdmin) return <Navigate to={ROUTES.BROWSE} replace />;
  return <Outlet />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <FloatingHearts />
      <CookieBanner />
      <Routes>
        {/* Public */}
        <Route path={ROUTES.LOGIN} element={<LandingRedirect />} />
        <Route path="/impressum"   element={<Impressum />} />
        <Route path="/privacy"     element={<Privacy />} />

        {/* Authenticated */}
        <Route element={<AuthGuard />}>
          <Route path={ROUTES.PAIR}           element={<Pairing />} />
          <Route path={`${ROUTES.JOIN}/:code?`} element={<Pairing />} />
          <Route path={ROUTES.CONNECTED}      element={<Connected />} />

          {/* Admin only */}
          <Route element={<AdminGuard />}>
            <Route path={ROUTES.ADMIN} element={<Admin />} />
          </Route>

          {/* Paired (or solo) */}
          <Route element={<PairGuard />}>
            <Route element={<Shell />}>
              <Route path={ROUTES.BROWSE}   element={<Catalog />} />
              <Route path={ROUTES.MATCHES}  element={<Matches />} />
              <Route path={ROUTES.MOOD}     element={<Mood />} />
              <Route path={ROUTES.SETTINGS} element={<Settings />} />
              <Route path="/privacy"        element={<Privacy />} />
              <Route path="/impressum"     element={<Impressum />} />
              <Route path="/experts"        element={<Experts />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </>
  );
}
