import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import FloatingHearts from "./components/shared/FloatingHearts";
import { useAuth } from "./context/useAuth";
import Shell from "./components/layout/Shell";
import Landing from "./pages/Landing";
import Pairing from "./pages/Pairing";
import Connected from "./pages/Connected";
import Catalog from "./pages/Catalog";
import Matches from "./pages/Matches";
import Mood from "./pages/Mood";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import Experts from "./pages/Experts";
import { ROUTES } from "./lib/constants";

function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Outlet />;
}

function PairGuard() {
  const { user, isSolo, loading } = useAuth();
  if (loading) return null;
  if (!user?.coupleId && !isSolo) return <Navigate to={ROUTES.PAIR} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <>
      <FloatingHearts />
      <Routes>
      {/* Public */}
      <Route path={ROUTES.LOGIN} element={<Landing />} />

      {/* Auth required */}
      <Route element={<AuthGuard />}>
        <Route path={ROUTES.PAIR} element={<Pairing />} />
        <Route path={`${ROUTES.JOIN}/:code?`} element={<Pairing />} />
        <Route path={ROUTES.CONNECTED} element={<Connected />} />

        {/* Admin — no pairing required */}
        <Route path="/admin" element={<Admin />} />

        {/* Paired required */}
        <Route element={<PairGuard />}>
          <Route element={<Shell />}>
            <Route path={ROUTES.BROWSE} element={<Catalog />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/experts" element={<Experts />} />
            <Route path={ROUTES.MATCHES} element={<Matches />} />
            <Route path={ROUTES.MOOD} element={<Mood />} />
            <Route path={ROUTES.SETTINGS} element={<Settings />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
    </>
  );
}
