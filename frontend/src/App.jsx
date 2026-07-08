import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const location = useLocation();
  const onDashboard = location.pathname === "/";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Manifest</span>
          <span className="brand-tag">Dispatch Console</span>
        </div>
        {onDashboard ? (
          <Link to="/new-job" className="btn btn-accent">
            + New job
          </Link>
        ) : (
          <Link to="/" className="btn btn-ghost">
            ← Back to dashboard
          </Link>
        )}
      </header>
      <Outlet />
    </div>
  );
}
