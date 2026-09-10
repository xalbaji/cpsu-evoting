import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import { ThemeSettings } from "../../components/ThemeSettings";

interface Election {
  _id: string;
  title: string;
  status: string;
}

/* ─── Icons (shared across admin pages) ─── */
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  elections: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  voters: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  arrowRight: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/admin/elections", label: "Elections", icon: Icons.elections },
  { path: "/admin/voters", label: "Voters", icon: Icons.voters },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: Icons.audit },
  { path: "/admin/results", label: "Results", icon: Icons.results },
];

/* ─── Status badge ─── */
function statusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return { color: "#d97706", bg: "#fef3c7" };
    case "SCHEDULED":
      return { color: "#2563eb", bg: "#dbeafe" };
    case "CLOSED":
      return { color: "#0f766e", bg: "#f0fdfa" };
    case "CANCELLED":
      return { color: "#dc2626", bg: "#fee2e2" };
    default:
      return { color: "#64748b", bg: "#f1f5f9" };
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span className="status-badge" style={{ color: s.color, background: s.bg }}>
      {status}
    </span>
  );
}

export default function AdminResults() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [elections, setElections] = useState<Election[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    api
      .get("/elections")
      .then((response) => setElections(response.data.data))
      .catch(() => setError("Unable to load elections."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .admin-page { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; background: #f8fbfa; min-height: 100vh; padding-top: 64px; color: #153b3a; }

        /* Navbar */
        .admin-navbar { background: #0e4643; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: fixed; inset: 0 0 auto; z-index: 50; box-shadow: 0 1px 3px rgba(21,59,58,0.14); }
        .admin-logo-wrap { display: flex; align-items: center; gap: 12px; }
        .admin-logo-box { width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 5px; box-sizing: border-box; flex-shrink: 0; }
        .admin-logo-box img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .admin-brand { color: white; font-weight: 700; font-size: 1.08rem; letter-spacing: 0.01em; }
        .admin-user { display: flex; align-items: center; gap: 16px; }
        .admin-user-name { color: #c5e9df; font-size: 0.9rem; font-weight: 600; }
        .admin-logout { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .admin-logout:hover { background: rgba(255,255,255,0.2); }
        .menu-btn { display: none; background: none; border: none; color: white; cursor: pointer; padding: 4px; margin-right: 8px; }

        /* Layout */
        .admin-layout { display: flex; }
        .admin-sidebar { width: 250px; min-height: calc(100vh - 64px); background: #ffffff; border-right: 1px solid #e2e8f0; padding: 20px 0; position: fixed; top: 64px; left: 0; z-index: 40; transition: transform 0.3s ease; }
        .sidebar-label { padding: 0 20px 14px; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 18px; margin: 0 10px; border-radius: 10px; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.88rem; transition: all 0.2s; }
        .sidebar-link:hover { background: #f8fafc; color: #0f766e; }
        .sidebar-link.active { background: #f0fdfa; color: #0f766e; font-weight: 600; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; opacity: 0; pointer-events: none; transition: opacity 0.3s; }

        .admin-main { margin-left: 250px; padding: 40px 40px 56px; width: calc(100% - 250px); box-sizing: border-box; min-height: calc(100vh - 64px); }
        .page-header { margin: 0 auto 28px; max-width: 1152px; }
        .page-header h1 { font-family: Georgia, "Times New Roman", serif; font-size: 2rem; font-weight: 800; color: #0e4643; margin: 0 0 6px 0; letter-spacing: -0.025em; }
        .page-header p { color: #617875; font-size: 0.95rem; margin: 0; }

        .error-banner { max-width: 1152px; margin: 0 auto 18px; background: #fff0f0; color: #9f2d2d; border: 1px solid #f3caca; border-radius: 12px; padding: 12px 16px; font-size: 0.85rem; }

        /* Results grid */
        .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; max-width: 1152px; margin: 0 auto; }
        .result-card { background: rgba(255,255,255,.94); border: 1px solid #deece9; border-radius: 18px; padding: 26px; box-shadow: 0 10px 26px rgba(21,59,58,.06); transition: all 0.2s; display: flex; flex-direction: column; min-height: 176px; }
        .result-card:hover { border-color: #a8cec5; box-shadow: 0 14px 30px rgba(21,59,58,.11); transform: translateY(-2px); }
        .result-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
        .result-icon { width: 46px; height: 46px; border-radius: 13px; background: #edf8f5; color: #117f76; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .result-title { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 1.08rem; font-weight: 700; color: #153b3a; margin: 0 0 18px 0; line-height: 1.35; }
        .status-badge { font-size: 0.68rem; font-weight: 700; padding: 5px 11px; border-radius: 20px; letter-spacing: 0.03em; white-space: nowrap; }
        .result-link { margin-top: auto; display: inline-flex; align-items: center; gap: 7px; color: #117f76; font-weight: 700; font-size: 0.88rem; text-decoration: none; padding: 13px 0 0; border-top: 1px solid #deece9; transition: gap 0.15s; }
        .result-link:hover { gap: 10px; color: #0f766e; }

        .empty-state, .loading-state { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 60px 0; }

        @media (max-width: 768px) {
          .menu-btn { display: flex; }
          .admin-brand { display: none; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .admin-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .admin-main { margin-left: 0; width: 100%; padding: 20px; }
          .page-header h1 { font-size: 1.3rem; }
          .results-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-page">
        <nav className="admin-navbar">
          <div className="admin-logo-wrap">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              {sidebarOpen ? Icons.close : Icons.menu}
            </button>
            <div className="admin-logo-box"><BrandLogo /></div>
            <span className="admin-brand">CPSU E-Voting</span>
          </div>
          <div className="admin-user">
            <span className="admin-user-name">CPSU Administrator</span>
            <button className="admin-logout" onClick={handleLogout}>Log out</button>
          </div>
        </nav>

        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        <div className="admin-layout">
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-label">Administration</div>
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path} className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                {item.icon}{item.label}
              </Link>
            ))}
            <div className="admin-sidebar-settings"><ThemeSettings /></div>
          </aside>

          <main className="admin-main">
            <div className="page-header">
              <h1>Election Results</h1>
              <p>View vote statistics and outcomes for each election</p>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            {loading ? (
              <p className="loading-state">Loading elections...</p>
            ) : elections.length === 0 ? (
              <p className="empty-state">No elections available.</p>
            ) : (
              <div className="results-grid">
                {elections.map((election) => (
                  <div key={election._id} className="result-card">
                    <div className="result-top">
                      <div className="result-icon">{Icons.chart}</div>
                      <StatusBadge status={election.status} />
                    </div>
                    <h2 className="result-title">{election.title}</h2>
                    <Link to={`/voter/elections/${election._id}/results`} className="result-link">
                      View statistics {Icons.arrowRight}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
