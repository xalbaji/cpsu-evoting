import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import BrandLogo from "../../../components/BrandLogo";

interface Stats {
  totalVoters: number;
  activeElections: number;
  completedElections: number;
  totalVotes: number;
  voterTurnout: number;
}

/* ─── Icons ─── */
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  elections: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  voters: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  usersAction: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/admin/elections", label: "Elections", icon: Icons.elections },
  { path: "/admin/voters", label: "Voters", icon: Icons.voters },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: Icons.audit },
  { path: "/admin/results", label: "Results", icon: Icons.results },
];

/* ─── Stat Card ─── */
function StatCard({ value, label, icon, badge, badgeColor, badgeBg, iconBg, iconColor }: any) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon-wrap" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <span className="stat-badge" style={{ color: badgeColor, background: badgeBg }}>{badge}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── Circular Progress ─── */
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-ring">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#0d9488" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="progress-text">
        <div className="progress-percent">{percentage.toFixed(2)}%</div>
      </div>
    </div>
  );
}

/* ─── Quick Action ─── */
function QuickAction({ icon, iconBg, iconColor, title, description, onClick }: any) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className="quick-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div>
        <div className="quick-title">{title}</div>
        <div className="quick-desc">{description}</div>
      </div>
    </button>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((response: any) => {
        setStats(response.data.data);
      })
      .catch(() => {
        setError("Unable to load dashboard statistics.");
      });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (error) {
    return (
      <div className="admin-page">
        <div className="error-state">
          <p role="alert">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-page">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

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
        
        /* Sidebar */
        .admin-sidebar { width: 250px; min-height: calc(100vh - 64px); background: #ffffff; border-right: 1px solid #e2e8f0; padding: 20px 0; position: fixed; top: 64px; left: 0; z-index: 40; transition: transform 0.3s ease; }
        .sidebar-label { padding: 0 20px 14px; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 18px; margin: 0 10px; border-radius: 10px; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.88rem; transition: all 0.2s; }
        .sidebar-link:hover { background: #f8fafc; color: #0f766e; }
        .sidebar-link.active { background: #f0fdfa; color: #0f766e; font-weight: 600; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        
        /* Main */
        .admin-main { margin-left: 250px; padding: 28px 32px; width: calc(100% - 250px); box-sizing: border-box; min-height: calc(100vh - 64px); }
        .page-header { margin-bottom: 24px; }
        .page-header h1 { font-size: 1.6rem; font-weight: 700; color: #0f3d3e; margin: 0 0 4px 0; letter-spacing: -0.01em; }
        .page-header p { color: #64748b; font-size: 0.9rem; margin: 0; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; }
        .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s; cursor: default; }
        .stat-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .stat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .stat-icon-wrap { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .stat-badge { font-size: 0.7rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .stat-value { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
        .stat-label { font-size: 0.85rem; color: #64748b; font-weight: 500; }
        
        /* Bottom Grid */
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .panel-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 20px 0; }
        
        /* Progress Ring */
        .progress-ring { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
        .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .progress-percent { font-size: 1.25rem; font-weight: 700; color: #0f172a; }
        .turnout-row { display: flex; align-items: center; gap: 22px; }
        .turnout-details { flex: 1; }
        .turnout-status { font-size: 0.85rem; color: #64748b; margin-bottom: 10px; line-height: 1.5; }
        .turnout-meta { display: flex; align-items: center; gap: 8px; }
        .turnout-dot { width: 8px; height: 8px; background: #0d9488; border-radius: 50%; }
        .turnout-meta span { font-size: 0.78rem; color: #94a3b8; }
        
        /* Quick Actions */
        .quick-action { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%; font-family: inherit; }
        .quick-action:hover { background: #f0fdfa; border-color: #99f6e4; }
        .quick-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-title { font-weight: 600; color: #0f172a; font-size: 0.88rem; margin-bottom: 2px; }
        .quick-desc { font-size: 0.78rem; color: #94a3b8; }
        .quick-actions { display: flex; flex-direction: column; gap: 10px; }
        
        /* Loading / Error */
        .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #64748b; font-size: 1rem; }
        .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 16px; color: #dc2626; }
        .error-state button { padding: 10px 24px; background: #0d9488; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .menu-btn { display: flex; }
          .admin-brand { display: none; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .admin-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .admin-main { margin-left: 0; width: 100%; padding: 20px; }
          .stats-grid { grid-template-columns: 1fr; }
          .bottom-grid { grid-template-columns: 1fr; }
          .page-header h1 { font-size: 1.3rem; }
          .turnout-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="admin-page">
        {/* Navbar */}
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
          {/* Sidebar */}
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-label">Administration</div>
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path} className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                {item.icon}{item.label}
              </Link>
            ))}
          </aside>

          {/* Main */}
          <main className="admin-main">
            <div className="page-header">
              <h1>Admin Dashboard</h1>
              <p>Overview of your election system</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <StatCard value={stats.totalVoters} label="Total Voters" icon={Icons.users} badge="+2 today" badgeColor="#0d9488" badgeBg="#f0fdfa" iconBg="#f0fdfa" iconColor="#0d9488" />
              <StatCard value={stats.activeElections} label="Active Elections" icon={Icons.clock} badge="Active" badgeColor="#d97706" badgeBg="#fef3c7" iconBg="#fef3c7" iconColor="#d97706" />
              <StatCard value={stats.completedElections} label="Completed" icon={Icons.check} badge="Done" badgeColor="#64748b" badgeBg="#f1f5f9" iconBg="#f1f5f9" iconColor="#64748b" />
              <StatCard value={stats.totalVotes} label="Votes Cast" icon={Icons.file} badge="Live" badgeColor="#0d9488" badgeBg="#f0fdfa" iconBg="#f0fdfa" iconColor="#0d9488" />
            </div>

            {/* Bottom */}
            <div className="bottom-grid">
              <div className="panel">
                <h3 className="panel-title">Voter Turnout</h3>
                <div className="turnout-row">
                  <CircularProgress percentage={stats.voterTurnout} />
                  <div className="turnout-details">
                    <div className="turnout-status">
                      {stats.totalVotes === 0
                        ? "No votes have been cast yet. Start an election to begin tracking turnout."
                        : `${stats.totalVotes} of ${stats.totalVoters} voters have participated.`}
                    </div>
                    <div className="turnout-meta">
                      <div className="turnout-dot" />
                      <span>{stats.totalVotes} of {stats.totalVoters} voters</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3 className="panel-title">Quick Actions</h3>
                <div className="quick-actions">
                  <QuickAction icon={Icons.shield} iconBg="#f0fdfa" iconColor="#0d9488" title="Manage Elections" description="Create or edit active elections" onClick={() => navigate("/admin/elections")} />
                  <QuickAction icon={Icons.usersAction} iconBg="#fef3c7" iconColor="#d97706" title="Manage Voters" description="Add or remove voter accounts" onClick={() => navigate("/admin/voters")} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}