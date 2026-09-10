// src/layouts/AppShell.tsx
// force cache clear
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

/* ─── Shared Icons ─── */
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  elections: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  voters: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
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
        .admin-brand { color: white; font-weight: 600; font-size: 1.05rem; letter-spacing: 0.02em; text-decoration: none; }
        .admin-user { display: flex; align-items: center; gap: 16px; }
        .admin-user-name { color: #a7f3d0; font-size: 0.9rem; font-weight: 500; }
        .header-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.35); background: #c5d7d3; color: #0e4643; display: grid; place-items: center; font-weight: 800; font-size: .78rem; }
        .admin-logout { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .admin-logout:hover { background: rgba(255,255,255,0.2); }
        .menu-btn { display: none; background: none; border: none; color: white; cursor: pointer; padding: 4px; margin-right: 8px; }
        
        /* Layout */
        .admin-layout { display: flex; }
        
        /* Sidebar */
        .admin-sidebar { width: 256px; min-height: calc(100vh - 64px); background: #ffffff; border-right: 1px solid #deece9; padding: 20px 0; position: fixed; top: 64px; left: 0; z-index: 40; transition: transform 0.3s ease; }
        .sidebar-label { padding: 0 20px 14px; font-size: 0.7rem; font-weight: 800; color: #71817e; text-transform: uppercase; letter-spacing: 0.08em; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 18px; margin: 0 10px; border-radius: 11px; color: #49605c; text-decoration: none; font-weight: 500; font-size: 0.88rem; transition: all 0.2s; }
        .sidebar-link:hover { background: #f8fafc; color: #0f766e; }
        .sidebar-link.active { background: #f0fdfa; color: #0f766e; font-weight: 600; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        
        /* Main */
        .admin-main { margin-left: 256px; padding: 32px 40px 48px; width: calc(100% - 256px); box-sizing: border-box; min-height: calc(100vh - 64px); }

        @media (max-width: 768px) {
          .menu-btn { display: flex; }
          .admin-brand { display: none; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .admin-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .admin-main { margin-left: 0; width: 100%; padding: 24px 20px 40px; }
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
            <NavLink className="admin-brand" to={isAdmin ? "/admin/dashboard" : "/voter/dashboard"}>
              CPSU E-Voting
            </NavLink>
          </div>
          <div className="admin-user">
            {user?.avatarUrl ? <img className="header-avatar" src={user.avatarUrl} alt="Profile avatar" /> : <span className="header-avatar">{user?.firstName?.[0] ?? "C"}{user?.lastName?.[0] ?? ""}</span>}
            <span className="admin-user-name">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : (isAdmin ? "CPSU Administrator" : "CPSU Student")}
            </span>
            <button className="admin-logout" onClick={handleLogout}>Log out</button>
          </div>
        </nav>

        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        <div className="admin-layout">
          {/* Sidebar */}
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-label">{isAdmin ? "Administration" : "Voter Portal"}</div>
            
            {isAdmin ? (
              <>
                <NavLink to="/admin/dashboard" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.dashboard} Dashboard
                </NavLink>
                <NavLink to="/admin/elections" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.elections} Elections
                </NavLink>
                <NavLink to="/admin/voters" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.voters} Voters
                </NavLink>
                <NavLink to="/admin/audit-logs" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.audit} Audit Logs
                </NavLink>
                <NavLink to="/admin/results" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.results} Results
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/voter/dashboard" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.dashboard} Dashboard
                </NavLink>
                <NavLink to="/voter/my-votes" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.file} My Votes
                </NavLink>
                <NavLink to="/voter/results" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.results} Results
                </NavLink>
                <NavLink to="/profile" className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  {Icons.user} Profile
                </NavLink>
              </>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="admin-main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
