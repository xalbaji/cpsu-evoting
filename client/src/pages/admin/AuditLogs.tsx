import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";

interface AuditLog {
  _id: string;
  action: string;
  resource?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
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
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/admin/elections", label: "Elections", icon: Icons.elections },
  { path: "/admin/voters", label: "Voters", icon: Icons.voters },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: Icons.audit },
  { path: "/admin/results", label: "Results", icon: Icons.results },
];

/* ─── Action badge (color-codes common action verbs) ─── */
function actionStyle(action: string) {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("REMOVE")) return { color: "#dc2626", bg: "#fee2e2" };
  if (a.includes("CREATE") || a.includes("ADD") || a.includes("IMPORT")) return { color: "#0d9488", bg: "#f0fdfa" };
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("PATCH")) return { color: "#2563eb", bg: "#dbeafe" };
  if (a.includes("LOGIN") || a.includes("LOGOUT") || a.includes("AUTH")) return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#64748b", bg: "#f1f5f9" };
}

function ActionBadge({ action }: { action: string }) {
  const s = actionStyle(action);
  return (
    <span className="action-badge" style={{ color: s.color, background: s.bg }}>
      {action}
    </span>
  );
}

export default function AuditLogs() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadLogs() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/audit-logs", { params: { search } });
      setLogs(response.data.data);
    } catch {
      setError("Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <>
      <style>{`
        .admin-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }

        /* Navbar */
        .admin-navbar { background: #0f3d3e; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .admin-logo-wrap { display: flex; align-items: center; gap: 12px; }
        .admin-logo-box { width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 5px; box-sizing: border-box; flex-shrink: 0; }
        .admin-logo-box img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .admin-brand { color: white; font-weight: 600; font-size: 1.05rem; letter-spacing: 0.02em; }
        .admin-user { display: flex; align-items: center; gap: 16px; }
        .admin-user-name { color: #a7f3d0; font-size: 0.9rem; font-weight: 500; }
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

        .admin-main { margin-left: 250px; padding: 28px 32px; width: calc(100% - 250px); box-sizing: border-box; min-height: calc(100vh - 64px); }
        .page-header { margin-bottom: 24px; }
        .page-header h1 { font-size: 1.6rem; font-weight: 700; color: #0f3d3e; margin: 0 0 4px 0; letter-spacing: -0.01em; }
        .page-header p { color: #64748b; font-size: 0.9rem; margin: 0; }

        .panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 22px; }
        .panel-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; }

        /* Search */
        .search-row { display: flex; gap: 10px; max-width: 480px; }
        .search-row input { flex: 1; border: 1px solid #cbd5e1; border-radius: 9px; padding: 10px 14px; font-size: 0.88rem; font-family: inherit; box-sizing: border-box; }
        .search-row input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }

        .btn { border: none; border-radius: 9px; padding: 10px 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
        .btn-primary { background: #0d9488; color: white; }
        .btn-primary:hover { background: #0f766e; }

        .error-banner { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 16px; }

        /* Table */
        .table-wrap { overflow-x: auto; }
        table.audit-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .audit-table thead th { text-align: left; color: #94a3b8; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .audit-table tbody td { padding: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        .audit-table tbody tr:hover { background: #f8fafc; }
        .action-badge { font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .resource-tag { color: #64748b; font-size: 0.82rem; }
        .log-time { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.8rem; white-space: nowrap; }
        .log-ip { font-family: "SF Mono", "Consolas", monospace; font-size: 0.78rem; color: #94a3b8; }

        .empty-state, .loading-state { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 30px 0; }

        @media (max-width: 768px) {
          .menu-btn { display: flex; }
          .admin-brand { display: none; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .admin-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .admin-main { margin-left: 0; width: 100%; padding: 20px; }
          .page-header h1 { font-size: 1.3rem; }
          .search-row { max-width: 100%; }
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
          </aside>

          <main className="admin-main">
            <div className="page-header">
              <h1>Audit Logs</h1>
              <p>Track administrative actions and system activity</p>
            </div>

            {/* Search */}
            <div className="panel">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  loadLogs();
                }}
                className="search-row"
              >
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Action, resource, or description"
                />
                <button type="submit" className="btn btn-primary">
                  {Icons.search} Search
                </button>
              </form>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            {/* Log table */}
            <div className="panel">
              <h2 className="panel-title">Activity Log</h2>

              {loading ? (
                <p className="loading-state">Loading audit logs...</p>
              ) : logs.length === 0 ? (
                <p className="empty-state">No audit logs found.</p>
              ) : (
                <div className="table-wrap">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Description</th>
                        <th>IP address</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td><ActionBadge action={log.action} /></td>
                          <td><span className="resource-tag">{log.resource ?? "-"}</span></td>
                          <td>{log.description}</td>
                          <td><span className="log-ip">{log.ipAddress ?? "-"}</span></td>
                          <td>
                            <span className="log-time">
                              {Icons.clock}
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}